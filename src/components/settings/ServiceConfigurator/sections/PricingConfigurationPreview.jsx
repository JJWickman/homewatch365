import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from 'lucide-react';

export default function PricingConfigurationPreview({ config, companyId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          Pricing Model Summary
        </CardTitle>
        <CardDescription>
          Your home watch pricing template is configured and ready to apply to properties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Configuration Active:</strong> Visit the Property Details page and select the "Pricing" tab to apply this model to each property. Customize per-property variables like base price, water zones, and selected add-ons.
          </AlertDescription>
        </Alert>

        {/* Quick Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Base Service Price</p>
            <p className="text-2xl font-bold mt-2">${config.base_price}</p>
            <p className="text-xs text-slate-600 mt-1">per visit</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Water Zone Add-On</p>
            <p className="text-2xl font-bold mt-2">${config.water_zone_price}</p>
            <p className="text-xs text-slate-600 mt-1">per extra water zone</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Visit Frequency Options</p>
            <p className="text-lg font-bold mt-2">{config.visit_frequencies?.filter(f => f.is_active).length}</p>
            <p className="text-xs text-slate-600 mt-1">frequency tiers available</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border">
            <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold">Add-On Services</p>
            <p className="text-lg font-bold mt-2">{config.add_ons?.filter(a => a.is_active).length}</p>
            <p className="text-xs text-slate-600 mt-1">optional services available</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
          <ol className="text-sm text-blue-900 space-y-1 list-decimal list-inside">
            <li>Go to any Property in the Properties list</li>
            <li>Open Property Details and click the "Pricing" tab</li>
            <li>Fill out the pricing configuration for that property</li>
            <li>This pricing will be used when creating invoices for that property</li>
            <li>Multi-property pricing is automatically aggregated in client invoices</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}