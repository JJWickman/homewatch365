import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone, MapPin, CreditCard, Package, DollarSign, Plus, Save, X, Clock, FileText, Trash2 } from 'lucide-react';
import MonthlyStatementDialog from '@/components/billing/MonthlyStatementDialog';
import { toast } from 'sonner';

export default function ClientForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const currentBillingMonth = new Date().toISOString().slice(0, 7);

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    billing_month: currentBillingMonth
  });

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

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user?.primary_tenant_id) {
        toast.error('No tenant found');
        setLoading(false);
        return;
      }
      setCompanyId(user.primary_tenant_id);
        
      // Load available per-visit services
      try {
        const allItems = await base44.entities.ProductService.filter({ 
          tenant_id: user.primary_tenant_id,
          is_active: true
        });
        setAvailableProducts(allItems);
      } catch (e) {
        console.warn('Failed to load products:', e);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) {
      toast.error('Tenant not loaded');
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Please fill in first name, last name, and email');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        tenant_id: companyId,
        monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
        portal_user_email: formData.portal_access ? formData.email : null
      };

      if (clientId) {
        await base44.entities.Client.update(clientId, data);
      } else {
        await base44.entities.Client.create(data);
      }

      toast.success('Client saved successfully');
      navigate(createPageUrl('Clients'));
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(`Failed to save client: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTransaction = async () => {
    if (!clientId || !companyId || !newTransaction.description || !newTransaction.amount) {
      toast.error('Please fill in all transaction fields');
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
        billing_month: currentBillingMonth
      });
      toast.success('Transaction added');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await base44.entities.ClientTransaction.delete(transactionId);
      setMonthlyTransactions(prev => prev.filter(t => t.id !== transactionId));
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
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
        <Button type="submit" form="client-form" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
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
          </CardContent>
        </Card>

        {/* Monthly Billing Transactions */}
        {clientId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monthly Billing Transactions
              </CardTitle>
              <CardDescription>Add custom items to include in monthly invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Transaction */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <Label className="text-sm font-medium mb-3 block">Add New Item</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Description"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  <Input
                    type="month"
                    value={newTransaction.billing_month}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, billing_month: e.target.value }))}
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleAddTransaction} 
                  className="mt-3"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Current Month Summary */}
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Current Month Bill Preview</Label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowStatementDialog(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Statement
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                   {/* Available Visit Services */}
                   {formData.additional_products?.map(productId => {
                     const product = availableProducts.find(p => p.id === productId);
                     return product ? (
                       <div key={productId} className="flex justify-between">
                         <span className="text-slate-700">{product.name} (per visit)</span>
                         <span className="font-medium">${product.base_price?.toFixed(2)}</span>
                       </div>
                     ) : null;
                   })}
                   
                   {/* Custom Transactions for current month */}
                   {monthlyTransactions
                     .filter(t => t.billing_month === currentBillingMonth)
                     .map(transaction => (
                       <div key={transaction.id} className="flex justify-between">
                         <span className="text-slate-700">{transaction.description}</span>
                         <span className="font-medium">${transaction.amount.toFixed(2)}</span>
                       </div>
                     ))
                   }
                   
                   {/* Total */}
                   <div className="flex justify-between pt-2 border-t border-blue-300 font-bold text-base">
                     <span>Monthly Total:</span>
                     <span className="text-blue-700">
                       ${(() => {
                         let total = 0;
                         
                         // Add available visit services
                         formData.additional_products?.forEach(productId => {
                           const product = availableProducts.find(p => p.id === productId);
                           if (product) total += product.base_price;
                         });
                         
                         // Add transactions
                         monthlyTransactions
                           .filter(t => t.billing_month === currentBillingMonth)
                           .forEach(t => total += t.amount);
                         
                         return total.toFixed(2);
                       })()}
                     </span>
                   </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">All Custom Billing Items</Label>
                {monthlyTransactions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No custom billing items yet</p>
                ) : (
                  monthlyTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(transaction.billing_month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">${transaction.amount.toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any additional notes about this client..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('Clients'))}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>

      {/* Monthly Statement Dialog */}
      <MonthlyStatementDialog
        open={showStatementDialog}
        onOpenChange={setShowStatementDialog}
        clientId={clientId}
        billingMonth={currentBillingMonth}
        onStatementUpdated={() => {
          if (clientId) {
            base44.entities.ClientTransaction.filter({ client_id: clientId }).then(setMonthlyTransactions);
          }
        }}
      />
    </div>
  );
}