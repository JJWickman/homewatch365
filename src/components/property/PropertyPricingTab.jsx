import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PAYMENT_TERMS = [
  { value: 'per_visit', label: 'Per Visit' },
  { value: 'monthly', label: 'Monthly (as incurred)' },
  { value: 'annual_prepay', label: 'Annual Pre-Pay' }
];

export default function PropertyPricingTab({ propertyId, companyId, property }) {
  const DEFAULT_PRICING = {
    base_price: 60,
    water_zones: 0,
    visit_frequency: 'freq_1',
    payment_terms: 'per_visit',
    selected_add_ons: [],
    notes: ''
  };

  const [pricing, setPricing] = useState(
    property?.custom_fields?.pricing || DEFAULT_PRICING
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAddOnToggle = (addonId) => {
    setPricing(prev => ({
      ...prev,
      selected_add_ons: prev.selected_add_ons.includes(addonId)
        ? prev.selected_add_ons.filter(id => id !== addonId)
        : [...prev.selected_add_ons, addonId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updatedCustomFields = { ...(property?.custom_fields || {}), pricing };
      await base44.entities.Property.update(propertyId, { custom_fields: updatedCustomFields });
      setMessage({ type: 'success', text: 'Pricing saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save pricing' });
    } finally {
      setSaving(false);
    }
  };

  const calculateMonthlyEstimate = () => {
    const baseWithZones = pricing.base_price + (pricing.water_zones * 15);
    const frequency = pricing.visit_frequency === 'freq_1' ? 4.5 : pricing.visit_frequency === 'freq_2' ? 3 : 2;
    return (baseWithZones * frequency).toFixed(2);
  };



  const VISIT_FREQUENCIES = [
    { id: 'freq_1', label: '4-5 per Month' },
    { id: 'freq_2', label: '3 per Month' },
    { id: 'freq_3', label: '2 per Month' }
  ];

  const ADD_ON_SERVICES = [
    { id: 'addon_1', name: 'Vendor Key-In Service', price: 60, unit: 'per service' },
    { id: 'addon_2', name: 'Concierge Services', price: 60, unit: 'per hour' },
    { id: 'addon_3', name: 'Car Drive', price: 45, unit: 'per car/drive' },
    { id: 'addon_4', name: 'Handyman Service and Cleaning', price: null, unit: 'as incurred' },
    { id: 'addon_5', name: 'Emergency Visits', price: null, unit: 'tiered by time' },
    { id: 'addon_6', name: 'Pre & Post-Storm Visit', price: 75, unit: 'per visit' }
  ];

  return (
    <div className="space-y-6">
      {/* Base Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base Service Pricing</CardTitle>
          <CardDescription>
            Configure pricing for this property. Includes 2 BR, 2 BA, Kitchen, 1 Laundry Room.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Base Price Per Visit ($)</Label>
              <Input
                id="base_price"
                type="number"
                step="1"
                min="0"
                value={pricing.base_price || ''}
                onChange={(e) => setPricing({ ...pricing, base_price: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="water_zones">Additional Water Zones</Label>
              <Input
                id="water_zones"
                type="number"
                min="0"
                value={pricing.water_zones || ''}
                onChange={(e) => setPricing({ ...pricing, water_zones: parseInt(e.target.value) || 0 })}
                placeholder="e.g., extra bathrooms, laundry rooms"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visit Frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="frequency">How often should we visit?</Label>
            <Select value={pricing.visit_frequency} onValueChange={(value) => setPricing({ ...pricing, visit_frequency: value })}>
              <SelectTrigger id="frequency" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_FREQUENCIES.map(freq => (
                  <SelectItem key={freq.id} value={freq.id}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="payment_terms">How will this be billed?</Label>
            <Select value={pricing.payment_terms} onValueChange={(value) => setPricing({ ...pricing, payment_terms: value })}>
              <SelectTrigger id="payment_terms" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map(term => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Optional Add-Ons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Add-On Services</CardTitle>
          <CardDescription>Select any services this property may want</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ADD_ON_SERVICES.map((addon) => (
            <div key={addon.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={pricing.selected_add_ons.includes(addon.id)}
                onChange={() => handleAddOnToggle(addon.id)}
                className="rounded mt-1"
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{addon.name}</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {addon.price ? `$${addon.price}` : 'Custom pricing'} • {addon.unit}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={pricing.notes || ''}
            onChange={(e) => setPricing({ ...pricing, notes: e.target.value })}
            placeholder="Any special pricing notes for this property..."
            className="w-full p-2 border rounded-lg text-sm min-h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Estimated Monthly Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">${calculateMonthlyEstimate()}</p>
          <p className="text-sm text-slate-600 mt-2">
            Based on {pricing.base_price + (pricing.water_zones * 15)} per visit × {pricing.visit_frequency === 'freq_1' ? '4.5' : pricing.visit_frequency === 'freq_2' ? '3' : '2'} visits/month
          </p>
          {pricing.selected_add_ons.length > 0 && (
            <p className="text-xs text-slate-600 mt-2">
              + Optional add-on services (billed as incurred)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertCircle className={`h-4 w-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <AlertDescription className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      <Button 
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {saving ? 'Saving...' : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Save Pricing Configuration
          </>
        )}
      </Button>
    </div>
  );
}