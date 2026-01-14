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

  const [companyId, setCompanyId] = useState(null);
  const [propertyId, setPropertyId] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [fetchingImage, setFetchingImage] = useState(false);
  
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
      // Compress image before uploading
      const compressedFile = await compressImage(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
      setFormData(prev => ({ ...prev, primary_photo_url: file_url }));
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Reduce dimensions if too large
          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressedFile);
          }, 'image/jpeg', 0.75);
        };
      };
    });
  };

  const fetchImageFromGoogle = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Please fill in address, city, and state');
      return;
    }

    setFetchingImage(true);
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state}${formData.zip ? ' ' + formData.zip : ''}`;
      const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(fullAddress)}&zoom=17&size=1200x400&maptype=roadmap&markers=color:red%7C${encodeURIComponent(fullAddress)}`;
      setFormData(prev => ({ ...prev, primary_photo_url: mapImageUrl }));
      toast.success('Google Maps image set');
    } catch (error) {
      console.error('Error fetching Google Maps image:', error);
      toast.error('Error fetching image');
    } finally {
      setFetchingImage(false);
    }
  };

  const fetchImageFromZillow = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Please fill in address, city, and state');
      return;
    }

    setFetchingImage(true);
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state}${formData.zip ? ' ' + formData.zip : ''}`;
      const zillowUrl = `https://www.zillow.com/homes/${encodeURIComponent(fullAddress.replace(/\s+/g, '-').toLowerCase())}/`;
      
      // Use LLM to generate a property image based on address
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional exterior photo of a residential property at ${fullAddress}. High-quality architectural photography, daylight, well-maintained house with landscaping.`,
      });
      
      setFormData(prev => ({ ...prev, primary_photo_url: result.url }));
      toast.success('Property image generated from Zillow-style photo');
    } catch (error) {
      console.error('Error generating property image:', error);
      toast.error('Error generating image');
    } finally {
      setFetchingImage(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId || !formData.client_id) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        company_id: companyId,
        square_feet: formData.square_feet ? parseFloat(formData.square_feet) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        is_active: true
      };

      if (propertyId) {
        await base44.entities.Property.update(propertyId, data);
        toast.success('Property updated successfully');
      } else {
        await base44.entities.Property.create(data);
        toast.success('Property created successfully');
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
      >
        <Button type="submit" form="property-form" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : (propertyId ? 'Update' : 'Create')}
        </Button>
      </PageHeader>

      <form id="property-form" onSubmit={handleSubmit} className="space-y-6">


        {/* Property Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Property Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.primary_photo_url && (
              <div className="mb-4">
                <img 
                  src={formData.primary_photo_url} 
                  alt="Property preview"
                  className="w-full h-48 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <label>
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={uploading}
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('photo-upload').click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <Button 
                type="button" 
                variant="outline"
                disabled={fetchingImage}
                className="w-full"
                onClick={fetchImageFromGoogle}
              >
                {fetchingImage ? 'Loading...' : 'Google Maps'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                disabled={fetchingImage}
                className="w-full"
                onClick={fetchImageFromZillow}
              >
                {fetchingImage ? 'Generating...' : 'Generate Photo'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">Full address required to fetch images</p>
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
                onChange={(e) => handleChange('address', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                   id="city"
                   value={formData.city}
                   onChange={(e) => handleChange('city', e.target.value)}
                   required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                   id="state"
                   value={formData.state}
                   onChange={(e) => handleChange('state', e.target.value)}
                   required
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
        </div>
      </form>
    </div>
  );
}