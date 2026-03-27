import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 max-w-md text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Payment Received!</h2>
        <p className="text-blue-200 text-sm mb-4">
          Thank you for your purchase. We're activating your subscription and you'll be redirected to your dashboard in a moment.
        </p>
        <button
          onClick={() => navigate('/Dashboard')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}