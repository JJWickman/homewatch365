import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCheckoutSuccess = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.primary_tenant_id) {
          setError('No tenant found');
          return;
        }

        // Poll for subscription status (webhook may take a moment)
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds
        
        while (attempts < maxAttempts) {
          try {
            const tenants = await base44.entities.Tenant.filter({
              id: user.primary_tenant_id
            });

            if (tenants.length > 0) {
              const tenant = tenants[0];
              
              // Check if subscription is active or trial
              if (
                tenant.subscription_status === 'active' ||
                tenant.subscription_status === 'trial'
              ) {
                setStatus('success');
                setTimeout(() => {
                  navigate('/Dashboard');
                }, 1500);
                return;
              }
            }
          } catch (pollErr) {
            console.warn(`Poll attempt ${attempts + 1} failed:`, pollErr.message);
          }

          // Wait 1 second before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        setError('Subscription activation is taking longer than expected. Please refresh or go to the dashboard.');
      } catch (err) {
        console.error('Checkout success error:', err);
        setError('Payment completed but we cannot verify your subscription. Please refresh the page.');
      }
    };

    handleCheckoutSuccess();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-blue-200 text-sm">
              Thank you! We're activating your subscription. You'll be redirected shortly...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-blue-200 text-sm">
              Your subscription is active. Redirecting to dashboard...
            </p>
          </>
        )}

        {error && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification In Progress</h2>
            <p className="text-blue-200 text-sm mb-6">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/Dashboard')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full text-blue-300 hover:text-blue-200 underline text-sm py-2"
              >
                Return to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}