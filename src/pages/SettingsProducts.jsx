import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProductServiceWizard from '@/components/settings/ProductServiceWizard';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const user = await base44.auth.me();
      if (!user?.primary_tenant_id) return;

      // Deduplicate on load
      try {
        await base44.functions.invoke('deduplicateProducts', {});
      } catch (e) {
        console.warn('Dedup failed:', e);
      }

      // Load all products for this tenant
      const prods = await base44.entities.ProductService.filter({
        tenant_id: user.primary_tenant_id
      });
      setProducts(prods.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
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

      {/* Existing Products List */}
      {products.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>Manage your existing service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className="flex items-start justify-between p-4 border rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                    )}
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

      {/* Add New Product */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-slate-900">Add New Product</h2>
        <ProductServiceWizard onProductAdded={loadProducts} />
      </div>
    </div>
  );
}