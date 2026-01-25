import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, DollarSign, Package, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProductServiceWizard from './ProductServiceWizard';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const VISIT_TYPES = [
  { id: 'inspection', label: 'Inspections', subtypes: ['routine', 'customer_called_in', 'drop_in', 'other'] },
  { id: 'followup', label: 'Follow-ups', subtypes: [] },
  { id: 'pre_storm', label: 'Pre-Storm Visits', subtypes: [] },
  { id: 'post_storm', label: 'Post-Storm Visits', subtypes: [] }
];

const VisitTypesConfig = ({ visitTypes, onChange }) => {
  const handleToggle = (visitType, inspectionSubtype = null) => {
    const existing = visitTypes.find(
      vt => vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
    );

    if (existing) {
      onChange(visitTypes.map(vt =>
        vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
          ? { ...vt, included: !vt.included }
          : vt
      ));
    } else {
      onChange([
        ...visitTypes,
        {
          visit_type: visitType,
          inspection_subtype: inspectionSubtype,
          included: true,
          extra_charge: 0
        }
      ]);
    }
  };

  const handleChargeChange = (visitType, inspectionSubtype, charge) => {
    const existing = visitTypes.find(
      vt => vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
    );

    if (existing) {
      onChange(visitTypes.map(vt =>
        vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
          ? { ...vt, extra_charge: parseFloat(charge) || 0 }
          : vt
      ));
    }
  };

  const getVisitTypeState = (visitType, inspectionSubtype = null) => {
    return visitTypes.find(
      vt => vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
    ) || { included: false, extra_charge: 0 };
  };

  return (
    <div className="space-y-3">
      {VISIT_TYPES.map(visitType => {
        if (visitType.subtypes.length === 0) {
          const state = getVisitTypeState(visitType.id);
          return (
            <div key={visitType.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.included}
                  onChange={() => handleToggle(visitType.id)}
                  className="rounded"
                />
                <Label className="mb-0 text-sm font-medium">{visitType.label}</Label>
              </div>
              {!state.included && (
                <div className="ml-6 flex items-center gap-2">
                  <Label className="text-xs text-slate-600">Extra Charge: $</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.extra_charge}
                    onChange={(e) => handleChargeChange(visitType.id, null, e.target.value)}
                    className="w-20 h-7 text-xs"
                  />
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};

export default function FinancialManagement({ companyId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'subscription',
    inspection_frequency: 'weekly',
    price: '',
    billing_frequency: 'monthly',
    included_pre_storm_visits: 0,
    included_post_storm_visits: 0,
    is_active: true,
    included_visit_types: []
  });

  const MAX_PRODUCTS = 25;

  useEffect(() => {
    loadProducts();
  }, [companyId]);

  const loadProducts = async () => {
    try {
      const data = await base44.entities.ProductService.filter({ 
        company_id: companyId 
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (products.length >= MAX_PRODUCTS) {
      alert(`You have reached the maximum of ${MAX_PRODUCTS} products/services for your plan.`);
      return;
    }
    setShowWizard(true);
  };

  const handleWizardComplete = async (data) => {
    try {
      await base44.entities.ProductService.create({
        company_id: companyId,
        ...data
      });
      setShowWizard(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product/service');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      type: product.type,
      inspection_frequency: product.inspection_frequency || 'weekly',
      price: product.price.toString(),
      billing_frequency: product.billing_frequency,
      included_pre_storm_visits: product.included_pre_storm_visits || 0,
      included_post_storm_visits: product.included_post_storm_visits || 0,
      is_active: product.is_active,
      included_visit_types: product.included_visit_types || []
    });
    setShowDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    const productData = {
      company_id: companyId,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      price: parseFloat(formData.price),
      billing_frequency: formData.billing_frequency,
      is_active: formData.is_active,
      included_visit_types: formData.included_visit_types
    };

    if (formData.type === 'subscription') {
      productData.inspection_frequency = formData.inspection_frequency;
      productData.included_pre_storm_visits = parseInt(formData.included_pre_storm_visits) || 0;
      productData.included_post_storm_visits = parseInt(formData.included_post_storm_visits) || 0;
    }

    try {
      if (editingProduct) {
        await base44.entities.ProductService.update(editingProduct.id, productData);
      } else {
        await base44.entities.ProductService.create(productData);
      }
      setShowDialog(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product/service');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      await base44.entities.ProductService.delete(deletingProduct.id);
      setShowDeleteDialog(false);
      setDeletingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product/service');
    }
  };

  const handleCreateSamples = async () => {
    setLoadingSample(true);
    try {
      const response = await base44.functions.invoke('createSampleProducts');
      if (response.data.success) {
        loadProducts();
      } else {
        alert(response.data.message || 'Failed to create sample products');
      }
    } catch (error) {
      console.error('Error creating samples:', error);
      alert('Failed to create sample products');
    } finally {
      setLoadingSample(false);
    }
  };

  const getBillingFrequencyLabel = (frequency) => {
    const labels = {
      one_time: 'One-time',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annually: 'Annually'
    };
    return labels[frequency] || frequency;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Products & Services
            </CardTitle>
            <CardDescription>
              Manage your billable products and services ({products.length}/{MAX_PRODUCTS} used)
            </CardDescription>
          </div>
          <Button 
            onClick={handleAddProduct}
            disabled={products.length >= MAX_PRODUCTS}
            className="bg-slate-900 hover:bg-slate-800 sm:shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Product/Service</span>
            <span className="sm:hidden">Add New</span>
          </Button>
        </CardHeader>
        <CardContent>
          {products.length >= MAX_PRODUCTS && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                You have reached the maximum of {MAX_PRODUCTS} products/services. Delete existing items to add new ones.
              </AlertDescription>
            </Alert>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-slate-50">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No products or services yet</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleAddProduct} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product/Service
                </Button>
                <Button 
                  onClick={handleCreateSamples} 
                  variant="outline"
                  disabled={loadingSample}
                >
                  {loadingSample ? 'Creating...' : 'Load Sample Data'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Plans */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Subscription Plans</h3>
                <div className="space-y-3">
                  {products.filter(p => p.type === 'subscription').map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge variant="outline" className="capitalize">
                            {product.inspection_frequency?.replace('_', '-')}
                          </Badge>
                          {!product.is_active && (
                            <Badge variant="outline" className="bg-slate-100">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="font-medium text-slate-900">
                            ${product.price.toFixed(2)}
                          </span>
                          <span>•</span>
                          <span>{getBillingFrequencyLabel(product.billing_frequency)}</span>
                          {(product.included_pre_storm_visits > 0 || product.included_post_storm_visits > 0) && (
                            <>
                              <span>•</span>
                              <span>
                                {product.included_pre_storm_visits} Pre-Storm, {product.included_post_storm_visits} Post-Storm
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingProduct(product);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {products.filter(p => p.type === 'subscription').length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 border rounded-lg bg-slate-50">No subscription plans yet</p>
                  )}
                </div>
              </div>

              {/* Add-On Services */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Add-On Products or Services</h3>
                <div className="space-y-3">
                  {products.filter(p => p.type === 'addon').map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge variant="outline">Add-On</Badge>
                          {!product.is_active && (
                            <Badge variant="outline" className="bg-slate-100">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="font-medium text-slate-900">
                            ${product.price.toFixed(2)}
                          </span>
                          <span>•</span>
                          <span>{getBillingFrequencyLabel(product.billing_frequency)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingProduct(product);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {products.filter(p => p.type === 'addon').length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 border rounded-lg bg-slate-50">No add-on services yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-2xl">
          <ProductServiceWizard 
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product/Service' : 'Add Product/Service'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the product or service information'
                : 'Create a new billable product or service'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Inspection"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this product or service..."
                className="min-h-20"
              />
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription Plan</SelectItem>
                  <SelectItem value="addon">Add-On Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'subscription' && (
              <div>
                <Label>Inspection Frequency *</Label>
                <Select
                  value={formData.inspection_frequency}
                  onValueChange={(value) => setFormData({ ...formData, inspection_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              <div>
                <Label>Billing Frequency</Label>
                <Select
                  value={formData.billing_frequency}
                  onValueChange={(value) => setFormData({ ...formData, billing_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'subscription' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Included Pre-Storm Visits</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.included_pre_storm_visits}
                    onChange={(e) => setFormData({ ...formData, included_pre_storm_visits: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Included Post-Storm Visits</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.included_post_storm_visits}
                    onChange={(e) => setFormData({ ...formData, included_post_storm_visits: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="mb-0 text-sm">
                Active (available for billing)
              </Label>
            </div>

            {formData.type === 'subscription' && (
              <div className="border-t pt-4">
                <Label className="text-base font-semibold">Additional Visit Types Configuration</Label>
                <p className="text-xs text-slate-500 mt-1 mb-3">Configure billing for other inspection types and follow-ups</p>
                <VisitTypesConfig
                  visitTypes={formData.included_visit_types}
                  onChange={(types) => setFormData({ ...formData, included_visit_types: types })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProduct}
              disabled={!formData.name || !formData.price}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {editingProduct ? 'Update' : 'Add'} {formData.type === 'subscription' ? 'Subscription Plan' : 'Add-On Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product/Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteProduct}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}