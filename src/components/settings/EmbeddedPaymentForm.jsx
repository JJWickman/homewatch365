import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Use live publishable key - must match the live secret key
const stripePromise = loadStripe('pk_live_51QjbjyCnIACp9uPu0sW1qgm4nj7zTnTICdgRqhDMZRSKe02J3TScY7KBsFQoRODg0sH7HllqIGPg9zWQTVc5BfK300gPP5I4Dw');

function PaymentForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit the form data to create the payment method
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      // Confirm the setup
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message);
        setLoading(false);
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        onSuccess();
      } else {
        setError('Payment setup failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        onReady={() => setIsReady(true)}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || !isReady || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : !isReady ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            'Save Payment Method'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function EmbeddedPaymentForm({ company, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('EmbeddedPaymentForm mounted, company:', company);
    loadSetupIntent();
  }, []);

  const loadSetupIntent = async () => {
    console.log('Starting loadSetupIntent...');
    try {
      const response = await base44.functions.invoke('createSetupIntent', {
        company_id: company.id
      });
      
      console.log('createSetupIntent response:', response);
      
      if (response.data.success) {
        console.log('Got clientSecret:', response.data.clientSecret);
        setClientSecret(response.data.clientSecret);
      } else {
        console.error('Failed to initialize payment form');
        setError('Failed to initialize payment form');
      }
    } catch (err) {
      console.error('Error in loadSetupIntent:', err);
      setError(err.message);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  console.log('Render state - loading:', loading, 'clientSecret:', clientSecret, 'error:', error);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading || !clientSecret) {
    console.log('Showing loading spinner');
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  console.log('Rendering Elements with clientSecret:', clientSecret);

  return (
    <Elements 
      key={clientSecret}
      stripe={stripePromise} 
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
          }
        }
      }}
    >
      <PaymentForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}