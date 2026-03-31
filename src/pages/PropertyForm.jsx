import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { 
  Building2, MapPin, Key, Wifi, Phone, Calendar,
  Save, X, Upload, Plus, Trash2, User, MapPinCheckInside, Loader, ArrowRightLeft, ChevronDown,
  AlertCircle, AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from '@/components/shared/PageHeader';
import { useAutoSave } from '@/components/shared/useAutoSave';
import { Clock } from 'lucide-react';
import ContractorSearchDialog from '@/components/contractors/ContractorSearchDialog';

export default function PropertyForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [propertyId, setPropertyId] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [fetchingImage, setFetchingImage] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState(null);
  const [streetViewUrl, setStreetViewUrl] = useState(null);
  const [imageSource, setImageSource] = useState('auto');
  const [autocompleteList, setAutocompleteList] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [nearbyAddresses, setNearbyAddresses] = useState([]);
  const [showNearbyAddresses, setShowNearbyAddresses] = useState(false);
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [showNearbyProperties, setShowNearbyProperties] = useState(false);
  const [enrichingData, setEnrichingData] = useState(false);
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({ first_name: '', last_name: '', email: '' });
  const [creatingClient, setCreatingClient] = useState(false);
  const [showContractorSearch, setShowContractorSearch] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  
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
    tags: [],
    square_feet: '',
    bedrooms: '',
    bathrooms: '',
    year_built: '',
    lot_size: '',
    access_instructions: '',
    alarm_code: '',
    lockbox_code: '',
    gate_code: '',
    security_gate: false,
    wifi_network: '',
    wifi_password: '',
    hoa_name: '',
    hoa_website: '',
    hoa_email: '',
    hoa_phone: '',
    emergency_notification_contact_name: '',
    emergency_notification_contact_phone: '',
    emergency_notification_contact_email: '',
    storm_protection_description: '',
    storm_panels_notes: '',
    inspection_frequency: 'weekly',
    assigned_staff: [],
    contractors: [],
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

  const autoSaveFunction = async (data) => {
    if (!companyId || !propertyId) return;
    const saveData = {
      ...data,
      tenant_id: companyId,
      square_feet: data.square_feet ? parseFloat(data.square_feet) : null,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      is_active: true
    };
    await base44.entities.Property.update(propertyId, saveData);
  };

  const { isSaving: isAutoSaving, lastSaved } = useAutoSave(formData, autoSaveFunction, {
    enabled: !!propertyId,
    delay: 2000
  });

  useEffect(() => {
    loadData();
    initializeGooglePlaces();
  }, []);

  const initializeGooglePlaces = () => {
    const apiKey = 'AIzaSyBPbLVxQ6d5dBkDX_5MHQ9dHJZECXX';
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
      if (!user?.primary_tenant_id) { setLoading(false); return; }
      const cId = user.primary_tenant_id;
      setCompanyId(cId);

      const [clientsData, staffData, contractorsData, propertiesData] = await Promise.all([
        base44.entities.Client.filter({ tenant_id: cId, is_active: true }),
        base44.entities.TenantUser.filter({ tenant_id: cId, is_active: true }),
        base44.entities.Contractor.filter({ tenant_id: cId, is_active: true }),
        base44.entities.Property.filter({ tenant_id: cId })
      ]);

      setClients(clientsData);
      setStaff(staffData);
      setContractors(contractorsData);
      const tags = Array.from(new Set(propertiesData.flatMap(p => p.tags || [])));
      setAllTags(tags);

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
            latitude: p.latitude || null,
            longitude: p.longitude || null,
            property_type: p.property_type || 'single_family',
            status: p.status || 'seasonal',
            square_feet: p.square_feet || '',
            bedrooms: p.bedrooms || '',
            bathrooms: p.bathrooms || '',
            year_built: p.year_built || '',
            lot_size: p.lot_size || '',
            access_instructions: p.access_instructions || '',
            alarm_code: p.alarm_code || '',
            lockbox_code: p.lockbox_code || '',
            gate_code: p.gate_code || '',
            security_gate: p.security_gate || false,
            wifi_network: p.wifi_network || '',
            wifi_password: p.wifi_password || '',
            hoa_name: p.hoa_name || '',
            hoa_website: p.hoa_website || '',
            hoa_email: p.hoa_email || '',
            hoa_phone: p.hoa_phone || '',
            emergency_notification_contact_name: p.emergency_notification_contact_name || '',
            emergency_notification_contact_phone: p.emergency_notification_contact_phone || '',
            emergency_notification_contact_email: p.emergency_notification_contact_email || '',
            storm_protection_description: p.storm_protection_description || '',
            storm_panels_notes: p.storm_panels_notes || '',
            inspection_frequency: p.inspection_frequency || 'weekly',
            assigned_staff: p.assigned_staff || [],
            contractors: p.contractors || [],
            primary_photo_url: p.primary_photo_url || '',
            notes: p.notes || '',
            emergency_contacts: p.emergency_contacts || [],
             utilities: p.utilities || {}
          });
          
          // Set the street view URL if property has a photo
          if (p.primary_photo_url) {
            setStreetViewUrl(p.primary_photo_url);
          }
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

  const fetchGoogleAerialView = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Please fill in address, city, and state first');
      return;
    }

    setFetchingImage(true);
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      });

      if (response.data?.validation?.isValid) {
        const validation = response.data.validation;
        setAddressValidation(validation);
        
        // Populate blank fields from validation and store lat/lng
        setFormData(prev => ({
          ...prev,
          address: prev.address || validation.street || '',
          city: prev.city || validation.city || '',
          state: prev.state || validation.state || '',
          zip: prev.zip || validation.zip || '',
          latitude: validation.latitude,
          longitude: validation.longitude
        }));
        
        if (response.data.aerialViewUrl) {
          setPreviewImageUrl(response.data.aerialViewUrl);
          toast.success('Aerial view loaded! Click "Approve Image" to use it.');
        } else {
          toast.info('Address validated. No imagery available for this location.');
        }
      } else {
        toast.error('Unable to validate address');
      }
    } catch (error) {
      console.error('Error fetching aerial view:', error);
      toast.error('Failed to fetch aerial view');
    } finally {
      setFetchingImage(false);
    }
  };

  const approveImage = () => {
    if (!previewImageUrl) return;
    
    setFormData(prev => ({ 
      ...prev, 
      primary_photo_url: previewImageUrl
    }));
    setStreetViewUrl(previewImageUrl);
    setImageSource('auto');
    setPreviewImageUrl(null);
    toast.success('Image approved and saved');
  };

  const autocorrectCity = async (city, state) => {
    if (!city || !state || city.length < 2) return city;

    try {
      // Use Google Places autocomplete to get properly formatted city name
      if (autocompleteServiceRef.current) {
        const predictions = await autocompleteServiceRef.current.getPlacePredictions({
          input: `${city}, ${state}`,
          types: ['(cities)'],
          componentRestrictions: { country: 'us' }
        });

        if (predictions.predictions && predictions.predictions.length > 0) {
          // Extract city from the first prediction
          const mainText = predictions.predictions[0].main_text;
          return mainText;
        }
      }
    } catch (error) {
      console.error('Autocorrect error:', error);
    }
    return city;
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
    } else if (field === 'city') {
      // Auto-correct city when user leaves the field (on blur will trigger)
      if (formData.state && value.length > 2) {
        if (validateTimeoutRef.current) clearTimeout(validateTimeoutRef.current);
        validateTimeoutRef.current = setTimeout(async () => {
          const correctedCity = await autocorrectCity(value, formData.state);
          if (correctedCity !== value) {
            setFormData(prev => ({ ...prev, city: correctedCity }));
          }
        }, 500);
      }
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
      service.getDetails({ placeId: prediction.place_id }, async (place, status) => {
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

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setFormData(prev => ({
            ...prev,
            address: address.trim(),
            city,
            state,
            zip,
            latitude: lat,
            longitude: lng
          }));

          await validateAndFetchGoogleImage(address.trim(), city, state, zip, lat, lng);
        }
      });
    } catch (error) {
      console.error('Error selecting address:', error);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.first_name || !newClientData.last_name || !newClientData.email || !companyId) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreatingClient(true);
    try {
      const newClient = await base44.entities.Client.create({
        tenant_id: companyId,
        first_name: newClientData.first_name,
        last_name: newClientData.last_name,
        email: newClientData.email,
        is_active: true
      });

      setClients(prev => [...prev, newClient]);
      setFormData(prev => ({ ...prev, client_id: newClient.id }));
      setShowCreateClientDialog(false);
      setNewClientData({ first_name: '', last_name: '', email: '' });
      toast.success('Client created successfully');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Error creating client');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleEnrichPropertyData = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Please fill in address, city, and state first');
      return;
    }

    setEnrichingData(true);
    try {
      const response = await base44.functions.invoke('enrichPropertyData', {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      });

      if (response.data?.success) {
        const enrichedData = response.data.data;
        setFormData(prev => ({
          ...prev,
          bedrooms: enrichedData.bedrooms || prev.bedrooms,
          bathrooms: enrichedData.bathrooms || prev.bathrooms,
          square_feet: enrichedData.square_feet || prev.square_feet
        }));
        toast.success('Property details updated from public records');
      } else {
        toast.info('No additional property data found in public records');
      }
    } catch (error) {
      console.error('Error enriching property data:', error);
      toast.error('Failed to look up property details');
    } finally {
      setEnrichingData(false);
    }
  };

  const handleUseLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      
      // Use Google Places Nearby Search to find properties
      if (window.google && placesServiceRef.current) {
        const location = new window.google.maps.LatLng(latitude, longitude);
        
        const request = {
          location: location,
          radius: 500, // Search within 500 meters
          type: ['premise', 'street_address'] // Look for buildings/addresses
        };

        placesServiceRef.current.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            // Get detailed info for each result
            const propertyPromises = results.slice(0, 8).map(result => {
              return new Promise((resolve) => {
                placesServiceRef.current.getDetails({ placeId: result.place_id }, (place, detailStatus) => {
                  if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    let address = '';
                    let city = '';
                    let state = '';
                    let zip = '';

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

                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const distance = calculateDistance(latitude, longitude, lat, lng);

                    resolve({
                      placeId: place.place_id,
                      name: place.name,
                      address: address.trim(),
                      city,
                      state,
                      zip,
                      latitude: lat,
                      longitude: lng,
                      distance,
                      formatted: place.formatted_address
                    });
                  } else {
                    resolve(null);
                  }
                });
              });
            });

            Promise.all(propertyPromises).then(properties => {
              const validProperties = properties.filter(p => p && p.address).sort((a, b) => a.distance - b.distance);
              if (validProperties.length > 0) {
                setNearbyProperties(validProperties);
                setShowNearbyProperties(true);
                toast.success(`Found ${validProperties.length} nearby properties on Google Maps`);
              } else {
                toast.info('No properties found nearby');
              }
              setGettingLocation(false);
            });
          } else {
            toast.info('No properties found nearby');
            setGettingLocation(false);
          }
        });
      } else {
        toast.error('Google Maps not loaded yet');
        setGettingLocation(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Unable to get your location. Please enable location services.');
      setGettingLocation(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula for distance calculation in miles
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSelectNearbyProperty = async (property) => {
    // Auto-populate form with selected property address data
    setFormData(prev => ({
      ...prev,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      latitude: property.latitude,
      longitude: property.longitude
    }));

    setShowNearbyProperties(false);
    setNearbyProperties([]);
    
    // Fetch aerial view for the selected property
    await validateAndFetchGoogleImage(property.address, property.city, property.state, property.zip, property.latitude, property.longitude);
    toast.success('Property address loaded from Google Maps');
  };

  const validateAndFetchGoogleImage = async (address, city, state, zip, providedLat = null, providedLng = null) => {
    if (!address || !city || !state) return;
    
    setValidatingAddress(true);
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address,
        city,
        state,
        zip
      });

      if (response.data?.validation?.isValid) {
        const validation = response.data.validation;
        setAddressValidation(validation);
        
        // Use provided coordinates or validation coordinates
        const lat = providedLat || validation.latitude;
        const lng = providedLng || validation.longitude;
        
        // Populate fields from validation and add lat/lng
        setFormData(prev => ({
          ...prev,
          address: prev.address || validation.street || '',
          city: prev.city || validation.city || '',
          state: prev.state || validation.state || '',
          zip: prev.zip || validation.zip || '',
          latitude: lat,
          longitude: lng
        }));
        
        if (response.data.aerialViewUrl) {
          setPreviewImageUrl(response.data.aerialViewUrl);
        }
      }
    } catch (error) {
      console.error('Error validating address:', error);
    } finally {
      setValidatingAddress(false);
    }
  };

  const handleSelectNearbyAddress = (selectedAddress) => {
    setFormData(prev => ({
      ...prev,
      address: selectedAddress.address,
      city: selectedAddress.city,
      state: selectedAddress.state,
      zip: selectedAddress.zip,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude
    }));

    setShowNearbyAddresses(false);
    setNearbyAddresses([]);
    fetchGoogleAerialView();
    toast.success('Address selected');
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId || !formData.client_id) return;

    if (!formData.latitude || !formData.longitude) {
      toast.warning('No GPS coordinates — the property will be saved without a location pin. You can validate the address later.');
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        tenant_id: companyId,
        square_feet: formData.square_feet ? parseFloat(formData.square_feet) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
        <div className="flex items-center gap-3">
          {propertyId && (
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
          <Button type="submit" form="property-form" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
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
               <Select value={formData.client_id} onValueChange={(value) => {
                 if (value === 'create-new') {
                   setShowCreateClientDialog(true);
                 } else {
                   handleChange('client_id', value);
                 }
               }}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Choose a client" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="create-new">
                     <Plus className="h-4 w-4 inline mr-2" />
                     Create New Client
                   </SelectItem>
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
                     <SelectItem value="commercial">High-Rise or Multi-Family Complex</SelectItem>
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
             <div className="space-y-3">
               <div className="flex items-end gap-2">
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={handleEnrichPropertyData}
                   disabled={enrichingData || !formData.address || !formData.city || !formData.state}
                   className="whitespace-nowrap"
                 >
                   {enrichingData ? (
                     <>
                       <Loader className="h-4 w-4 mr-2 animate-spin" />
                       Looking up...
                     </>
                   ) : (
                     <>
                       <Building2 className="h-4 w-4 mr-2" />
                       Auto-fill Details
                     </>
                   )}
                 </Button>
                 <p className="text-xs text-slate-500">Uses public property records</p>
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
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="year_built">Year Built</Label>
                     <Input
                       id="year_built"
                       type="number"
                       value={formData.year_built}
                       onChange={(e) => handleChange('year_built', e.target.value)}
                     />
                   </div>
                   <div>
                     <Label htmlFor="lot_size">Lot Size</Label>
                     <Input
                       id="lot_size"
                       value={formData.lot_size}
                       onChange={(e) => handleChange('lot_size', e.target.value)}
                       placeholder="e.g., 0.5 acres"
                     />
                   </div>
                 </div>
                 </div>
                 </CardContent>
                 </Card>

                 {/* Tags */}
                 <Card>
                 <CardHeader>
                 <CardTitle className="text-lg">Tags</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                 <div className="space-y-3">
                 {formData.tags.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                     {formData.tags.map(tag => (
                       <div key={tag} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm">
                         {tag}
                         <button
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                           className="text-blue-700 hover:text-blue-900 font-semibold"
                         >
                           ×
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
                 </div>

                 <div className="space-y-3 border-t pt-4">
                 {allTags.length > 0 && (
                   <div>
                     <Label className="text-sm">Select from existing tags:</Label>
                     <div className="flex flex-wrap gap-2 mt-2">
                       {allTags.filter(t => !formData.tags.includes(t)).map(tag => (
                         <button
                           key={tag}
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))}
                           className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition-colors"
                         >
                           + {tag}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                 <div>
                   <Label className="text-sm">Or create a new tag:</Label>
                   <div className="flex gap-2 mt-2">
                     <Input
                       value={newTag}
                       onChange={(e) => setNewTag(e.target.value)}
                       placeholder="Tag name..."
                       className="flex-1"
                       onKeyPress={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault();
                           if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                             setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
                             if (!allTags.includes(newTag.trim())) {
                               setAllTags(prev => [...prev, newTag.trim()]);
                             }
                             setNewTag('');
                           }
                         }
                       }}
                     />
                     <Button
                       type="button"
                       onClick={() => {
                         if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
                           setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
                           if (!allTags.includes(newTag.trim())) {
                             setAllTags(prev => [...prev, newTag.trim()]);
                           }
                           setNewTag('');
                         }
                       }}
                       variant="outline"
                       size="sm"
                     >
                       <Plus className="h-4 w-4" />
                     </Button>
                   </div>
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
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <Input
                   id="address"
                   value={formData.address}
                   onChange={(e) => handleAddressChange('address', e.target.value)}
                   onFocus={() => formData.address.length > 2 && setShowAutocomplete(true)}
                   required
                   placeholder="Type an address to search..."
                 />
                 {showAutocomplete && autocompleteList.length > 0 && (
                   <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto mt-1">
                     {autocompleteList.map((prediction) => (
                       <div
                         key={prediction.place_id}
                         onClick={() => handleSelectAddress(prediction)}
                         className="px-4 py-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-sm"
                       >
                         <div className="font-medium text-slate-900">{prediction.main_text}</div>
                         <div className="text-xs text-slate-500">{prediction.secondary_text}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
               <Button
                 type="button"
                 variant="outline"
                 onClick={fetchGoogleAerialView}
                 disabled={fetchingImage}
               >
                 {fetchingImage ? <Loader className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
               </Button>
             </div>
             <div className="relative">
               <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={handleUseLocation}
                 disabled={gettingLocation}
                 className="mt-2 w-full"
               >
                 <MapPinCheckInside className="h-4 w-4 mr-2" />
                 {gettingLocation ? 'Finding nearby properties...' : 'Find Nearby Properties'}
               </Button>

               {showNearbyProperties && nearbyProperties.length > 0 && (
                 <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
                   <div className="p-2">
                     <p className="text-xs text-slate-500 px-2 py-1 font-medium">Properties from Google Maps:</p>
                     {nearbyProperties.map((property, index) => (
                       <div
                         key={index}
                         onClick={() => handleSelectNearbyProperty(property)}
                         className="px-3 py-2.5 cursor-pointer hover:bg-slate-50 rounded-md border-b border-slate-100 last:border-b-0"
                       >
                         <div className="flex items-start justify-between gap-2">
                           <div className="flex-1">
                             <div className="font-medium text-sm text-slate-900">{property.name || property.address}</div>
                             {property.address && <div className="text-xs text-slate-600 mt-0.5">{property.address}</div>}
                             <div className="text-xs text-slate-500">{property.city}, {property.state} {property.zip}</div>
                           </div>
                           <div className="text-xs text-blue-600 shrink-0">
                             {property.distance < 0.1 ? 
                               `${(property.distance * 5280).toFixed(0)} ft` : 
                               `${property.distance.toFixed(1)} mi`
                             }
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
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

            {previewImageUrl && (
              <div className="space-y-3">
                <Label>Aerial View Preview</Label>
                <img
                  src={previewImageUrl}
                  alt="Aerial View Preview"
                  className="w-full h-64 object-cover rounded-lg border border-slate-200"
                />
                <Button
                  type="button"
                  onClick={approveImage}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Approve Image
                </Button>
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

            {/* Security Gate */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Security Gate</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.security_gate === true ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('security_gate', true)}
                    className={formData.security_gate === true ? 'bg-emerald-600' : ''}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={formData.security_gate === false ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('security_gate', false)}
                    className={formData.security_gate === false ? 'bg-slate-600' : ''}
                  >
                    No
                  </Button>
                </div>
              </div>
              {formData.security_gate && (
                <div>
                  <Label htmlFor="gate_code">Gate Code</Label>
                  <Input
                    id="gate_code"
                    value={formData.gate_code}
                    onChange={(e) => handleChange('gate_code', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* HOA */}
            <div className="space-y-3 border-t pt-4">
              <Label>Homeowners Association</Label>
              <Input
                placeholder="HOA Name"
                value={formData.hoa_name}
                onChange={(e) => handleChange('hoa_name', e.target.value)}
              />
              {formData.hoa_name && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    type="url"
                    placeholder="Website"
                    value={formData.hoa_website}
                    onChange={(e) => handleChange('hoa_website', e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.hoa_email}
                    onChange={(e) => handleChange('hoa_email', e.target.value)}
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={formData.hoa_phone}
                    onChange={(e) => handleChange('hoa_phone', e.target.value)}
                  />
                </div>
              )}
            </div>
            </CardContent>
            </Card>

            {/* Emergency & Notification Contact */}
            <Card>
            <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Emergency & Notification Contact
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed pb-3">
              In the event the homeowner is unavailable during an emergency, the following person will be contacted.
            </p>
            <div>
              <Label htmlFor="emergency_notification_contact_name">Contact Name</Label>
              <Input
                id="emergency_notification_contact_name"
                value={formData.emergency_notification_contact_name}
                onChange={(e) => handleChange('emergency_notification_contact_name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_notification_contact_phone">Phone</Label>
                <Input
                  id="emergency_notification_contact_phone"
                  type="tel"
                  value={formData.emergency_notification_contact_phone}
                  onChange={(e) => handleChange('emergency_notification_contact_phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="emergency_notification_contact_email">Email</Label>
                <Input
                  id="emergency_notification_contact_email"
                  type="email"
                  value={formData.emergency_notification_contact_email}
                  onChange={(e) => handleChange('emergency_notification_contact_email', e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>
            </CardContent>
            </Card>

            {/* Storm Protection */}
            <Card>
            <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Storm Protection
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storm_protection_description">Storm Protection Description</Label>
              <Textarea
                id="storm_protection_description"
                value={formData.storm_protection_description}
                onChange={(e) => handleChange('storm_protection_description', e.target.value)}
                placeholder="Describe storm protection, shutters, etc..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="storm_panels_notes">Storm Panels / Installation Contractor</Label>
              <Textarea
                id="storm_panels_notes"
                value={formData.storm_panels_notes}
                onChange={(e) => handleChange('storm_panels_notes', e.target.value)}
                placeholder="Notes about storm panels and installation..."
                rows={3}
              />
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
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contractors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Contractors ({formData.contractors.length})
              </CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowContractorSearch(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contractor
              </Button>
            </CardHeader>
            <CardContent>
              {formData.contractors.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No contractors assigned. Add contractors to associate them with this property.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.contractors.map((contractorId) => {
                    const contractor = contractors.find(c => c.id === contractorId);
                    if (!contractor) return null;

                    const availableToReplace = contractors.filter(c => !formData.contractors.includes(c.id));

                    return (
                      <div key={contractorId} className="flex items-start justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-900">{contractor.business_name}</p>
                          <p className="text-xs text-slate-600 capitalize mt-0.5">
                            {contractor.contractor_type.replace('_', ' ')}
                          </p>
                          <div className="flex flex-col gap-1 mt-2 text-xs text-slate-600">
                            {contractor.phone && <p>📞 {contractor.phone}</p>}
                            {contractor.email && <p>📧 {contractor.email}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2 shrink-0">
                          {availableToReplace.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" title="Replace contractor">
                                  <ArrowRightLeft className="h-4 w-4 text-slate-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                {availableToReplace.map((replacement) => (
                                  <DropdownMenuItem
                                    key={replacement.id}
                                    onClick={() => setFormData(prev => ({
                                      ...prev,
                                      contractors: prev.contractors.map(id => id === contractorId ? replacement.id : id)
                                    }))}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium text-sm">{replacement.business_name}</span>
                                      <span className="text-xs text-slate-500 capitalize">{replacement.contractor_type.replace('_', ' ')}</span>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              contractors: prev.contractors.filter(id => id !== contractorId)
                            }))}
                            title="Remove contractor"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {contractors.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No contractors available. Add contractors from Settings first.
                </p>
              )}
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

      {/* Contractor Search Dialog */}
      <ContractorSearchDialog 
        open={showContractorSearch}
        onOpenChange={setShowContractorSearch}
        onSelect={(newContractor) => {
          // Create the new contractor
          base44.entities.Contractor.create({
            tenant_id: companyId,
            business_name: newContractor.business_name,
            contact_name: newContractor.contact_name || '',
            contractor_type: newContractor.contractor_type || 'other',
            email: newContractor.email || '',
            phone: newContractor.phone || '',
            secondary_phone: newContractor.secondary_phone || '',
            address: newContractor.address || '',
            city: newContractor.city || '',
            state: newContractor.state || '',
            zip: newContractor.zip || '',
            license_number: newContractor.license_number || '',
            insurance_info: newContractor.insurance_info || '',
            hourly_rate: newContractor.hourly_rate || null,
            notes: newContractor.notes || '',
            is_active: true
          }).then((createdContractor) => {
            // Add the newly created contractor to the contractors list
            setContractors(prev => [...prev, createdContractor]);
            // Add to property's contractors
            setFormData(prev => ({
              ...prev,
              contractors: [...prev.contractors, createdContractor.id]
            }));
            toast.success('Contractor added to property');
          }).catch(() => {
            toast.error('Error adding contractor');
          });
        }}
        companyId={companyId}
        currentProperty={propertyId ? { id: propertyId, ...formData } : null}
      />

      {/* Create Client Dialog */}
      <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>Add a new client to your property management system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_first_name">First Name *</Label>
              <Input
                id="new_first_name"
                value={newClientData.first_name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="new_last_name">Last Name *</Label>
              <Input
                id="new_last_name"
                value={newClientData.last_name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Doe"
              />
            </div>
            <div>
              <Label htmlFor="new_email">Email *</Label>
              <Input
                id="new_email"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateClientDialog(false)}
                disabled={creatingClient}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateClient}
                disabled={creatingClient}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {creatingClient ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}