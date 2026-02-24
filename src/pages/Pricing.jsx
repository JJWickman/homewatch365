import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Pricing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Settings > Subscription tab
    navigate(createPageUrl('Settings') + '?tab=subscription');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-600">Redirecting to subscription settings...</p>
    </div>
  );
}