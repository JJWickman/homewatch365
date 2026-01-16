import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Check, Edit2, Smartphone, Banknote } from "lucide-react";

export default function PaymentMethodCard({ company }) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState({
    type: company?.payment_method_type || 'credit_card',
    last4: company?.payment_method_last4 || '',
    cardBrand: company?.payment_method_brand || 'visa',
    zelleEmail: company?.zelle_email || '',
    zellePhone: company?.zelle_phone || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In production, this would call Stripe API or backend
    // For now, just simulate saving
    setTimeout(() => {
      setSaving(false);
      setShowEditDialog(false);
    }, 1000);
  };

  const paymentMethodDisplay = () => {
    if (paymentMethod.type === 'credit_card' && paymentMethod.last4) {
      return (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50">
          <div className="h-10 w-16 rounded bg-white border flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium capitalize">{paymentMethod.cardBrand} •••• {paymentMethod.last4}</p>
            <p className="text-xs text-slate-500">Primary payment method</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit2 className="h-3 w-3 mr-1" />
            Update
          </Button>
        </div>
      );
    }

    if (paymentMethod.type === 'apple_pay') {
      return (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50">
          <div className="h-10 w-16 rounded bg-black flex items-center justify-center">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 11.5c0-2.5 2-3.5 2.1-3.6-1.1-1.6-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.7-3.6z"/>
              <path d="M14.3 3.3c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Apple Pay</p>
            <p className="text-xs text-slate-500">Primary payment method</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit2 className="h-3 w-3 mr-1" />
            Update
          </Button>
        </div>
      );
    }

    if (paymentMethod.type === 'google_pay') {
      return (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50">
          <div className="h-10 w-16 rounded bg-white border flex items-center justify-center">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Google Pay</p>
            <p className="text-xs text-slate-500">Primary payment method</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit2 className="h-3 w-3 mr-1" />
            Update
          </Button>
        </div>
      );
    }

    if (paymentMethod.type === 'zelle' && (paymentMethod.zelleEmail || paymentMethod.zellePhone)) {
      return (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-slate-50">
          <div className="h-10 w-16 rounded bg-[#6D1ED4] flex items-center justify-center">
            <Banknote className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Zelle</p>
            <p className="text-xs text-slate-500">{paymentMethod.zelleEmail || paymentMethod.zellePhone}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit2 className="h-3 w-3 mr-1" />
            Update
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center py-6">
        <p className="text-slate-600 mb-4">No payment method on file</p>
        <Button onClick={() => setShowEditDialog(true)} className="bg-slate-900 hover:bg-slate-800">
          Add Payment Method
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Manage your payment options for subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethodDisplay()}

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Accepted Payment Methods</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50 transition-colors">
                  <CreditCard className="h-5 w-5 text-slate-600" />
                  <p className="text-xs font-medium text-center">Credit Card</p>
                </div>

                <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50 transition-colors">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 11.5c0-2.5 2-3.5 2.1-3.6-1.1-1.6-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.7-3.6z"/>
                    <path d="M14.3 3.3c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/>
                  </svg>
                  <p className="text-xs font-medium text-center">Apple Pay</p>
                </div>

                <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50 transition-colors">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                  <p className="text-xs font-medium text-center">Google Pay</p>
                </div>

                <div className="p-3 border rounded-lg flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50 transition-colors">
                  <Banknote className="h-5 w-5 text-[#6D1ED4]" />
                  <p className="text-xs font-medium text-center">Zelle</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Payment Method Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method for subscriptions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Payment Type</Label>
              <Select
                value={paymentMethod.type}
                onValueChange={(value) => setPaymentMethod(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="apple_pay">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Apple Pay
                    </div>
                  </SelectItem>
                  <SelectItem value="google_pay">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Google Pay
                    </div>
                  </SelectItem>
                  <SelectItem value="zelle">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Zelle
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod.type === 'credit_card' && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label>Card Number</Label>
                  <Input
                    placeholder="•••• •••• •••• 4242"
                    value={paymentMethod.last4}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, last4: e.target.value.slice(-4) }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Expiry Date</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input placeholder="123" type="password" maxLength={3} />
                  </div>
                </div>
                <div>
                  <Label>Card Brand</Label>
                  <Select
                    value={paymentMethod.cardBrand}
                    onValueChange={(value) => setPaymentMethod(prev => ({ ...prev, cardBrand: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="discover">Discover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {paymentMethod.type === 'apple_pay' && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 11.5c0-2.5 2-3.5 2.1-3.6-1.1-1.6-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-.9-2.7-3.6z"/>
                      <path d="M14.3 3.3c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Apple Pay</p>
                    <p className="text-xs text-slate-500">Fast, secure, and private</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  You'll be prompted to authenticate with Apple Pay when making a payment.
                </p>
              </div>
            )}

            {paymentMethod.type === 'google_pay' && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-white border flex items-center justify-center">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Google Pay</p>
                    <p className="text-xs text-slate-500">Simple and secure</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  You'll be prompted to authenticate with Google Pay when making a payment.
                </p>
              </div>
            )}

            {paymentMethod.type === 'zelle' && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-[#6D1ED4] flex items-center justify-center">
                    <Banknote className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Zelle</p>
                    <p className="text-xs text-slate-500">Bank-to-bank transfer</p>
                  </div>
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={paymentMethod.zelleEmail}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, zelleEmail: e.target.value }))}
                  />
                </div>
                <div className="text-center text-sm text-slate-500">or</div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={paymentMethod.zellePhone}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, zellePhone: e.target.value }))}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Provide the email or phone number associated with your Zelle account.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Check className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}