import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Key, Wifi, Phone, Calendar,
  Save, X, Upload, Plus, Trash2, User, AlertCircle, CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '@/components/shared/PageHeader';

export default function PropertyForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [propertyId, setPropertyId] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    property_type: 'single_family',
    status: 'seasonal',
    square_feet: '',
    bedrooms: '',
    bathrooms: '',
    access_instructions: '',
    alarm_code: '',
    lockbox_code: '',
    gate_code: '',
    wifi_network: '',
    wifi_password: '',
    inspection_frequency: 'weekly',
    assigned_staff: [],
    primary_photo_url: '',
    notes: '',
    emergency_contacts: [],
    utilities: {
      electric_provider: '',
      electric_account: '',
      water_provider: '',
      water_account: '',
      gas_provider: '',
      gas_account: '',
      internet_provider: '',
      internet_account: ''
    }
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
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [clientsData, staffData] = await Promise.all([
          base44.entities.Client.filter({ company_id: cId, is_active: true }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true })
        ]);
        
        setClients(clientsData);
        setStaff(staffData);
      }

      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      const clientIdParam = params.get('client_id');
      
      if (clientIdParam) {
        setFormData(prev => ({ ...prev, client_id: clientIdParam }));
      }
      
      if (id) {
        setPropertyId(id);
        const properties = await base44.entities.Property.filter({ id });
        if (properties.length > 0) {
          const p = properties[0];
          setFormData({
            client_id: p.client_id || '',
            name: p.name || '',
            address: p.address || '',
            city: p.city || '',
            state: p.state || '',
            zip: p.zip || '',
            property_type: p.property_type || 'single_family',
            status: p.status || 'seasonal',
            square_feet: p.square_feet || '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            access_instructions: p.access_instructions || '',
            alarm_code: p.alarm_code || '',
            lockbox_code: p.lockbox_code || '',
            gate_code: p.gate_code || '',
            wifi_network: p.wifi_network || '',
            wifi_password: p.wifi_password || '',
            inspection_frequency: p.inspection_frequency || 'weekly',
            assigned_staff: p.assigned_staff || [],
            primary_photo_url: p.primary_photo_url || '',
            notes: p.notes || '',
            emergency_contacts: p.emergency_contacts || [],
            utilities: p.utilities || {}
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, primary_photo_url: file_url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const validateAddress = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Please fill in address, city, and state');
      return false;
    }

    setValidatingAddress(true);
    try {
      const response = await base44.functions.validatePropertyAddress({
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      });

      if (response.valid) {
        setAddressValidation({
          valid: true,
          message: 'Address verified successfully',
          latitude: response.latitude,
          longitude: response.longitude
        });
        toast.success('Address verified');
        return true;
      } else {
        setAddressValidation({
          valid: false,
          message: response.error || 'Address could not be verified'
        });
        toast.error(response.error || 'Address validation failed');
        return false;
      }
    } catch (error) {
      setAddressValidation({
        valid: false,
        message: error.message || 'Address validation error'
      });
      toast.error('Address validation error');
      return false;
    } finally {
      setValidatingAddress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId || !formData.client_id) return;

    // Validate address first
    const isAddressValid = await validateAddress();
    if (!isAddressValid) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        company_id: companyId,
        latitude: addressValidation?.latitude || null,
        longitude: addressValidation?.longitude || null,
        square_feet: formData.square_feet ? parseFloat(formData.square_feet) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        is_active: true
      };

      if (propertyId) {
        await base44.entities.Property.update(propertyId, data);
      } else {
        await base44.entities.Property.create(data);
      }

      navigate(createPageUrl('Properties'));
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Error saving property');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUtilityChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      utilities: { ...prev.utilities, [field]: value }
    }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: [...prev.emergency_contacts, { name: '', relationship: '', phone: '', email: '' }]
    }));
  };

  const updateEmergencyContact = (index, field, value) => {
    const contacts = [...formData.emergency_contacts];
    contacts[index] = { ...contacts[index], [field]: value };
    setFormData(prev => ({ ...prev, emergency_contacts: contacts }));
  };

  const removeEmergencyContact = (index) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== index)
    }));
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
        title={propertyId ? 'Edit Property' : 'New Property'}
        subtitle="Enter property details and access information"
        backLink="Properties"
        backLabel="Back to Properties"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-28 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {formData.primary_photo_url ? (
                  <img src={formData.primary_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-10 w-10 text-slate-300" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Property Photo</h3>
                <p className="text-sm text-slate-500 mb-3">Upload a primary photo for this property</p>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </span>
                  </Button>
                </Label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => {
                  handleChange('address', e.target.value);
                  setAddressValidation(null);
                }}
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => {
                    handleChange('city', e.target.value);
                    setAddressValidation(null);
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => {
                    handleChange('state', e.target.value);
                    setAddressValidation(null);
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => {
                    handleChange('zip', e.target.value);
                    setAddressValidation(null);
                  }}
                />
              </div>
            </div>

            {/* Address Validation Status */}
            {addressValidation && (
              <div className={`flex items-start gap-3 p-3 rounded-lg ${addressValidation.valid ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                {addressValidation.valid ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${addressValidation.valid ? 'text-emerald-900' : 'text-red-900'}`}>
                    {addressValidation.message}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Access Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="access_instructions">Access Instructions</Label>
              <Textarea
                id="access_instructions"
                value={formData.access_instructions}
                onChange={(e) => handleChange('access_instructions', e.target.value)}
                placeholder="How to enter the property..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="alarm_code">Alarm Code</Label>
                <Input
                  id="alarm_code"
                  value={formData.alarm_code}
                  onChange={(e) => handleChange('alarm_code', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lockbox_code">Lockbox Code</Label>
                <Input
                  id="lockbox_code"
                  value={formData.lockbox_code}
                  onChange={(e) => handleChange('lockbox_code', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gate_code">Gate Code</Label>
                <Input
                  id="gate_code"
                  value={formData.gate_code}
                  onChange={(e) => handleChange('gate_code', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wifi_network">WiFi Network</Label>
                <Input
                  id="wifi_network"
                  value={formData.wifi_network}
                  onChange={(e) => handleChange('wifi_network', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="wifi_password">WiFi Password</Label>
                <Input
                  id="wifi_password"
                  value={formData.wifi_password}
                  onChange={(e) => handleChange('wifi_password', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Inspection Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inspection_frequency">Inspection Frequency</Label>
              <Select
                value={formData.inspection_frequency}
                onValueChange={(value) => handleChange('inspection_frequency', value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>
              <Plus className="h-4 w-4 mr-1" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent>
            {formData.emergency_contacts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No emergency contacts added</p>
            ) : (
              <div className="space-y-4">
                {formData.emergency_contacts.map((contact, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Relationship"
                        value={contact.relationship}
                        onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={contact.phone}
                        onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmergencyContact(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
              placeholder="Additional notes about this property..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('Properties'))}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : (propertyId ? 'Update Property' : 'Create Property')}
          </Button>
        </div>
      </form>
    </div>
  );
}