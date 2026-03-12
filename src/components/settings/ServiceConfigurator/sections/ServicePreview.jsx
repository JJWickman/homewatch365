import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { DollarSign, Check } from 'lucide-react';

export default function ServicePreview({ service, onSave, isValid, companyId }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    if (!isValid) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const serviceData = {
        company_id: companyId,
        name: service.name,
        description: service.description,
        type: service.type,
        pricing_model: service.pricing_model,
        base_price: parseFloat(service.base_price),
        billing_frequency: service.billing_frequency,
        pricing_tiers: service.pricing_tiers || [],
        usage_unit: service.usage_unit || null,
        add_ons: service.add_ons || [],
        is_active: service.is_active
      };

      const result = await base44.entities.ProductService.create(serviceData);
      setMessage({ type: 'success', text: 'Service created successfully!' });
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save service' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Preview & Summary
        </CardTitle>
        <CardDescription>Review your service configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Service Name</p>
            <p className="text-lg font-semibold mt-1">{service.name || '—'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Type</p>
            <Badge className="mt-2 capitalize">{service.type}</Badge>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Pricing Model</p>
            <p className="text-lg font-semibold mt-1 capitalize">{service.pricing_model?.replace('_', ' ')}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Base Price</p>
            <p className="text-lg font-semibold mt-1">${parseFloat(service.base_price || 0).toFixed(2)}</p>
          </div>

          {service.pricing_model === 'tiered' && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Tiers Configured</p>
              <p className="text-lg font-semibold mt-1">{service.pricing_tiers?.length || 0}</p>
            </div>
          )}

          {service.pricing_model === 'usage_based' && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Usage Unit</p>
              <p className="text-lg font-semibold mt-1">{service.usage_unit || '—'}</p>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 uppercase tracking-wide">Billing Frequency</p>
            <p className="text-lg font-semibold mt-1 capitalize">{service.billing_frequency}</p>
          </div>

          {service.add_ons?.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Add-Ons Available</p>
              <p className="text-lg font-semibold mt-1">{service.add_ons.length}</p>
            </div>
          )}
        </div>

        {service.description && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold mb-2">Description</p>
            <p className="text-sm text-blue-900">{service.description}</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={message.type === 'success' ? 'text-green-900 text-sm' : 'text-red-900 text-sm'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave}
            disabled={!isValid || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Saving...' : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Service
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}