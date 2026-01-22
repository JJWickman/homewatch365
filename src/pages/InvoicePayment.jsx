import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function PaymentForm({ statement, client, company, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await base44.functions.invoke('createInvoicePaymentIntent', {
        statement_id: statement.id
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment intent');
      }

      const { clientSecret } = response.data;

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${client.first_name} ${client.last_name}`,
            email: client.email,
            address: {
              line1: client.address,
              city: client.city,
              state: client.state,
              postal_code: client.zip
            }
          }
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Update statement status
        await base44.functions.invoke('recordInvoicePayment', {
          statement_id: statement.id,
          payment_intent_id: paymentIntent.id
        });

        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-slate-50 rounded-lg">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay ${statement.total.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-slate-500">
        Your payment is secure and encrypted
      </p>
    </form>
  );
}

export default function InvoicePayment() {
  const [statement, setStatement] = useState(null);
  const [client, setClient] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvoiceData();
  }, []);

  const loadInvoiceData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const statementId = urlParams.get('statement_id');

      if (!statementId) {
        throw new Error('Invalid payment link');
      }

      // Get statement
      const statements = await base44.entities.MonthlyStatement.filter({ id: statementId });
      if (statements.length === 0) {
        throw new Error('Invoice not found');
      }

      const stmt = statements[0];
      setStatement(stmt);

      if (stmt.status === 'paid') {
        setPaid(true);
      }

      // Get client and company
      const [clients, companies] = await Promise.all([
        base44.entities.Client.filter({ id: stmt.client_id }),
        base44.entities.Company.filter({ id: stmt.company_id })
      ]);

      setClient(clients[0]);
      setCompany(companies[0]);
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-slate-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Payment Complete</h2>
              <p className="text-slate-600 mb-4">
                Thank you for your payment! Your invoice has been marked as paid.
              </p>
              <p className="text-sm text-slate-500">
                Invoice #{statement.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {company?.logo_url && (
            <img 
              src={company.logo_url} 
              alt={company.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-slate-900">{company?.name}</h1>
          <p className="text-slate-600">Secure Invoice Payment</p>
        </div>

        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Invoice #{statement.id.slice(0, 8).toUpperCase()} • {statement.billing_month}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Bill To:</span>
              <span className="font-medium">{client.first_name} {client.last_name}</span>
            </div>

            {statement.line_items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{item.description}</span>
                <span className="font-medium">${item.amount.toFixed(2)}</span>
              </div>
            ))}

            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span>${statement.subtotal.toFixed(2)}</span>
              </div>
              {statement.tax_amount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span>${statement.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                <span>Total Amount</span>
                <span>${statement.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Enter your card details to complete payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise}>
              <PaymentForm 
                statement={statement}
                client={client}
                company={company}
                onSuccess={() => setPaid(true)}
              />
            </Elements>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>Powered by Stripe • Secure & Encrypted</p>
        </div>
      </div>
    </div>
  );
}