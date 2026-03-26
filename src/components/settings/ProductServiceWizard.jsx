import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductServiceWizard({ onProductAdded }) {
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    visit_type: 'check-in',
    base_price: ''
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.base_price) {
      toast.error('Please fill in required fields');
      return;
    }

    setAdding(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.ProductService.create({
        tenant_id: user.primary_tenant_id,
        name: form.name,
        description: form.description,
        visit_type: form.visit_type,
        base_price: parseFloat(form.base_price),
        type: 'addon',
        is_active: true
      });
      
      setForm({
        name: '',
        description: '',
        visit_type: 'check-in',
        base_price: ''
      });
      setShowForm(false);
      toast.success('Service added');
      if (onProductAdded) onProductAdded();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    } finally {
      setAdding(false);
    }
  };

  const visitTypeLabels = {
    'check-in': 'Standard Check-In',
    'followup': 'Follow-up',
    'pre_storm': 'Pre-Storm Prep',
    'post_storm': 'Post-Storm Assessment',
    'arrival_departure': 'Arrival/Departure',
    'access_visit': 'Contractor Access',
    'emergency_visit': 'Emergency Response',
    'damage_recovery': 'Damage Recovery',
    'auto_care': 'Vehicle Care',
    'client_service': 'Client Service',
    'concierge': 'Concierge Service'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{showForm ? 'Add a New Service' : 'Create New Service'}</CardTitle>
      </CardHeader>
      <CardContent>
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-slate-900 hover:bg-slate-800 w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="e.g., Standard Home Watch Visit"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                placeholder="Describe this service..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visit_type">Visit Type *</Label>
                <Select value={form.visit_type} onValueChange={(val) => setForm({...form, visit_type: val})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(visitTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price Per Visit *</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => setForm({...form, base_price: e.target.value})}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm text-blue-900">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Your clients will be charged this amount per visit. Adjust pricing based on property size and complexity.</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={adding}
                className="bg-slate-900 hover:bg-slate-800 ml-auto"
              >
                {adding ? 'Adding...' : 'Add Service'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}