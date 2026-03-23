import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ApproveFounder() {
  const navigate = useNavigate();

  useEffect(() => {
    // After Base44 processes the invitation approval, redirect to onboarding
    navigate(createPageUrl('CompanyOnboarding'), { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-600">Setting up your account...</p>
      </div>
    </div>
  );
}