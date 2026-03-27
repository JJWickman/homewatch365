import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          setStatus('error');
          setError('No session ID found');
          return;
        }

        const response = await base44.functions.invoke('verifyCheckoutSession', { sessionId });
        
        if (response.data.success) {
          setStatus('success');
          setTimeout(() => navigate('/Dashboard'), 2000);
        } else {
          setStatus('error');
          setError(response.data.error || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Error verifying checkout:', err);
        setStatus('error');
        setError(err.message || 'Failed to verify payment');
      }
    };

    verifyAndRedirect();
  }, [navigate]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
          <Loader2 className="h-12 w-12 text-blue-300 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">Verifying Payment</h2>
          <p className="text-blue-200 text-sm">Please wait while we confirm your purchase...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Error</h2>
          <p className="text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('/Billing')}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            Back to Billing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Payment Received!</h2>
        <p className="text-blue-200 text-sm mb-4">
          Thank you! Your subscription is being activated. Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}