import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, DollarSign, Package, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProductServiceWizard from './ProductServiceWizard';
import PriceConfigurator from './PriceConfigurator';
import HomeWatchAcademyDisclaimer from './HomeWatchAcademyDisclaimer';
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

export default function FinancialManagement({ companyId, company }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'subscription',
    pricing_model: 'flat_rate',
    base_price: '',
    billing_frequency: 'monthly',
    is_active: true
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
      pricing_model: product.pricing_model || 'flat_rate',
      base_price: product.base_price?.toString() || '',
      billing_frequency: product.billing_frequency,
      is_active: product.is_active
    });
    setShowDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.base_price) {
      alert('Please fill in all required fields');
      return;
    }

    const productData = {
      company_id: companyId,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      pricing_model: formData.pricing_model,
      base_price: parseFloat(formData.base_price),
      billing_frequency: formData.billing_frequency,
      is_active: formData.is_active
    };

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

  const handleSyncToStripe = async (product) => {
    setSyncingId(product.id);
    setSyncMessage(null);
    try {
      const response = await base44.functions.invoke('syncProductToStripe', {
        product_service_id: product.id,
        company_id: companyId
      });
      if (response.data.success) {
        setSyncMessage({ type: 'success', text: response.data.message });
        loadProducts();
      } else {
        setSyncMessage({ type: 'error', text: response.data.error || 'Sync failed' });
      }
    } catch (error) {
      setSyncMessage({ type: 'error', text: error.message });
    } finally {
      setSyncingId(null);
      setTimeout(() => setSyncMessage(null), 5000);
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
      <HomeWatchAcademyDisclaimer />
      
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
          <div className="text-center py-12 border rounded-lg bg-slate-50">
            <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Service Configurator Coming Soon</p>
            <p className="text-sm text-slate-500">We're building a new service configuration system. Check back soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}