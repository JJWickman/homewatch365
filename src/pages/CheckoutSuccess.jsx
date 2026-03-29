import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (!sessionId) {
      setError('No checkout session found');
      setStatus('error');
      return;
    }

    // Poll for tenant subscription to be activated by webhook
    const pollTenantStatus = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.primary_tenant_id) {
          setPollingAttempts(prev => prev + 1);
          return false;
        }

        const tenants = await base44.entities.Tenant.filter({ id: user.primary_tenant_id });
        if (tenants.length > 0) {
          const tenant = tenants[0];
          // Check if subscription status is active (webhook has processed)
          if (tenant.subscription_status === 'active' || tenant.subscription_status === 'trial') {
            return true; // Ready to proceed
          }
        }
        setPollingAttempts(prev => prev + 1);
        return false;
      } catch (err) {
        console.error('Error polling tenant status:', err);
        setPollingAttempts(prev => prev + 1);
        return false;
      }
    };

    // Poll every 500ms for up to 120 seconds
    // Webhook creates the tenant and sets primary_tenant_id on user after payment
    const startPolling = async () => {
      let isReady = false;
      let attempts = 0;
      let finalUser = null;
      const maxAttempts = 240;

      while (attempts < maxAttempts) {
        finalUser = await base44.auth.me();
        if (finalUser?.primary_tenant_id) {
          isReady = true;
          break;
        }
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }

      if (isReady && finalUser) {
        const tenants = await base44.entities.Tenant.filter({ id: finalUser.primary_tenant_id });
        if (tenants.length > 0) {
          window.location.href = `/?tenant=${tenants[0].slug}`;
        } else {
          window.location.href = '/';
        }
      } else {
        setError('Setup took too long. Please refresh or contact support.');
        setStatus('error');
      }
    };

    startPolling();
  }, [navigate]);



  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Setup Issue</h2>
          <p className="text-blue-200 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Loader2 className="h-12 w-12 text-green-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Payment Received!</h2>
        <p className="text-blue-200 text-sm mb-2">We're setting up your account...</p>
        <p className="text-blue-300 text-xs opacity-75">This may take a few moments.</p>
      </div>
    </div>
  );
}