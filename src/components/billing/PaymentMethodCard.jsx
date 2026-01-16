import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Apple, Smartphone } from 'lucide-react';

export default function PaymentMethodCard({ company }) {
  const paymentMethods = [
    { icon: CreditCard, name: 'Credit Card', supported: true },
    { icon: Apple, name: 'Apple Pay', supported: true },
    { icon: Smartphone, name: 'Google Pay', supported: true }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>Manage your payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            We accept the following payment methods through our secure Stripe payment processor:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <div 
                key={method.name}
                className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50"
              >
                <method.icon className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium">{method.name}</span>
              </div>
            ))}
          </div>

          {company?.stripe_customer_id && (
            <div className="pt-4 border-t">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment method on file
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}