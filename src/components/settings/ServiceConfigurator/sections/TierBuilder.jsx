import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';

export default function TierBuilder({ tiers, onUpdate }) {
  const [editingId, setEditingId] = useState(null);

  const addTier = () => {
    const newTier = {
      id: `tier_${Date.now()}`,
      name: '',
      unit_price: '',
      min_quantity: '',
      max_quantity: '',
      is_active: true
    };
    onUpdate([...tiers, newTier]);
  };

  const updateTier = (id, updates) => {
    onUpdate(tiers.map(tier => tier.id === id ? { ...tier, ...updates } : tier));
  };

  const deleteTier = (id) => {
    onUpdate(tiers.filter(tier => tier.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing Tiers</CardTitle>
          <CardDescription>Define different price points based on quantity or usage levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tiers.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-slate-50">
              <p className="text-slate-600 mb-4">No tiers yet</p>
              <Button onClick={addTier} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Tier
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tiers.map((tier) => (
                <div key={tier.id} className="p-4 border rounded-lg space-y-3 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <Label className="text-xs">Tier Name</Label>
                      <Input
                        value={tier.name || ''}
                        onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                        placeholder="e.g., Bronze"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Unit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.unit_price || ''}
                        onChange={(e) => updateTier(tier.id, { unit_price: e.target.value })}
                        placeholder="0.00"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Min Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.min_quantity || ''}
                        onChange={(e) => updateTier(tier.id, { min_quantity: e.target.value })}
                        placeholder="e.g., 1"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Max Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.max_quantity || ''}
                        onChange={(e) => updateTier(tier.id, { max_quantity: e.target.value })}
                        placeholder="Unlimited"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTier(tier.id)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={addTier} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Tier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}