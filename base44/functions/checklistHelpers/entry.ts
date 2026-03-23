import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await req.json();

    if (action === 'getTemplate') {
      const { template_code, company_id } = payload;
      const templates = await base44.entities.ChecklistTemplate.filter({
        code: template_code,
        company_id,
        active: true
      });
      
      if (!templates.length) {
        return Response.json({ error: 'Template not found' }, { status: 404 });
      }

      const template = templates[0];
      const sections = await base44.entities.ChecklistTemplateSection.filter({
        template_id: template.id
      });

      const itemsBySection = {};
      for (const section of sections) {
        const items = await base44.entities.ChecklistTemplateItem.filter({
          section_id: section.id
        });
        itemsBySection[section.id] = items;
      }

      return Response.json({
        template,
        sections,
        itemsBySection
      });
    }

    if (action === 'getOrCreateSubmission') {
      const { visit_id, property_id, template_code, company_id, assigned_resource_id } = payload;

      // Check for existing submission
      const existing = await base44.entities.ChecklistSubmission.filter({
        visit_id,
        template_id: template_code
      });

      if (existing.length > 0) {
        const sub = existing[0];
        const items = await base44.entities.ChecklistSubmissionItem.filter({
          submission_id: sub.id
        });
        return Response.json({ submission: sub, items, isNew: false });
      }

      // Get template to find ID
      const templates = await base44.entities.ChecklistTemplate.filter({
        code: template_code,
        company_id
      });

      if (!templates.length) {
        return Response.json({ error: 'Template not found' }, { status: 404 });
      }

      const template = templates[0];
      const submission = await base44.entities.ChecklistSubmission.create({
        template_id: template.id,
        visit_id,
        property_id,
        company_id,
        assigned_resource_id,
        status: 'draft',
        started_at: new Date().toISOString(),
        completion_percent: 0
      });

      return Response.json({ submission, items: [], isNew: true });
    }

    if (action === 'getSubmissionWithItems') {
      const { submission_id } = payload;
      const submission = await base44.entities.ChecklistSubmission.filter({ id: submission_id });
      
      if (!submission.length) {
        return Response.json({ error: 'Submission not found' }, { status: 404 });
      }

      const items = await base44.entities.ChecklistSubmissionItem.filter({
        submission_id
      });

      return Response.json({ submission: submission[0], items });
    }

    if (action === 'saveItemResponse') {
      const { submission_id, template_item_id, response_value, issue_flag, severity, note, photo_urls, numeric_value } = payload;

      const existing = await base44.entities.ChecklistSubmissionItem.filter({
        submission_id,
        template_item_id
      });

      const itemData = {
        submission_id,
        template_item_id,
        response_value: response_value || null,
        issue_flag: issue_flag || false,
        severity: severity || null,
        note: note || null,
        photo_urls: photo_urls || [],
        numeric_value: numeric_value || null
      };

      if (existing.length > 0) {
        await base44.entities.ChecklistSubmissionItem.update(existing[0].id, itemData);
      } else {
        await base44.entities.ChecklistSubmissionItem.create(itemData);
      }

      return Response.json({ success: true });
    }

    if (action === 'calculateCompletion') {
      const { submission_id, company_id } = payload;

      const submission = await base44.entities.ChecklistSubmission.filter({ id: submission_id });
      if (!submission.length) {
        return Response.json({ error: 'Submission not found' }, { status: 404 });
      }

      const sub = submission[0];

      // Get template items
      const items = await base44.entities.ChecklistTemplateItem.filter({
        template_id: sub.template_id
      });

      // Filter actionable items only (exclude instruction_only)
      const actionableItems = items.filter(i => i.response_type !== 'instruction_only');

      // Get responses
      const responses = await base44.entities.ChecklistSubmissionItem.filter({
        submission_id: sub.id
      });

      const responseMap = {};
      responses.forEach(r => {
        responseMap[r.template_item_id] = r;
      });

      // Count completed items
      let completed = 0;
      actionableItems.forEach(item => {
        const resp = responseMap[item.id];
        if (resp && (resp.response_value !== null || resp.numeric_value !== null || (resp.photo_urls && resp.photo_urls.length > 0))) {
          completed++;
        }
      });

      const percent = actionableItems.length > 0 ? Math.round((completed / actionableItems.length) * 100) : 0;

      // Update submission
      await base44.entities.ChecklistSubmission.update(sub.id, {
        completion_percent: percent
      });

      return Response.json({ completion_percent: percent, actionableItems: actionableItems.length, completedItems: completed });
    }

    if (action === 'validateSubmission') {
      const { submission_id } = payload;

      const submission = await base44.entities.ChecklistSubmission.filter({ id: submission_id });
      if (!submission.length) {
        return Response.json({ error: 'Submission not found' }, { status: 404 });
      }

      const sub = submission[0];

      // Get template items with sections
      const items = await base44.entities.ChecklistTemplateItem.filter({
        template_id: sub.template_id
      });

      const sections = await base44.entities.ChecklistTemplateSection.filter({
        template_id: sub.template_id
      });

      const responses = await base44.entities.ChecklistSubmissionItem.filter({
        submission_id: sub.id
      });

      const responseMap = {};
      responses.forEach(r => {
        responseMap[r.template_item_id] = r;
      });

      const errors = [];

      items.forEach(item => {
        if (item.response_type === 'instruction_only') return;

        const resp = responseMap[item.id];
        const answered = resp && (resp.response_value !== null || resp.numeric_value !== null || (resp.photo_urls && resp.photo_urls.length > 0));

        if (item.required && !answered) {
          const section = sections.find(s => s.id === item.section_id);
          errors.push({
            section: section?.title || 'Unknown',
            item: item.label,
            error: 'This item is required'
          });
        }

        // If issue and note required
        if (resp && resp.issue_flag && item.allow_note && !resp.note) {
          const section = sections.find(s => s.id === item.section_id);
          errors.push({
            section: section?.title || 'Unknown',
            item: item.label,
            error: 'Note required when issue flagged'
          });
        }

        // If photo_only and required
        if (item.response_type === 'photo_only' && item.required && (!resp || !resp.photo_urls || resp.photo_urls.length === 0)) {
          const section = sections.find(s => s.id === item.section_id);
          errors.push({
            section: section?.title || 'Unknown',
            item: item.label,
            error: 'At least one photo is required'
          });
        }
      });

      return Response.json({
        valid: errors.length === 0,
        errors
      });
    }

    if (action === 'submitChecklist') {
      const { submission_id } = payload;

      const submission = await base44.entities.ChecklistSubmission.filter({ id: submission_id });
      if (!submission.length) {
        return Response.json({ error: 'Submission not found' }, { status: 404 });
      }

      // Update submission status
      await base44.entities.ChecklistSubmission.update(submission_id, {
        status: 'submitted',
        completed_at: new Date().toISOString(),
        completion_percent: 100
      });

      return Response.json({ success: true, message: 'Checklist submitted successfully' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});