import React, { useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

export default function TrialBanner({ company, companyMember }) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createBillingPortalSession');
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating billing portal session:', error);
    } finally {
      setLoading(false);
    }
  };
  if (!company || company.subscription_status !== 'trial' || !company.trial_ends_at) {
    return null;
  }

  const daysRemaining = Math.ceil((new Date(company.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 3;
  const isExpired = daysRemaining < 0;

  if (isExpired) {
    return (
      <Alert className="mb-6 bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-900 flex items-center justify-between">
          <span>
            <strong>Trial Expired:</strong> Your trial has ended. Subscribe to continue using Estate Watch.
          </span>
          {companyMember?.is_owner && (
            <Button 
              onClick={handleManageSubscription}
              disabled={loading}
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white ml-4"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isExpiringSoon) {
    return null; // Don't show banner if more than 3 days remaining
  }

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <Clock className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-900 flex items-center justify-between">
        <span>
          <strong>Trial Ending Soon:</strong> {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your free trial.
        </span>
        {companyMember?.is_owner && (
          <Button 
            onClick={handleManageSubscription}
            disabled={loading}
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white ml-4"
          >
            {loading ? 'Loading...' : 'View Plans'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}