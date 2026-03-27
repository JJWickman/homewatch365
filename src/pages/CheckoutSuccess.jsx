import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    // After 3 seconds, redirect to dashboard
    // Webhook is handling the actual subscription activation
    const timer = setTimeout(() => {
      navigate('/Dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Payment received — webhook is handling activation
  // This page is display-only; user is redirected to dashboard automatically



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