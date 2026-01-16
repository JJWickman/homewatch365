import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company members to find the company_id
    const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
    if (members.length === 0) {
      return Response.json({ error: 'No company found' }, { status: 400 });
    }

    const companyId = members[0].company_id;

    // Fetch all inspections and follow-ups
    const inspections = await base44.entities.Inspection.filter({ company_id: companyId }) || [];
    const followUps = await base44.entities.FollowUp.filter({ company_id: companyId }) || [];

    const visitsToCreate = [];

    // Convert inspections to visits
    for (const inspection of inspections) {
      visitsToCreate.push({
        company_id: inspection.company_id,
        property_id: inspection.property_id,
        client_id: inspection.client_id,
        visit_type: 'inspection',
        inspection_type: inspection.type || 'routine',
        template_id: inspection.template_id || null,
        assigned_to: inspection.assigned_to || null,
        assigned_to_name: inspection.assigned_to_name || null,
        scheduled_date: inspection.scheduled_date,
        scheduled_time: inspection.scheduled_time || null,
        status: inspection.status,
        checklist_data: inspection.checklist_data || [],
        overall_status: inspection.overall_status || 'all_clear',
        issues_found: inspection.issues_found || [],
        summary_notes: inspection.summary_notes || null,
        photo_urls: [],
        photo_count: inspection.photo_count || 0,
        completed_at: inspection.completed_at || null,
        completed_by: inspection.completed_by || null,
        start_location: inspection.start_location || null,
        end_location: inspection.end_location || null,
        report_url: inspection.report_url || null,
        client_notified: inspection.client_notified || false,
        client_notified_at: inspection.client_notified_at || null
      });
    }

    // Convert follow-ups to visits
    for (const followUp of followUps) {
      visitsToCreate.push({
        company_id: followUp.company_id,
        property_id: followUp.property_id,
        client_id: followUp.client_id,
        visit_type: 'followup',
        title: followUp.title,
        description: followUp.description || null,
        followup_type: followUp.type || 'issue',
        followup_category: followUp.follow_up_category || 'general',
        priority: followUp.priority || 'medium',
        status: followUp.status || 'open',
        assigned_to: followUp.assigned_to || null,
        assigned_to_name: followUp.assigned_to_name || null,
        scheduled_date: followUp.due_date || new Date().toISOString().split('T')[0],
        scheduled_time: followUp.due_time || null,
        completed_at: followUp.completed_at || null,
        completed_by: followUp.completed_by || null,
        is_recurring: followUp.is_recurring || false,
        recurrence_pattern: followUp.recurrence_pattern || null,
        photo_urls: followUp.photo_urls || [],
        photo_count: (followUp.photo_urls || []).length,
        estimated_duration_minutes: followUp.estimated_duration_minutes || null,
        billable: followUp.billable || false,
        billable_amount: followUp.billable_amount || null
      });
    }

    if (visitsToCreate.length === 0) {
      return Response.json({ 
        message: 'No data to migrate',
        inspections: 0,
        followUps: 0,
        visitsCreated: 0
      });
    }

    // Create all visits
    if (visitsToCreate.length > 0) {
      await base44.entities.Visit.bulkCreate(visitsToCreate);
    }

    return Response.json({
      message: 'Migration completed successfully',
      inspections: inspections.length,
      followUps: followUps.length,
      visitsCreated: visitsToCreate.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});