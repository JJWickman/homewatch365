import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Prevent sample data creation in production
    const allowSampleData = Deno.env.get('ALLOW_SAMPLE_DATA');
    if (allowSampleData !== 'true') {
      return Response.json({ 
        error: 'Sample data creation is disabled in production. Set ALLOW_SAMPLE_DATA=true environment variable to enable.' 
      }, { status: 403 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tenant
    const tenantId = user.primary_tenant_id;
    if (!tenantId) {
      return Response.json({ error: 'No tenant found' }, { status: 404 });
    }

    // Check if products already exist
    const existing = await base44.entities.ProductService.filter({ tenant_id: tenantId });
    if (existing.length > 0) {
      return Response.json({ 
        success: false, 
        message: 'Sample products already exist. Delete existing products first.' 
      });
    }

    // Create sample products and services
    const sampleData = [
      {
        tenant_id: tenantId,
        name: 'Monthly Property Visit Service',
        description: 'Standard monthly property inspection and monitoring service',
        type: 'service',
        price: 199,
        billing_frequency: 'monthly',
        category: 'Inspection',
        is_active: true
      },
      {
        tenant_id: tenantId,
        name: 'Bi-Weekly Property Visit Service',
        description: 'Enhanced bi-weekly property inspection and monitoring service',
        type: 'service',
        price: 299,
        billing_frequency: 'monthly',
        category: 'Inspection',
        is_active: true
      },
      {
        tenant_id: tenantId,
        name: 'Premium Monthly Visit Service',
        description: 'Premium monthly property inspection with detailed reporting',
        type: 'service',
        price: 249,
        billing_frequency: 'monthly',
        category: 'Inspection',
        is_active: true
      },
      {
        tenant_id: tenantId,
        name: 'Follow-up or Issue Resolution',
        description: 'Additional follow-up visit for issue resolution or contractor coordination',
        type: 'service',
        price: 50,
        billing_frequency: 'one_time',
        category: 'Follow-up',
        is_active: true
      },
      {
        tenant_id: tenantId,
        name: 'Smart Moisture Monitor System',
        description: 'Advanced moisture monitoring system for early leak detection and water damage prevention',
        type: 'product',
        price: 999,
        billing_frequency: 'one_time',
        category: 'Smart Home',
        is_active: true
      },
      {
        tenant_id: tenantId,
        name: 'Smart Water Supply Meter System',
        description: 'Real-time water usage monitoring and leak detection system',
        type: 'product',
        price: 499,
        billing_frequency: 'one_time',
        category: 'Smart Home',
        is_active: true
      },
      {
        tenant_id: tenantId,
        name: 'Remote Home Monitoring Package',
        description: 'Complete remote monitoring solution including cameras, sensors, and 24/7 access',
        type: 'product',
        price: 1499,
        billing_frequency: 'one_time',
        category: 'Smart Home',
        is_active: true
      }
    ];

    // Create all products
    for (const item of sampleData) {
      await base44.asServiceRole.entities.ProductService.create(item);
    }

    return Response.json({ 
      success: true, 
      message: `Created ${sampleData.length} sample products and services`,
      count: sampleData.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});