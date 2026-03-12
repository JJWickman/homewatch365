import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const PRICING_MODELS = [
  { 
    value: 'flat_rate', 
    label: 'Flat Rate',
    description: 'Fixed price regardless of usage'
  },
  { 
    value: 'tiered', 
    label: 'Tiered',
    description: 'Different prices at different quantity levels'
  },
  { 
    value: 'usage_based', 
    label: 'Usage-Based',
    description: 'Price varies based on usage metrics'
  }
];

const BILLING_FREQUENCIES = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
];

export default function PricingModelSelector({ service, onUpdate }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing Model</CardTitle>
          <CardDescription>Choose how your service will be priced</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRICING_MODELS.map(model => (
              <div
                key={model.value}
                onClick={() => onUpdate({ pricing_model: model.value })}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  service.pricing_model === model.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <h4 className="font-semibold text-sm">{model.label}</h4>
                <p className="text-xs text-slate-600 mt-1">{model.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Base Price ($) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                value={service.base_price || ''}
                onChange={(e) => onUpdate({ base_price: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="billing_frequency">Billing Frequency *</Label>
              <Select 
                value={service.billing_frequency || 'monthly'} 
                onValueChange={(value) => onUpdate({ billing_frequency: value })}
              >
                <SelectTrigger id="billing_frequency" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_FREQUENCIES.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {service.pricing_model === 'usage_based' && (
            <div>
              <Label htmlFor="usage_unit">Usage Unit *</Label>
              <Input
                id="usage_unit"
                value={service.usage_unit || ''}
                onChange={(e) => onUpdate({ usage_unit: e.target.value })}
                placeholder="e.g., per visit, per hour, per property"
                className="mt-1"
              />
            </div>
          )}

          {service.pricing_model === 'tiered' && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Configure your tiers in the next tab. The base price will be used as the starting tier.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}