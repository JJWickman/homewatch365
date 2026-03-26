import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    visit_type: 'check-in',
    base_price: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const user = await base44.auth.me();
      console.log('Current user:', user?.id, 'Primary tenant:', user?.primary_tenant_id);
      
      if (!user?.primary_tenant_id) {
        console.error('User has no primary_tenant_id');
        setLoading(false);
        return;
      }

      const prods = await base44.entities.ProductService.filter({
        tenant_id: user.primary_tenant_id
      });
      console.log('Products loaded:', prods?.length || 0);
      setProducts(prods?.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)) || []);
    } catch (error) {
      console.error('Error loading products:', error?.message || error);
      toast.error('Failed to load products: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

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
        visit_type: form.visit_type,
        base_price: parseFloat(form.base_price),
        type: 'addon',
        is_active: true
      });
      
      setForm({
        name: '',
        visit_type: 'check-in',
        base_price: ''
      });
      setShowForm(false);
      toast.success('Product added');
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await base44.entities.ProductService.delete(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Products & Services" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Products & Services"
        subtitle="Configure the services you offer to clients"
      />

      {products.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className="flex items-start justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                      <span>Type: <strong>{product.visit_type?.replace(/_/g, ' ')}</strong></span>
                      <span>Price: <strong>${product.base_price}</strong></span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{showForm ? 'Add Product' : 'New Product'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-slate-900 hover:bg-slate-800 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="Product name"
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
                      <SelectItem value="check-in">Check-In</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="pre_storm">Pre-Storm</SelectItem>
                      <SelectItem value="post_storm">Post-Storm</SelectItem>
                      <SelectItem value="arrival_departure">Arrival/Departure</SelectItem>
                      <SelectItem value="access_visit">Access Visit</SelectItem>
                      <SelectItem value="emergency_visit">Emergency</SelectItem>
                      <SelectItem value="damage_recovery">Damage Recovery</SelectItem>
                      <SelectItem value="auto_care">Auto Care</SelectItem>
                      <SelectItem value="client_service">Client Service</SelectItem>
                      <SelectItem value="concierge">Concierge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
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
                  {adding ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}