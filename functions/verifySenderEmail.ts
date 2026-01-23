import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, email, action } = await req.json();

    if (action === 'request_verification') {
      // Request sender verification from SendGrid
      const sgResponse = await fetch('https://api.sendgrid.com/v3/verified_senders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nickname: `${company_id.slice(-8)}_billing`,
          from_email: email,
          from_name: 'Billing',
          reply_to: email,
          reply_to_name: 'Billing',
          address: '',
          city: '',
          state: '',
          zip: '',
          country: 'United States'
        })
      });

      const sgData = await sgResponse.json();

      if (!sgResponse.ok) {
        console.error('SendGrid error:', sgData);
        return Response.json({ 
          error: 'Failed to request verification', 
          details: sgData.errors?.[0]?.message || sgData.message 
        }, { status: 400 });
      }

      // Update company with pending verification
      await base44.asServiceRole.entities.Company.update(company_id, {
        billing_email: email,
        billing_email_verified: false,
        sendgrid_sender_id: sgData.id
      });

      return Response.json({
        success: true,
        message: 'Verification email sent. Please check your inbox and click the verification link.',
        sender_id: sgData.id
      });
    }

    if (action === 'check_verification') {
      // Check if email is verified
      const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
      const company = companies[0];

      if (!company?.sendgrid_sender_id) {
        return Response.json({ verified: false, message: 'No verification pending' });
      }

      const sgResponse = await fetch(`https://api.sendgrid.com/v3/verified_senders/${company.sendgrid_sender_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`
        }
      });

      const sgData = await sgResponse.json();

      if (sgData.verified) {
        // Update company as verified
        await base44.asServiceRole.entities.Company.update(company_id, {
          billing_email_verified: true
        });

        return Response.json({
          verified: true,
          message: 'Email verified successfully!'
        });
      }

      return Response.json({
        verified: false,
        message: 'Email not yet verified. Please check your inbox for the verification link.'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});