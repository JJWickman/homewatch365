import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Key, Wifi, Phone, Calendar,
  Save, X, Upload, Plus, Trash2, User, MapPinCheckInside, Loader
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
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState(null);
  const [streetViewUrl, setStreetViewUrl] = useState(null);
  const [imageSource, setImageSource] = useState('auto'); // 'auto' or 'custom'
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const validateTimeoutRef = React.useRef(null);
  const autocompleteServiceRef = React.useRef(null);
  const placesServiceRef = React.useRef(null);
  
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
    initializeGooglePlaces();
  }, []);

  const initializeGooglePlaces = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBPbLVxQ6d5dBkDX_5MHQ9dHJZECXX';
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (window.google) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      }
    };
    document.body.appendChild(script);
  };

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
      setStreetViewUrl(file_url);
      setImageSource('custom');
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

  const validateAndFetchGoogleImage = async (address, city, state, zip) => {
    if (!address || !city || !state) {
      return;
    }

    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address,
        city,
        state,
        zip
      });

      if (response.data.validation.isValid) {
        setAddressValidation(response.data.validation);
        setStreetViewUrl(response.data.streetViewUrl);
        setImageSource('auto');
        setFormData(prev => ({ 
          ...prev, 
          primary_photo_url: response.data.streetViewUrl,
          latitude: response.data.validation.lat,
          longitude: response.data.validation.lng
        }));
      }
    } catch (error) {
      console.error('Error validating address:', error);
    }
  };

  const handleAddressChange = (field, value) => {
    handleChange(field, value);

    if (field === 'address' && value.length > 2) {
      setShowAutocomplete(true);
      
      if (validateTimeoutRef.current) {
        clearTimeout(validateTimeoutRef.current);
      }

      validateTimeoutRef.current = setTimeout(async () => {
        if (autocompleteServiceRef.current) {
          try {
            const predictions = await autocompleteServiceRef.current.getPlacePredictions({
              input: value,
              componentRestrictions: { country: 'us' }
            });
            setAutocompleteList(predictions.predictions || []);
          } catch (error) {
            console.error('Autocomplete error:', error);
          }
        }
      }, 300);
    } else if (field !== 'address') {
      // For city/state/zip, validate when all three are filled
      const updatedForm = { ...formData, [field]: value };
      if (updatedForm.address && updatedForm.city && updatedForm.state) {
        validateAndFetchGoogleImage(updatedForm.address, updatedForm.city, updatedForm.state, updatedForm.zip);
      }
    }
  };

  const handleSelectAddress = async (prediction) => {
    setShowAutocomplete(false);
    setAutocompleteList([]);
    
    try {
      // Get details for the selected place
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails({ placeId: prediction.place_id }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let address = '';
          let city = '';
          let state = '';
          let zip = '';

          // Parse address components
          place.address_components?.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) {
              address = component.short_name + ' ' + address;
            }
            if (types.includes('route')) {
              address += component.short_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
            if (types.includes('postal_code')) {
              zip = component.long_name;
            }
          });

          setFormData(prev => ({
            ...prev,
            address: address.trim(),
            city,
            state,
            zip,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          }));

          validateAndFetchGoogleImage(address.trim(), city, state, zip);
        }
      });
    } catch (error) {
      console.error('Error selecting address:', error);
    }
  };

  const handleUseLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      
      // Use Google's reverse geocoding to get address
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Deno.env.get('GOOGLE_MAPS_API_KEY') || ''}`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        let address = '';
        let city = '';
        let state = '';
        let zip = '';

        result.address_components?.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            address = component.short_name + ' ' + address;
          }
          if (types.includes('route')) {
            address += component.short_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          if (types.includes('postal_code')) {
            zip = component.long_name;
          }
        });

        setFormData(prev => ({
          ...prev,
          address: address.trim(),
          city,
          state,
          zip,
          latitude,
          longitude
        }));

        validateAndFetchGoogleImage(address.trim(), city, state, zip);
        toast.success('Location detected and loaded');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Unable to get your location. Please enable location services.');
    } finally {
      setGettingLocation(false);
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
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </PageHeader>

      <form id="property-form" onSubmit={handleSubmit} className="space-y-6">

         {/* Client Selection */}
         <Card>
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
               <User className="h-5 w-5" />
               Client
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div>
               <Label htmlFor="client_id">Select Client *</Label>
               <Select value={formData.client_id} onValueChange={(value) => handleChange('client_id', value)}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Choose a client" />
                 </SelectTrigger>
                 <SelectContent>
                   {clients.map(client => (
                     <SelectItem key={client.id} value={client.id}>
                       {client.first_name} {client.last_name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </CardContent>
         </Card>

         {/* Property Details */}
         <Card>
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
               <Building2 className="h-5 w-5" />
               Property Details
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
               <Label htmlFor="name">Property Name</Label>
               <Input
                 id="name"
                 value={formData.name}
                 onChange={(e) => handleChange('name', e.target.value)}
                 placeholder="e.g., Beach House, Mountain Cabin"
               />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="property_type">Property Type</Label>
                 <Select value={formData.property_type} onValueChange={(value) => handleChange('property_type', value)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="single_family">Single Family</SelectItem>
                     <SelectItem value="condo">Condo</SelectItem>
                     <SelectItem value="townhouse">Townhouse</SelectItem>
                     <SelectItem value="estate">Estate</SelectItem>
                     <SelectItem value="commercial">Commercial</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label htmlFor="status">Status</Label>
                 <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="occupied">Occupied</SelectItem>
                     <SelectItem value="vacant">Vacant</SelectItem>
                     <SelectItem value="seasonal">Seasonal</SelectItem>
                     <SelectItem value="for_sale">For Sale</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                 <Label htmlFor="bedrooms">Bedrooms</Label>
                 <Input
                   id="bedrooms"
                   type="number"
                   value={formData.bedrooms}
                   onChange={(e) => handleChange('bedrooms', e.target.value)}
                 />
               </div>
               <div>
                 <Label htmlFor="bathrooms">Bathrooms</Label>
                 <Input
                   id="bathrooms"
                   type="number"
                   step="0.5"
                   value={formData.bathrooms}
                   onChange={(e) => handleChange('bathrooms', e.target.value)}
                 />
               </div>
               <div>
                 <Label htmlFor="square_feet">Square Feet</Label>
                 <Input
                   id="square_feet"
                   type="number"
                   value={formData.square_feet}
                   onChange={(e) => handleChange('square_feet', e.target.value)}
                 />
               </div>
             </div>
           </CardContent>
         </Card>

         {/* Property Photo */}
        {streetViewUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <img
                  src={streetViewUrl}
                  alt="Property Street View"
                  className="w-full h-64 object-cover rounded-lg border border-slate-200"
                />
                <p className="text-sm text-slate-600">
                  {imageSource === 'auto' ? 
                    'This photo was automatically fetched from Google Maps.' : 
                    'This is your uploaded custom photo.'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {imageSource === 'auto' && (
                  <label className="flex-1">
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
                      {uploading ? 'Uploading...' : 'Use Custom Photo'}
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, primary_photo_url: '' }));
                    setStreetViewUrl(null);
                    setAddressValidation(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                onChange={(e) => handleAddressChange('address', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div className="col-span-2">
                 <Label htmlFor="city">City *</Label>
                 <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    required
                 />
               </div>
               <div>
                 <Label htmlFor="state">State *</Label>
                 <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    required
                 />
               </div>
               <div>
                 <Label htmlFor="zip">ZIP</Label>
                 <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                 />
               </div>
            </div>

            {addressValidation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="text-green-800 font-medium">✓ Address Validated</p>
                <p className="text-green-700 text-xs mt-1">{addressValidation.formattedAddress}</p>
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