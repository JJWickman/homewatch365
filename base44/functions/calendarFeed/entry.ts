import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    // Get user token from query params for subscription URL
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!userEmail || !token) {
      return new Response('Missing credentials', { status: 401 });
    }

    // Create client and verify token matches user
    const base44 = createClientFromRequest(req);
    
    // Get company membership for this user
    const members = await base44.asServiceRole.entities.CompanyMember.filter({ user_email: userEmail });
    
    if (members.length === 0) {
      return new Response('User not found', { status: 404 });
    }

    // Verify simple token (hash of email)
    const expectedToken = btoa(userEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    if (token !== expectedToken) {
      return new Response('Invalid token', { status: 401 });
    }

    const companyId = members[0].company_id;
    const member = members[0];

    // Fetch inspections assigned to this user or all if manager/owner
    let inspections;
    if (member.role === 'owner' || member.role === 'manager') {
      inspections = await base44.asServiceRole.entities.Inspection.filter({ 
        company_id: companyId,
        status: 'scheduled'
      });
    } else {
      inspections = await base44.asServiceRole.entities.Inspection.filter({ 
        company_id: companyId,
        assigned_to: userEmail,
        status: 'scheduled'
      });
    }

    // Fetch tasks
    let tasks;
    if (member.role === 'owner' || member.role === 'manager') {
      tasks = await base44.asServiceRole.entities.Task.filter({ 
        company_id: companyId,
        status: 'pending'
      });
    } else {
      tasks = await base44.asServiceRole.entities.Task.filter({ 
        company_id: companyId,
        assigned_to: userEmail,
        status: 'pending'
      });
    }

    // Fetch properties for names
    const properties = await base44.asServiceRole.entities.Property.filter({ company_id: companyId });
    const propertyMap = {};
    properties.forEach(p => { propertyMap[p.id] = p; });

    // Build ICS content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Estate Watch//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Estate Watch Schedule
`;

    // Add inspections
    for (const inspection of inspections) {
      const property = propertyMap[inspection.property_id];
      const propertyName = property?.name || property?.address || 'Property';
      const startDate = inspection.scheduled_date.replace(/-/g, '');
      const startTime = inspection.scheduled_time ? inspection.scheduled_time.replace(':', '') + '00' : '090000';
      const endTime = inspection.scheduled_time ? 
        (parseInt(inspection.scheduled_time.split(':')[0]) + 1).toString().padStart(2, '0') + inspection.scheduled_time.split(':')[1] + '00' : 
        '100000';

      icsContent += `BEGIN:VEVENT
UID:inspection-${inspection.id}@estatewatch
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}
DTSTART:${startDate}T${startTime}
DTEND:${startDate}T${endTime}
SUMMARY:🏠 Inspection: ${propertyName}
DESCRIPTION:${inspection.type} inspection at ${propertyName}${property?.address ? '\\n' + property.address : ''}
LOCATION:${property?.address || ''}${property?.city ? ', ' + property.city : ''}${property?.state ? ', ' + property.state : ''}
STATUS:CONFIRMED
END:VEVENT
`;
    }

    // Add tasks
    for (const task of tasks) {
      if (!task.due_date) continue;
      
      const property = propertyMap[task.property_id];
      const propertyName = property?.name || property?.address || '';
      const dueDate = task.due_date.replace(/-/g, '');
      const dueTime = task.due_time ? task.due_time.replace(':', '') + '00' : '090000';
      const endTime = task.due_time ? 
        (parseInt(task.due_time.split(':')[0]) + 1).toString().padStart(2, '0') + task.due_time.split(':')[1] + '00' : 
        '100000';

      icsContent += `BEGIN:VEVENT
UID:task-${task.id}@estatewatch
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}
DTSTART:${dueDate}T${dueTime}
DTEND:${dueDate}T${endTime}
SUMMARY:✅ Task: ${task.title}
DESCRIPTION:${task.description || ''}${propertyName ? '\\nProperty: ' + propertyName : ''}
${property?.address ? `LOCATION:${property.address}${property.city ? ', ' + property.city : ''}${property.state ? ', ' + property.state : ''}` : ''}
STATUS:CONFIRMED
END:VEVENT
`;
    }

    icsContent += 'END:VCALENDAR';

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="estate-watch.ics"'
      }
    });
  } catch (error) {
    console.error('Calendar feed error:', error);
    return new Response('Error generating calendar', { status: 500 });
  }
});