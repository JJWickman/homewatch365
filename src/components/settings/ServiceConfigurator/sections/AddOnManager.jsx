import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';

export default function AddOnManager({ addOns, onUpdate }) {
  const addAddOn = () => {
    const newAddOn = {
      id: `addon_${Date.now()}`,
      name: '',
      price: '',
      description: '',
      is_active: true
    };
    onUpdate([...addOns, newAddOn]);
  };

  const updateAddOn = (id, updates) => {
    onUpdate(addOns.map(addon => addon.id === id ? { ...addon, ...updates } : addon));
  };

  const deleteAddOn = (id) => {
    onUpdate(addOns.filter(addon => addon.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Add-Ons</CardTitle>
          <CardDescription>Define optional services or features that can be added to this service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {addOns.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-slate-50">
              <p className="text-slate-600 mb-4">No add-ons yet</p>
              <Button onClick={addAddOn} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Add-On
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addOns.map((addon) => (
                <div key={addon.id} className="p-4 border rounded-lg space-y-3 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Add-On Name</Label>
                      <Input
                        value={addon.name || ''}
                        onChange={(e) => updateAddOn(addon.id, { name: e.target.value })}
                        placeholder="e.g., Extra Property"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addon.price || ''}
                        onChange={(e) => updateAddOn(addon.id, { price: e.target.value })}
                        placeholder="0.00"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAddOn(addon.id)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Description (optional)</Label>
                    <Input
                      value={addon.description || ''}
                      onChange={(e) => updateAddOn(addon.id, { description: e.target.value })}
                      placeholder="Brief description of this add-on"
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              ))}

              <Button onClick={addAddOn} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Add-On
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}