import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductServiceWizard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [tenant, setTenant] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    visit_type: 'check-in',
    base_price: ''
  });

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.primary_tenant_id) {
        const tenants = await base44.entities.Tenant.filter({ id: user.primary_tenant_id });
        if (tenants.length > 0) setTenant(tenants[0]);

        let prods = await base44.entities.ProductService.filter({ tenant_id: user.primary_tenant_id });
        
        // Auto-seed defaults if tenant has no products
        if (prods.length === 0) {
          try {
            const res = await base44.functions.invoke('seedDefaultProducts', {});
            if (res.data?.success) {
              // Re-fetch after seeding
              prods = await base44.entities.ProductService.filter({ tenant_id: user.primary_tenant_id });
            }
          } catch (error) {
            console.error('Seed error:', error);
          }
        }
        
        setProducts(prods.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.visit_type || !form.base_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAdding(true);
    try {
      const newProduct = await base44.entities.ProductService.create({
        tenant_id: tenant.id,
        name: form.name,
        description: form.description,
        visit_type: form.visit_type,
        type: 'addon',
        base_price: parseFloat(form.base_price),
        is_active: true
      });

      setProducts([newProduct, ...products]);
      setForm({ name: '', description: '', visit_type: 'check-in', base_price: '' });
      setShowForm(false);
      toast.success('Service added successfully');
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    setDeleting(id);
    try {
      await base44.entities.ProductService.delete(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Service deleted');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

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
    <div className="space-y-6">
      {/* Existing Products List */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Visit Services ({products.length})</span>
              <Button 
                size="sm" 
                onClick={() => setShowForm(!showForm)}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{product.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {visitTypeLabels[product.visit_type] || product.visit_type}
                      </span>
                      <span className="font-semibold text-slate-900">${product.base_price.toFixed(2)}/visit</span>
                      {!product.is_active && <span className="text-orange-600 text-xs font-medium">Inactive</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled
                      title="Edit coming soon"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add Service Form */}
      {(showForm || products.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{products.length === 0 ? 'Add Your First Service' : 'Add a New Service'}</CardTitle>
          </CardHeader>
          <CardContent>
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
                {products.length > 0 && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit"
                  disabled={adding}
                  className="bg-slate-900 hover:bg-slate-800 ml-auto"
                >
                  {adding ? 'Adding...' : 'Add Service'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {products.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-600 mb-4">No services added yet. Create your first one to get started.</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}