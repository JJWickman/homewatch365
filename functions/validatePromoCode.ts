import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code')?.toUpperCase();

    if (!code) {
      return Response.json({ valid: false, message: 'Promo code is required' });
    }

    // Find the promotion
    const promotions = await base44.entities.Promotion.filter({ code: code });

    if (promotions.length === 0) {
      return Response.json({ valid: false, message: 'Invalid promo code' });
    }

    const promo = promotions[0];

    // Check if active
    if (!promo.is_active) {
      return Response.json({ valid: false, message: 'This promo code is no longer active' });
    }

    // Check if expired
    if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
      return Response.json({ valid: false, message: 'This promo code has expired' });
    }

    // Check if max uses reached
    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return Response.json({ valid: false, message: 'This promo code has reached its usage limit' });
    }

    // Build benefit description
    let benefit = '';
    if (promo.benefit_type === 'subscription_discount') {
      if (promo.applicable_plan) {
        benefit = `${promo.discount_percent}% discount on ${promo.applicable_plan} plan`;
      } else {
        // Applies to all plans except Enterprise
        benefit = `${promo.discount_percent}% discount (excludes Enterprise)`;
      }
      if (promo.max_users) {
        benefit += ` (up to ${promo.max_users} users)`;
      }
    } else if (promo.benefit_type === 'extended_trial') {
      benefit = `+${promo.trial_days_added} days extended trial`;
    } else if (promo.benefit_type === 'free_addon') {
      benefit = `Free ${promo.free_addon} for ${promo.addon_months} months`;
    }

    return Response.json({
      valid: true,
      promotion: promo,
      benefit_description: benefit,
      excludes_enterprise: !promo.applicable_plan || promo.code === 'FOUNDER'
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    return Response.json(
      { valid: false, message: 'Unable to validate promo code' },
      { status: 500 }
    );
  }
});