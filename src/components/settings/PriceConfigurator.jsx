import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Zap, Layers } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PRICING_MODELS = [
  {
    id: 'flat_rate',
    name: 'Flat Rate',
    description: 'Fixed price regardless of volume',
    icon: '$'
  },
  {
    id: 'tiered',
    name: 'Tiered Pricing',
    description: 'Different prices for different quantities',
    icon: '📊'
  },
  {
    id: 'usage_based',
    name: 'Usage-Based',
    description: 'Price based on actual usage',
    icon: '⚡'
  }
];

const PriceConfigurator = ({ product, onChange }) => {
  const [selectedModel, setSelectedModel] = useState(product?.pricing_model || 'flat_rate');
  const [tiers, setTiers] = useState(product?.pricing_tiers || []);
  const [newTier, setNewTier] = useState({ name: '', unit_price: '', min_quantity: '', max_quantity: '' });

  const handleAddTier = () => {
    if (newTier.name && newTier.unit_price) {
      setTiers([...tiers, { ...newTier, unit_price: parseFloat(newTier.unit_price), is_active: true }]);
      setNewTier({ name: '', unit_price: '', min_quantity: '', max_quantity: '' });
    }
  };

  const handleRemoveTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    onChange({ ...product, pricing_model: model });
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div>
        <Label className="text-base font-semibold mb-4 block">Pricing Model</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRICING_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedModel === model.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">{model.icon}</div>
              <p className="font-semibold text-sm">{model.name}</p>
              <p className="text-xs text-slate-600 mt-1">{model.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Flat Rate Configuration */}
      {selectedModel === 'flat_rate' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flat Rate Pricing</CardTitle>
            <CardDescription>Set a fixed price for this product/service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Base Price</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product?.base_price || ''}
                  onChange={(e) => onChange({ ...product, base_price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tiered Pricing Configuration */}
      {selectedModel === 'tiered' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Tiered Pricing
            </CardTitle>
            <CardDescription>Create pricing tiers for volume discounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                Set up multiple price points. Customers get the price for the tier matching their quantity.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div key={idx} className="p-4 border rounded-lg flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-sm text-slate-600">
                      ${tier.unit_price.toFixed(2)} per unit
                      {tier.min_quantity && ` • Min: ${tier.min_quantity}`}
                      {tier.max_quantity && ` • Max: ${tier.max_quantity}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveTier(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <Label className="text-base font-semibold">Add New Tier</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Tier name (e.g., Bronze)"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit price"
                    value={newTier.unit_price}
                    onChange={(e) => setNewTier({ ...newTier, unit_price: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min quantity"
                  value={newTier.min_quantity}
                  onChange={(e) => setNewTier({ ...newTier, min_quantity: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max quantity (optional)"
                  value={newTier.max_quantity}
                  onChange={(e) => setNewTier({ ...newTier, max_quantity: e.target.value })}
                />
              </div>
              <Button
                onClick={handleAddTier}
                disabled={!newTier.name || !newTier.unit_price}
                className="w-full bg-slate-900 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage-Based Pricing Configuration */}
      {selectedModel === 'usage_based' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Usage-Based Pricing
            </CardTitle>
            <CardDescription>Charge customers based on actual usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Price Per Unit</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={product?.base_price || ''}
                  onChange={(e) => onChange({ ...product, base_price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <Label>Unit of Measurement</Label>
              <Select
                value={product?.usage_unit || ''}
                onValueChange={(value) => onChange({ ...product, usage_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_visit">Per Visit</SelectItem>
                  <SelectItem value="per_property">Per Property</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="per_day">Per Day</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add-On Charges (for subscriptions) */}
      {product?.type === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add-On Charges</CardTitle>
            <CardDescription>Set prices for optional add-ons to this subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Extra Visit Charge</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label>Emergency Call Charge</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PriceConfigurator;