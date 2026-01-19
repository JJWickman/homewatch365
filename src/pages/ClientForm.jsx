import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, Mail, Phone, MapPin, CreditCard, Save, X, Package
} from 'lucide-react';
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
    notes: '',
    is_active: true
  });
  
  const [availableServices, setAvailableServices] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  
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
        
        // Load available products/services
        const allItems = await base44.entities.ProductService.filter({ 
          company_id: compId,
          is_active: true 
        });
        
        // Separate services and products
        setAvailableServices(allItems.filter(item => item.type === 'service'));
        setAvailableProducts(allItems.filter(item => item.type === 'product'));
      }

      // Check if editing existing client
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      
      if (id) {
        setClientId(id);
        const clients = await base44.entities.Client.filter({ id });
        if (clients.length > 0) {
          const client = clients[0];
          setFormData({
            first_name: client.first_name || '',
            last_name: client.last_name || '',
            email: client.email || '',
            phone: client.phone || '',
            secondary_phone: client.secondary_phone || '',
            address: client.address || '',
            city: client.city || '',
            state: client.state || '',
            zip: client.zip || '',
            service_subscription_id: client.service_subscription_id || '',
            additional_products: client.additional_products || [],
            monthly_rate: client.monthly_rate || '',
            billing_frequency: client.billing_frequency || 'monthly',
            portal_access: client.portal_access !== false,
            notes: client.notes || '',
            is_active: client.is_active !== false
          });
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
            {/* Service Subscription */}
            <div>
              <Label className="flex items-center gap-2 mb-3 text-base">
                <CreditCard className="h-4 w-4" />
                Service Subscription
              </Label>
              {availableServices.length === 0 ? (
                <p className="text-sm text-slate-500">No service subscriptions available. Add them in Settings → Products & Services.</p>
              ) : (
                <Select
                  value={formData.service_subscription_id}
                  onValueChange={(value) => handleChange('service_subscription_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service subscription..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{service.name}</span>
                          <span className="ml-4 text-slate-500">${service.price}/{service.billing_frequency}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Additional Products */}
            <div>
              <Label className="flex items-center gap-2 mb-3 text-base">
                <Package className="h-4 w-4" />
                Additional Products & Services
              </Label>
              {availableProducts.length === 0 ? (
                <p className="text-sm text-slate-500">No additional products available.</p>
              ) : (
                <div className="space-y-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {availableProducts.map((product) => (
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
                            <p className="font-semibold text-sm">${product.price}</p>
                            <p className="text-xs text-slate-500 capitalize">{product.billing_frequency.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_rate">Custom Monthly Rate ($)</Label>
                <Input
                  id="monthly_rate"
                  type="number"
                  step="0.01"
                  value={formData.monthly_rate}
                  onChange={(e) => handleChange('monthly_rate', e.target.value)}
                  placeholder="Leave empty to use product prices"
                />
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
          </CardContent>
        </Card>

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
    </div>
  );
}