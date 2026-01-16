import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get company members to find the company_id
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: user.email });
    if (members.length === 0) {
      return Response.json({ error: 'No company found' }, { status: 400 });
    }

    const companyId = members[0].company_id;

    // Fetch all inspections and follow-ups
    const [inspections, followUps] = await Promise.all([
      base44.asServiceRole.entities.Inspection.filter({ company_id: companyId }),
      base44.asServiceRole.entities.FollowUp.filter({ company_id: companyId })
    ]);

    const visitsToCreate = [];

    // Convert inspections to visits
    inspections.forEach(inspection => {
      visitsToCreate.push({
        company_id: inspection.company_id,
        property_id: inspection.property_id,
        client_id: inspection.client_id,
        visit_type: 'inspection',
        inspection_type: inspection.type || 'routine',
        template_id: inspection.template_id,
        assigned_to: inspection.assigned_to,
        assigned_to_name: inspection.assigned_to_name,
        scheduled_date: inspection.scheduled_date,
        scheduled_time: inspection.scheduled_time,
        status: inspection.status,
        checklist_data: inspection.checklist_data,
        overall_status: inspection.overall_status,
        issues_found: inspection.issues_found,
        summary_notes: inspection.summary_notes,
        photo_urls: [],
        photo_count: inspection.photo_count || 0,
        completed_at: inspection.completed_at,
        completed_by: inspection.completed_by,
        start_location: inspection.start_location,
        end_location: inspection.end_location,
        report_url: inspection.report_url,
        client_notified: inspection.client_notified,
        client_notified_at: inspection.client_notified_at
      });
    });

    // Convert follow-ups to visits
    followUps.forEach(followUp => {
      visitsToCreate.push({
        company_id: followUp.company_id,
        property_id: followUp.property_id,
        client_id: followUp.client_id,
        visit_type: 'followup',
        title: followUp.title,
        description: followUp.description,
        followup_type: followUp.type,
        followup_category: followUp.follow_up_category || 'general',
        priority: followUp.priority || 'medium',
        status: followUp.status,
        assigned_to: followUp.assigned_to,
        assigned_to_name: followUp.assigned_to_name,
        scheduled_date: followUp.due_date,
        scheduled_time: followUp.due_time,
        completed_at: followUp.completed_at,
        completed_by: followUp.completed_by,
        is_recurring: followUp.is_recurring,
        recurrence_pattern: followUp.recurrence_pattern,
        photo_urls: followUp.photo_urls || [],
        photo_count: (followUp.photo_urls || []).length,
        estimated_duration_minutes: followUp.estimated_duration_minutes,
        billable: followUp.billable,
        billable_amount: followUp.billable_amount
      });
    });

    if (visitsToCreate.length === 0) {
      return Response.json({ 
        message: 'No data to migrate',
        inspections: 0,
        followUps: 0,
        visitsCreated: 0
      });
    }

    // Create all visits
    await base44.asServiceRole.entities.Visit.bulkCreate(visitsToCreate);

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