import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await req.json();
    const promotionId = event.entity_id;
    const promotionData = event.data;

    // Fetch the promotion record
    const promotion = await base44.asServiceRole.entities.Promotion.get(promotionId);

    if (!promotion) {
      return Response.json({ error: 'Promotion not found' }, { status: 404 });
    }

    // If already synced to Stripe and no critical changes, skip
    if (promotion.stripe_coupon_id && event.type === 'update') {
      // Could add logic here to update existing coupons if needed
      return Response.json({ success: true, message: 'Promotion already synced' });
    }

    let stripeCouponId = promotion.stripe_coupon_id;
    let stripePromotionCodeId = promotion.stripe_promotion_code_id;

    // Create Stripe coupon if not already created
    if (!stripeCouponId) {
      let couponParams = {
        id: `promo_${promotion.code.toLowerCase()}_${Date.now()}`,
      };

      // Add discount or duration based on benefit type
      if (promotion.benefit_type === 'subscription_discount' && promotion.discount_percent > 0) {
        couponParams.percent_off = promotion.discount_percent;
      } else if (promotion.benefit_type === 'extended_trial' && promotion.trial_days_added > 0) {
        couponParams.duration = 'repeating';
        couponParams.duration_in_months = Math.ceil(promotion.trial_days_added / 30);
      }

      if (promotion.expiry_date) {
        couponParams.expires_at = Math.floor(new Date(promotion.expiry_date).getTime() / 1000);
      }

      if (promotion.max_uses) {
        couponParams.max_redemptions = promotion.max_uses;
      }

      const stripeCoupon = await stripe.coupons.create(couponParams);
      stripeCouponId = stripeCoupon.id;
    }

    // Create Stripe promotion code
    if (!stripePromotionCodeId) {
      const stripePromotionCode = await stripe.promotionCodes.create({
        coupon: stripeCouponId,
        code: promotion.code.toUpperCase(),
        active: promotion.is_active,
      });
      stripePromotionCodeId = stripePromotionCode.id;
    }

    // Update promotion record with Stripe IDs
    await base44.asServiceRole.entities.Promotion.update(promotionId, {
      stripe_coupon_id: stripeCouponId,
      stripe_promotion_code_id: stripePromotionCodeId,
    });

    return Response.json({
      success: true,
      stripe_coupon_id: stripeCouponId,
      stripe_promotion_code_id: stripePromotionCodeId,
    });
  } catch (error) {
    console.error('Error syncing promotion to Stripe:', error);
    return Response.json(
      { error: error.message || 'Failed to sync promotion to Stripe' },
      { status: 500 }
    );
  }
});