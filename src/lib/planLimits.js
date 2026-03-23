// Central source of truth for SaaS plan limits.
// These match the metadata set on Stripe products.

export const PLAN_LIMITS = {
  solopreneur: { maxUsers: 1, maxProperties: 50 },
  growth:      { maxUsers: 2, maxProperties: 100 },
  professional: { maxUsers: 5, maxProperties: 500 },
};

// Default for unknown/trial plans — generous so trial users aren't blocked
const DEFAULT_LIMITS = { maxUsers: 999, maxProperties: 999 };

export function getLimits(subscriptionPlan) {
  return PLAN_LIMITS[subscriptionPlan] || DEFAULT_LIMITS;
}