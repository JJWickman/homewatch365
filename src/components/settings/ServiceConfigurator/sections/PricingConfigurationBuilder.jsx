import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PricingConfigurationBuilder({ config, onUpdate }) {
  const handleAddOnToggle = (id) => {
    const updated = config.add_ons.map(addon =>
      addon.id === id ? { ...addon, is_active: !addon.is_active } : addon
    );
    onUpdate({ add_ons: updated });
  };

  const handleAddOnUpdate = (id, updates) => {
    const updated = config.add_ons.map(addon =>
      addon.id === id ? { ...addon, ...updates } : addon
    );
    onUpdate({ add_ons: updated });
  };

  return (
    <div className="space-y-6">
      {/* Base Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Base Service Pricing</CardTitle>
          <CardDescription>
            Includes: 2 Bedrooms, 2 Bathrooms, Kitchen, 1 Laundry Room
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="base_price">Base Price Per Visit ($)</Label>
            <Input
              id="base_price"
              type="number"
              step="1"
              min="0"
              value={config.base_price || ''}
              onChange={(e) => onUpdate({ base_price: parseFloat(e.target.value) })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Water Zones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Water Zone Add-Ons</CardTitle>
          <CardDescription>
            Extra charge for additional bathrooms, laundry rooms, ice-makers, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="water_zone_price">Price Per Extra Water Zone ($)</Label>
            <Input
              id="water_zone_price"
              type="number"
              step="1"
              min="0"
              value={config.water_zone_price || ''}
              onChange={(e) => onUpdate({ water_zone_price: parseFloat(e.target.value) })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visit Frequencies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visit Frequency Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.visit_frequencies?.map((freq) => (
            <div key={freq.id} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
              <input
                type="checkbox"
                checked={freq.is_active}
                onChange={(e) => {
                  const updated = config.visit_frequencies.map(f =>
                    f.id === freq.id ? { ...f, is_active: e.target.checked } : f
                  );
                  onUpdate({ visit_frequencies: updated });
                }}
                className="rounded"
              />
              <span className="font-medium flex-1">{freq.label}</span>
              <span className="text-sm text-slate-600">({freq.visits_per_month} visits/month)</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add-Ons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Add-On Services</CardTitle>
          <CardDescription>
            Services available for properties that want them (billed as incurred)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.add_ons?.map((addon) => (
            <div
              key={addon.id}
              className="p-4 border rounded-lg space-y-3 bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={addon.is_active}
                  onChange={() => handleAddOnToggle(addon.id)}
                  className="rounded mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{addon.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">Unit: {addon.unit}</p>
                </div>
              </div>

              {addon.price !== null && (
                <div className="ml-6">
                  <Label className="text-xs">Price ($)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={addon.price || ''}
                    onChange={(e) => handleAddOnUpdate(addon.id, { price: parseFloat(e.target.value) })}
                    className="mt-1 text-sm"
                  />
                </div>
              )}

              {addon.price === null && (
                <Alert className="ml-6 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-3 w-3 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-900">
                    Pricing configured per property as needed
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}