import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, Mail, Phone, MapPin, CreditCard, Save, X, Package, Plus, Trash2, DollarSign, FileText
} from 'lucide-react';
import MonthlyStatementDialog from '../components/billing/MonthlyStatementDialog';
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from '@/components/shared/PageHeader';
import { useAutoSave } from '@/components/shared/useAutoSave';
import { Clock } from 'lucide-react';

export default function ClientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [clientId, setClientId] = useState(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    service_subscription_id: '',
    additional_products: [],
    monthly_rate: '',
    billing_frequency: 'monthly',
    portal_access: true,
    portal_pin: '',
    notes: '',
    is_active: true
  });
  
  const [availableServices, setAvailableServices] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    billing_month: new Date().toISOString().slice(0, 7)
  });
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [currentBillingMonth, setCurrentBillingMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const autoSaveFunction = async (data) => {
    if (!companyId || !clientId) return;
    const saveData = {
      ...data,
      company_id: companyId,
      monthly_rate: data.monthly_rate ? parseFloat(data.monthly_rate) : null,
      portal_user_email: data.portal_access ? data.email : null
    };
    await base44.entities.Client.update(clientId, saveData);
  };
  
  const { isSaving: isAutoSaving, lastSaved } = useAutoSave(formData, autoSaveFunction, {
    enabled: !!clientId,
    delay: 2000
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const compId = members[0].company_id;
        setCompanyId(compId);
        
        // Load available per-visit services
        const allItems = await base44.entities.ProductService.filter({ 
          tenant_id: user.primary_tenant_id,
          is_active: true
        });
        setAvailableProducts(allItems);
        });
          
          // Load monthly transactions
          const transactions = await base44.entities.ClientTransaction.filter({ 
            client_id: id 
          });
          setMonthlyTransactions(transactions);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        company_id: companyId,
        monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
        portal_user_email: formData.portal_access ? formData.email : null
      };

      if (clientId) {
        await base44.entities.Client.update(clientId, data);
      } else {
        await base44.entities.Client.create(data);
      }

      navigate(createPageUrl('Clients'));
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTransaction = async () => {
    if (!clientId || !companyId || !newTransaction.description || !newTransaction.amount) {
      alert('Please fill in all transaction fields');
      return;
    }

    try {
      const transaction = await base44.entities.ClientTransaction.create({
        company_id: companyId,
        client_id: clientId,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        billing_month: newTransaction.billing_month,
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'custom',
        status: 'pending'
      });
      
      setMonthlyTransactions(prev => [...prev, transaction]);
      setNewTransaction({
        description: '',
        amount: '',
        billing_month: new Date().toISOString().slice(0, 7)
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await base44.entities.ClientTransaction.delete(transactionId);
      setMonthlyTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={clientId ? 'Edit Client' : 'New Client'}
        subtitle="Enter client information and service details"
        backLink="Clients"
        backLabel="Back to Clients"
      >
        <div className="flex items-center gap-3">
          {clientId && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {isAutoSaving ? (
                <span className="text-amber-600">Saving...</span>
              ) : lastSaved ? (
                <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
              ) : (
                <span>Auto-save enabled</span>
              )}
            </div>
          )}
          <Button type="submit" form="client-form" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </PageHeader>

      <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="secondary_phone">Secondary Phone</Label>
              <Input
                id="secondary_phone"
                value={formData.secondary_phone}
                onChange={(e) => handleChange('secondary_phone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Service & Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Per-Visit Services */}
            <div>
              <Label className="flex items-center gap-2 mb-3 text-base">
                <Package className="h-4 w-4" />
                Available Visit Services
              </Label>
              <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                {availableProducts.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">No visit services available - add in Settings</p>
                ) : (
                  availableProducts.map((product) => (
                    <div key={product.id} className="flex items-start gap-3">
                      <Checkbox
                        id={product.id}
                        checked={formData.additional_products.includes(product.id)}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...formData.additional_products, product.id]
                            : formData.additional_products.filter(id => id !== product.id);
                          handleChange('additional_products', updated);
                        }}
                      />
                      <label htmlFor={product.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-sm">${product.base_price?.toFixed(2)}/visit</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
             <Label htmlFor="billing_frequency">Billing Frequency</Label>
             <Select
               value={formData.billing_frequency}
               onValueChange={(value) => handleChange('billing_frequency', value)}
             >
               <SelectTrigger className="w-full sm:w-48">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="monthly">Monthly</SelectItem>
                 <SelectItem value="quarterly">Quarterly</SelectItem>
                 <SelectItem value="annually">Annually</SelectItem>
               </SelectContent>
             </Select>
            </div>

            <div className="flex items-center justify-between py-2">
             <div>
               <Label>Portal Access</Label>
               <p className="text-sm text-slate-500">Allow client to view inspections and reports online</p>
             </div>
             <Switch
               checked={formData.portal_access}
               onCheckedChange={(checked) => handleChange('portal_access', checked)}
             />
            </div>

            {formData.portal_access && (
             <div>
               <Label htmlFor="portal_pin">Portal PIN (6 digits) *</Label>
               <Input
                 id="portal_pin"
                 type="password"
                 maxLength={6}
                 value={formData.portal_pin || ''}
                 onChange={(e) => handleChange('portal_pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                 placeholder="000000"
                 className="text-center text-lg tracking-widest"
               />
               <p className="text-xs text-slate-500 mt-1">Client will use this PIN to access the portal</p>
             </div>
            )}
                </div>
      </form>

      {/* Monthly Statement Dialog */}
      <MonthlyStatementDialog
        open={showStatementDialog}
        onOpenChange={setShowStatementDialog}
        clientId={clientId}
        billingMonth={currentBillingMonth}
        onStatementUpdated={() => {
          // Reload transactions if needed
          if (clientId) {
            base44.entities.ClientTransaction.filter({ client_id: clientId }).then(setMonthlyTransactions);
          }
        }}
      />
    </div>
  );
}