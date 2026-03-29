import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, MapPin, User, Key, Wifi, Phone, 
  Calendar, Clock, 
  AlertTriangle, CheckCircle2, FileText, Upload, Image, 
  Circle, Plus, ZoomIn, ZoomOut,
  Search, Loader2, Globe, Zap, Tag
} from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import PropertyReportTab from '@/components/property/PropertyReportTab';
import PropertyPricingTab from '@/components/property/PropertyPricingTab';
import PropertyChecklistConfigTab from '@/components/property/PropertyChecklistConfigTab';
import ContractorSearchDialog from '@/components/contractors/ContractorSearchDialog.jsx';
import VisitTypeSelectionDialog from '@/components/visits/VisitTypeSelectionDialog.jsx';
import { toast } from 'sonner';

const CONTRACTOR_TYPES = [
  { value: 'cleaning_service', label: 'Cleaning Service' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'pool_service', label: 'Pool Service' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'other', label: 'Other' },
];

export default function PropertyDetail() {
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [visitTypeFilter, setVisitTypeFilter] = useState('all');
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fetchingAerial, setFetchingAerial] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingOwner, setChangingOwner] = useState(false);
  const [showChangeOwnerDialog, setShowChangeOwnerDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '', email: '' });
  const [savingTask, setSavingTask] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [mapUrl, setMapUrl] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [showingUserLocation, setShowingUserLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isNearProperty, setIsNearProperty] = useState(false);
  const [mapZoom, setMapZoom] = useState(17);
  const [searchingHoa, setSearchingHoa] = useState(false);
  const [emergencyContactSaved, setEmergencyContactSaved] = useState(false);
  const [selectedContractorType, setSelectedContractorType] = useState('');
  const [showContractorSearchModal, setShowContractorSearchModal] = useState(false);
  const [allProperties, setAllProperties] = useState([]);
  const [propertyChecklist, setPropertyChecklist] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [propertyTags, setPropertyTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [savingTags, setSavingTags] = useState(false);
  const [showVisitTypeDialog, setShowVisitTypeDialog] = useState(false);

  useEffect(() => {
    loadProperty();
  }, []);

  useEffect(() => {
    if (property?.latitude && property?.longitude) {
      loadMapUrl();
    }
  }, [property?.latitude, property?.longitude]);

  const loadMapUrl = async (userLocation = null, zoom = mapZoom) => {
    if (!property?.latitude || !property?.longitude) return;
    setLoadingMap(true);
    try {
      const stops = [{ latitude: property.latitude, longitude: property.longitude, order: 1, color: 'red', label: 'P' }];
      if (userLocation) {
        stops.push({ latitude: userLocation.latitude, longitude: userLocation.longitude, order: 2, color: 'blue', label: 'Y' });
      }
      const response = await base44.functions.invoke('generateStaticMapUrl', { stops, zoom });
      if (response.data?.mapUrl) setMapUrl(response.data.mapUrl);
    } catch (error) {
      console.error('Error loading map:', error);
    } finally {
      setLoadingMap(false);
    }
  };

  const handleZoomIn = () => {
    if (mapZoom < 20) {
      const newZoom = mapZoom + 1;
      setMapZoom(newZoom);
      loadMapUrl(null, newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapZoom > 10) {
      const newZoom = mapZoom - 1;
      setMapZoom(newZoom);
      loadMapUrl(null, newZoom);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleShowMyLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const distanceInMeters = calculateDistance(property.latitude, property.longitude, userLocation.latitude, userLocation.longitude);
      const isWithin100Feet = distanceInMeters <= 30.48;
      setIsNearProperty(isWithin100Feet);
      setShowingUserLocation(true);
      await loadMapUrl(userLocation);
      toast.success(isWithin100Feet ? 'You are within 100 feet of the property!' : 'Your location added to map');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Unable to get your location. Please enable location services.');
    } finally {
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    if (!property?.id) return;
    const unsubscribe = base44.entities.Visit.subscribe((event) => {
      if (event.property_id === property.id) {
        if (event.type === 'create') setVisits(prev => [event.data, ...prev]);
        else if (event.type === 'update') setVisits(prev => prev.map(v => v.id === event.id ? event.data : v));
        else if (event.type === 'delete') setVisits(prev => prev.filter(v => v.id !== event.id));
      }
    });
    return unsubscribe;
  }, [property?.id]);

  const loadProperty = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { navigate(createPageUrl('Properties')); return; }

    try {
      const user = await base44.auth.me();

      const [propertyData, visitsData] = await Promise.all([
        base44.entities.Property.filter({ id }),
        base44.entities.Visit.filter({ property_id: id }, '-scheduled_date', 20)
      ]);

      if (propertyData.length > 0) {
        const prop = propertyData[0];
        setProperty(prop);
        setVisits(visitsData);

        if (prop.client_id) {
          const [clientData, allClientsData] = await Promise.all([
            base44.entities.Client.filter({ id: prop.client_id }),
            base44.entities.Client.filter({ is_active: true })
          ]);
          if (clientData.length > 0) setClient(clientData[0]);
          setClients(allClientsData);
        }

        if (prop.contractors?.length > 0) {
          const contractorsData = await base44.entities.Contractor.filter({ id: { $in: prop.contractors } });
          setContractors(contractorsData);
        }

        const allPropsData = await base44.entities.Property.list();
        setAllProperties(allPropsData);

        const checklistData = await base44.entities.PropertyChecklist.filter({ property_id: id, tenant_id: user.primary_tenant_id, is_active: true });
        if (checklistData.length > 0) setPropertyChecklist(checklistData[0]);
  

        const uniqueTags = Array.from(new Set(allPropsData.flatMap(p => p.tags || [])));
        setAllTags(uniqueTags);
        setPropertyTags(prop.tags || []);
      }
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Property not found</p>
      </div>
    );
  }

  const completedVisits = visits.filter(v => v.status === 'completed').length;
  const pendingVisits = visits.filter(v => v.status !== 'completed' && v.status !== 'cancelled').length;

  const filteredVisits = visits.filter(v => {
    if (visitTypeFilter === 'all') return true;
    if (visitTypeFilter === 'inspection') return v.visit_type === 'inspection' || v.visit_type === 'check-in';
    return v.visit_type === visitTypeFilter;
  });

  const visitsByType = {
    inspection: filteredVisits.filter(v => v.visit_type === 'inspection' || v.visit_type === 'check-in'),
    followup: filteredVisits.filter(v => v.visit_type === 'followup')
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProperty({ ...property, primary_photo_url: file_url });
      setHasUnsavedChanges(true);
      toast.success('Photo uploaded - click Save to keep changes');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFetchAerialView = async () => {
    if (!property.address || !property.city || !property.state) { toast.error('Property address is incomplete'); return; }
    setFetchingAerial(true);
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', { address: property.address, city: property.city, state: property.state, zip: property.zip });
      if (response.data?.aerialViewUrl) {
        setProperty({ ...property, primary_photo_url: response.data.aerialViewUrl });
        setHasUnsavedChanges(true);
        toast.success('Aerial view loaded - click Save to keep changes');
      } else {
        toast.error('Could not fetch aerial view');
      }
    } catch (error) {
      console.error('Error fetching aerial view:', error);
      toast.error('Failed to fetch aerial view');
    } finally {
      setFetchingAerial(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Property.update(property.id, {
        primary_photo_url: property.primary_photo_url,
        hoa_name: property.hoa_name,
        hoa_website: property.hoa_website,
        hoa_email: property.hoa_email,
        hoa_phone: property.hoa_phone,
        hoa_notes: property.hoa_notes,
        unit_number: property.unit_number,
        gate_procedure: property.gate_procedure,
        parking_assignment: property.parking_assignment,
        front_desk_signin_procedure: property.front_desk_signin_procedure,
        key_policy: property.key_policy,
        security_gate: property.security_gate,
        gate_code: property.gate_code,
        emergency_notification_contact_name: property.emergency_notification_contact_name,
        emergency_notification_contact_phone: property.emergency_notification_contact_phone,
        emergency_notification_contact_email: property.emergency_notification_contact_email,
        storm_protection_description: property.storm_protection_description,
        storm_panels_notes: property.storm_panels_notes,
        equipment_water_valve_location: property.equipment_water_valve_location,
        equipment_breaker_box_location: property.equipment_breaker_box_location,
        equipment_water_heater_location: property.equipment_water_heater_location,
        equipment_air_handler_location: property.equipment_air_handler_location,
      });
      setHasUnsavedChanges(false);
      setEmergencyContactSaved(true);
      toast.success('Property saved successfully');
      setTimeout(() => setEmergencyContactSaved(false), 3000);
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error('Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeOwner = async () => {
    if (!selectedClientId) return;
    setChangingOwner(true);
    try {
      await base44.entities.Property.update(property.id, { client_id: selectedClientId });
      const newClientData = await base44.entities.Client.filter({ id: selectedClientId });
      if (newClientData.length > 0) {
        setClient(newClientData[0]);
        setProperty({ ...property, client_id: selectedClientId });
      }
      setShowChangeOwnerDialog(false);
      toast.success('Owner updated successfully');
    } catch (error) {
      console.error('Error changing owner:', error);
      toast.error('Failed to change owner');
    } finally {
      setChangingOwner(false);
    }
  };

  const handleHoaSearch = async () => {
    if (!property.hoa_name) return;
    setSearchingHoa(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find official contact information for the Homeowners Association named "${property.hoa_name}". Return their official website URL, contact email, and phone number if available.`,
        add_context_from_internet: true,
        response_json_schema: { type: 'object', properties: { website: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } } }
      });
      if (result) {
        setProperty(prev => ({ ...prev, hoa_website: result.website || prev.hoa_website || '', hoa_email: result.email || prev.hoa_email || '', hoa_phone: result.phone || prev.hoa_phone || '' }));
        setHasUnsavedChanges(true);
        toast.success('HOA information found!');
      }
    } catch (error) {
      console.error('Error searching HOA:', error);
      toast.error('Could not find HOA information');
    } finally {
      setSearchingHoa(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) { toast.error('Please enter a task title'); return; }
    setSavingTask(true);
    try {
      await base44.entities.FollowUp.create({
        tenant_id: property.tenant_id, property_id: property.id, client_id: property.client_id,
        title: newTask.title, description: newTask.description, priority: newTask.priority,
        due_date: newTask.due_date, type: 'other', status: 'open'
      });
      setVisits(await base44.entities.Visit.filter({ property_id: property.id, tenant_id: property.tenant_id }, '-scheduled_date', 20));
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      setShowAddTask(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name) { toast.error('Please enter a contact name'); return; }
    setSavingContact(true);
    try {
      const updatedContacts = [...(property.emergency_contacts || []), newContact];
      await base44.entities.Property.update(property.id, { emergency_contacts: updatedContacts });
      setProperty({ ...property, emergency_contacts: updatedContacts });
      setNewContact({ name: '', relationship: '', phone: '', email: '' });
      setShowAddContact(false);
      toast.success('Emergency contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add emergency contact');
    } finally {
      setSavingContact(false);
    }
  };

  const handleAssignContractor = async (contractorId) => {
    try {
      const updatedContractors = [...(property.contractors || []), contractorId];
      await base44.entities.Property.update(property.id, { contractors: updatedContractors });
      setProperty({ ...property, contractors: updatedContractors });
      if (updatedContractors.length > 0) {
        const contractorsData = await base44.entities.Contractor.filter({ id: { $in: updatedContractors } });
        setContractors(contractorsData);
      } else {
        setContractors([]);
      }
      toast.success('Contractor assigned successfully');
    } catch (error) {
      console.error('Error assigning contractor:', error);
      toast.error('Failed to assign contractor');
    }
  };

  const handleContractorSearchSelect = async (contractorData) => {
    try {
      const typeToUse = selectedContractorType || contractorData.contractor_type;
      const newContractor = await base44.entities.Contractor.create({
        ...contractorData, contractor_type: typeToUse, tenant_id: property.tenant_id,
        hourly_rate: contractorData.hourly_rate ? parseFloat(contractorData.hourly_rate) : null, is_active: true
      });
      await handleAssignContractor(newContractor.id);
      setShowContractorSearchModal(false);
      toast.success('Contractor added and assigned!');
    } catch (error) {
      console.error('Error adding contractor from search:', error);
      toast.error('Failed to add contractor');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={property.name || property.address}
        backLink="Properties"
        backLabel="Back to Properties"
      >
        {hasUnsavedChanges && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        )}
        {propertyChecklist && (
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowVisitTypeDialog(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Record Visit
          </Button>
        )}
      </PageHeader>

      {/* Property Info Header Strip */}
      <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-xl px-5 py-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Address */}
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700">{property.address}, {property.city}, {property.state} {property.zip}</span>
        </div>

        {/* Owner */}
        {client && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400 shrink-0" />
            <Link to={createPageUrl('ClientDetail') + `?id=${client.id}`} className="text-sm font-medium text-blue-700 hover:underline">
              {client.first_name} {client.last_name}
            </Link>
            <button onClick={() => { setSelectedClientId(property.client_id); setShowChangeOwnerDialog(true); }} className="text-xs text-slate-400 hover:text-slate-600 underline">change</button>
          </div>
        )}

        {/* Details */}
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="capitalize">{property.property_type === 'commercial' ? 'High-Rise/Multi-Family' : property.property_type?.replace('_', ' ')}</span>
          {property.bedrooms && <span>· {property.bedrooms} bed</span>}
          {property.bathrooms && <span>· {property.bathrooms} bath</span>}
          {property.square_feet && <span>· {property.square_feet.toLocaleString()} sqft</span>}
          {property.visit_frequency && <span>· {property.visit_frequency.replace('_', '-')} visits</span>}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const statuses = ['occupied', 'vacant', 'seasonal', 'for_sale'];
              const next = statuses[(statuses.indexOf(property.status) + 1) % statuses.length];
              setProperty({ ...property, status: next });
              base44.entities.Property.update(property.id, { status: next });
              toast.success(`Status updated to ${next.replace('_', ' ')}`);
            }}
            title="Click to change status"
          >
            <StatusBadge status={property.status} />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">{completedVisits}</span>
            <span className="text-xs text-slate-500">completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-800">{pendingVisits}</span>
            <span className="text-xs text-slate-500">pending</span>
          </div>
        </div>
      </div>

      {/* Full-width Tabs */}
      <div>
        <Tabs defaultValue="access">
            <TabsList className="w-full justify-start mb-4 flex-wrap">              <TabsTrigger value="access">Access Info</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="contractors">Contractors</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="storm">Storm Protection</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            {/* ACCESS TAB */}
            <TabsContent value="access">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Access Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photo section */}
                  <div className="relative">
                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                      {property.primary_photo_url ? (
                        <img src={property.primary_photo_url} alt={property.name || property.address} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input type="file" id="photo-upload" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                      <Button size="sm" variant="outline" onClick={() => document.getElementById('photo-upload').click()} disabled={uploadingPhoto}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleFetchAerialView} disabled={fetchingAerial}>
                        <Image className="h-4 w-4 mr-2" />
                        {fetchingAerial ? 'Fetching...' : 'Fetch Aerial View'}
                      </Button>
                    </div>
                    {hasUnsavedChanges && property.primary_photo_url && (
                      <div className="mt-2">
                        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                          {saving ? 'Saving...' : 'Save Photo'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Unit Identification */}
                  {['condo', 'townhouse', 'commercial'].includes(property.property_type) && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Key className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-medium text-slate-500">Unit Identification</h4>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Unit Number</label>
                        <input
                          type="text"
                          value={property.unit_number || ''}
                          onChange={(e) => { setProperty({...property, unit_number: e.target.value}); setHasUnsavedChanges(true); }}
                          placeholder="e.g., 4B, 12A, PH3"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                        />
                      </div>
                    </div>
                  )}

                  {property.access_instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">Access Instructions</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{property.access_instructions}</p>
                    </div>
                  )}

                  {/* High-Rise / Condo specific */}
                  {['condo', 'townhouse', 'commercial'].includes(property.property_type) && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-medium text-slate-500">Building Access Procedures</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Gate Procedure', field: 'gate_procedure', placeholder: 'e.g., Enter gate code #1234...' },
                          { label: 'Parking Assignment', field: 'parking_assignment', placeholder: 'e.g., Space #42 in Garage B...' },
                          { label: 'Front Desk Sign-In Procedure', field: 'front_desk_signin_procedure', placeholder: 'e.g., Sign in at lobby desk...' },
                        ].map(({ label, field, placeholder }) => (
                          <div key={field}>
                            <label className="text-xs text-slate-500 block mb-1">{label}</label>
                            <textarea
                              value={property[field] || ''}
                              onChange={(e) => { setProperty({...property, [field]: e.target.value}); setHasUnsavedChanges(true); }}
                              placeholder={placeholder}
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Policy */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4 text-slate-500" />
                      <h4 className="text-sm font-medium text-slate-500">Key Policy</h4>
                    </div>
                    <textarea
                      value={property.key_policy || ''}
                      onChange={(e) => { setProperty({...property, key_policy: e.target.value}); setHasUnsavedChanges(true); }}
                      placeholder="Document key access procedures, who holds keys, key storage location, etc."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black resize-none"
                    />
                  </div>

                  {/* Alarm / Lockbox */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {property.alarm_code && (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Alarm Code</p>
                        <p className="font-mono font-semibold text-lg">{property.alarm_code}</p>
                      </div>
                    )}
                    {property.lockbox_code && (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Lockbox Code</p>
                        <p className="font-mono font-semibold text-lg">{property.lockbox_code}</p>
                      </div>
                    )}
                  </div>

                  {/* Equipment Locations */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <h4 className="text-sm font-medium text-slate-500">Equipment Locations</h4>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Water Valve Location', field: 'equipment_water_valve_location', placeholder: 'e.g., Under kitchen sink, in garage' },
                        { label: 'Breaker Box Location', field: 'equipment_breaker_box_location', placeholder: 'e.g., Garage wall, laundry room' },
                        { label: 'Water Heater Location', field: 'equipment_water_heater_location', placeholder: 'e.g., Basement, garage' },
                        { label: 'Air Handler Location', field: 'equipment_air_handler_location', placeholder: 'e.g., Attic, utility closet' },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label className="text-xs text-slate-500 block mb-1">{label}</label>
                          <input
                            type="text"
                            value={property[field] || ''}
                            onChange={(e) => { setProperty({...property, [field]: e.target.value}); setHasUnsavedChanges(true); }}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Gate */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="h-4 w-4 text-slate-500" />
                      <h4 className="text-sm font-medium text-slate-500">Security Gate</h4>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-slate-600">Has Security Gate?</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setProperty({...property, security_gate: true}); setHasUnsavedChanges(true); }} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${property.security_gate === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Yes</button>
                        <button onClick={() => { setProperty({...property, security_gate: false}); setHasUnsavedChanges(true); }} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${property.security_gate === false ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>No</button>
                      </div>
                    </div>
                    {property.security_gate && (
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Gate Code</label>
                        <input
                          type="text"
                          value={property.gate_code || ''}
                          onChange={(e) => { setProperty({...property, gate_code: e.target.value}); setHasUnsavedChanges(true); }}
                          placeholder="Enter gate code"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-black"
                        />
                      </div>
                    )}
                  </div>

                  {/* HOA */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <h4 className="text-sm font-medium text-slate-500">Homeowners Association</h4>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={property.hoa_name || ''}
                        onChange={(e) => { setProperty({...property, hoa_name: e.target.value}); setHasUnsavedChanges(true); }}
                        placeholder="HOA name (e.g., Sunset Bay HOA)"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                      />
                      <button onClick={handleHoaSearch} disabled={searchingHoa || !property.hoa_name} className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1.5 text-sm">
                        {searchingHoa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Search
                      </button>
                    </div>
                    {property.hoa_name && (
                      <div className="space-y-2">
                        {[
                          { label: 'Website', field: 'hoa_website', type: 'url', placeholder: 'https://...' },
                          { label: 'Email', field: 'hoa_email', type: 'email', placeholder: 'contact@hoa.com' },
                          { label: 'Phone', field: 'hoa_phone', type: 'tel', placeholder: 'Phone number' },
                        ].map(({ label, field, type, placeholder }) => (
                          <div key={field} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16 shrink-0">{label}</span>
                            <input
                              type={type}
                              value={property[field] || ''}
                              onChange={(e) => { setProperty({...property, [field]: e.target.value}); setHasUnsavedChanges(true); }}
                              placeholder={placeholder}
                              className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Additional Notes</label>
                          <textarea
                            value={property.hoa_notes || ''}
                            onChange={(e) => { setProperty({...property, hoa_notes: e.target.value}); setHasUnsavedChanges(true); }}
                            placeholder="Any additional HOA information, rules, contacts, etc."
                            rows={3}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WiFi */}
                  {(property.wifi_network || property.wifi_password) && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Wifi className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-medium text-slate-500">WiFi</h4>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                        {property.wifi_network && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Network</span>
                            <span className="font-medium">{property.wifi_network}</span>
                          </div>
                        )}
                        {property.wifi_password && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Password</span>
                            <span className="font-mono">{property.wifi_password}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Static Map */}
                  {property.latitude && property.longitude && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-medium text-slate-500">Location</h4>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative">
                        {loadingMap ? (
                          <div className="w-full h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                          </div>
                        ) : mapUrl ? (
                          <>
                            <img src={mapUrl} alt="Property Location" className="w-full h-64 object-cover" />
                            <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                              <Button size="icon" variant="ghost" onClick={handleZoomIn} disabled={mapZoom >= 20 || loadingMap} className="h-8 w-8 rounded-none hover:bg-slate-100">
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                              <div className="h-px bg-slate-200" />
                              <Button size="icon" variant="ghost" onClick={handleZoomOut} disabled={mapZoom <= 10 || loadingMap} className="h-8 w-8 rounded-none hover:bg-slate-100">
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center text-slate-400">Map unavailable</div>
                        )}
                      </div>

                      {isNearProperty && showingUserLocation && (
                        <Alert className="mt-3 bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-900">
                            <strong>You are in the right location!</strong> You are within 100 feet of the correct property location.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-slate-500">Use this map to verify you're at the correct location</p>
                        <Button size="sm" variant="outline" onClick={handleShowMyLocation} disabled={gettingLocation || showingUserLocation}>
                          <MapPin className="h-4 w-4 mr-2" />
                          {gettingLocation ? 'Getting location...' : showingUserLocation ? 'Location shown' : 'Show My Location'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* VISITS TAB */}
            <TabsContent value="visits">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Visits</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="inspection">Visits</SelectItem>
                        <SelectItem value="followup">Follow-Ups</SelectItem>
                      </SelectContent>
                    </Select>
                    {propertyChecklist && (
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowVisitTypeDialog(true)}>
                        <Zap className="h-4 w-4 mr-1" />
                        Record Visit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredVisits.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-8">No visits found</p>
                  ) : (
                    <div className="space-y-4">
                      {visitsByType.inspection.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3">Visits ({visitsByType.inspection.length})</h4>
                          <div className="space-y-2">
                            {visitsByType.inspection.map((visit) => (
                              <Link key={visit.id} to={createPageUrl('VisitDetail') + `?id=${visit.id}`} className="flex items-start justify-between p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900">{visit.custom_checkin_name || 'Check-In'}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                    {visit.checkin_type && <span className="px-2 py-0.5 rounded-full bg-white/50 capitalize">{visit.checkin_type.replace('_', ' ')}</span>}
                                    {visit.scheduled_date && (
                                      <span className="flex items-center gap-1 text-slate-600">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(visit.scheduled_date), 'MMM d, yyyy')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <StatusBadge status={visit.status} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {visitsByType.followup.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-amber-600" />
                            Follow-Ups ({visitsByType.followup.length})
                          </h4>
                          <div className="space-y-2">
                            {visitsByType.followup.map((visit) => (
                              <div key={visit.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">{visit.title}</p>
                                    {visit.description && <p className="text-sm text-slate-600 mt-1">{visit.description}</p>}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <StatusBadge status={visit.status} />
                                      {visit.priority && <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{visit.priority}</span>}
                                      {visit.scheduled_date && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(visit.scheduled_date), 'MMM d')}
                                        </span>
                                      )}
                                      {visit.assigned_to_name && <span className="text-slate-600">Assigned: {visit.assigned_to_name}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CHECKLIST TAB */}
            <TabsContent value="checklist">
              <PropertyChecklistConfigTab propertyId={property.id} companyId={property.tenant_id} property={property} />
            </TabsContent>

            {/* REPORT TAB */}
            <TabsContent value="report">
              <PropertyReportTab visits={visits} />
            </TabsContent>

            {/* PRICING TAB */}
            <TabsContent value="pricing">
              <PropertyPricingTab propertyId={property.id} companyId={property.tenant_id} property={property} />
            </TabsContent>

            {/* CONTRACTORS TAB */}
            <TabsContent value="contractors">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contractors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {CONTRACTOR_TYPES.map(({ value, label }) => {
                      const typeContractors = contractors.filter(c => c.contractor_type === value);
                      const availableContractors = contractors.filter(c => c.contractor_type === value && !property.contractors?.includes(c.id));
                      return (
                        <div key={value} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-3">
                            <label className="text-sm font-medium text-slate-700 block mb-2">{label}</label>
                            <Select onValueChange={async (contractorId) => {
                              if (contractorId === 'add-new') {
                                setSelectedContractorType(value);
                                setShowContractorSearchModal(true);
                              } else {
                                await handleAssignContractor(contractorId);
                              }
                            }}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableContractors.map(contractor => (
                                  <SelectItem key={contractor.id} value={contractor.id}>{contractor.business_name}</SelectItem>
                                ))}
                                {availableContractors.length > 0 && <div className="mx-2 my-1 border-t border-slate-200" />}
                                <SelectItem value="add-new">
                                  <Plus className="h-4 w-4 inline mr-2" />
                                  Add New {label}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {typeContractors.length > 0 && (
                            <div className="divide-y divide-slate-100 border-t border-slate-200">
                              {typeContractors.map((contractor) => (
                                <div key={contractor.id} className="px-4 py-3 flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900">{contractor.business_name}</p>
                                    {contractor.contact_name && <p className="text-sm text-slate-500">Contact: {contractor.contact_name}</p>}
                                    <div className="mt-2 space-y-1 text-sm">
                                      {contractor.phone && (
                                        <a href={`tel:${contractor.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                          <Phone className="h-3.5 w-3.5" />
                                          {contractor.phone}
                                        </a>
                                      )}
                                      {contractor.email && (
                                        <a href={`mailto:${contractor.email}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                          {contractor.email}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      const updatedContractors = property.contractors?.filter(id => id !== contractor.id) || [];
                                      await base44.entities.Property.update(property.id, { contractors: updatedContractors });
                                      setProperty({ ...property, contractors: updatedContractors });
                                      if (updatedContractors.length > 0) {
                                        const contractorsData = await base44.entities.Contractor.filter({ id: { $in: updatedContractors } });
                                        setContractors(contractorsData);
                                      } else {
                                        setContractors([]);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* STORM TAB */}
            <TabsContent value="storm">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Storm Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Storm Protection Description</label>
                    <p className="text-xs text-slate-500 mb-2">Completely describe the storm protection, type of shutters, etc. that you have for your home.</p>
                    <textarea
                      value={property.storm_protection_description || ''}
                      onChange={(e) => { setProperty({...property, storm_protection_description: e.target.value}); setHasUnsavedChanges(true); }}
                      placeholder="e.g., Impact-resistant windows on all floors, accordion shutters on east-facing windows..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                      rows={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Storm Panels / Installation Contractor</label>
                    <p className="text-xs text-slate-500 mb-2">If you have storm panels that need to be installed, please note the contractor you have engaged.</p>
                    <textarea
                      value={property.storm_panels_notes || ''}
                      onChange={(e) => { setProperty({...property, storm_panels_notes: e.target.value}); setHasUnsavedChanges(true); }}
                      placeholder="e.g., Aluminum storm panels stored in garage — ABC Storm Services (555-123-4567) handles installation..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-black"
                      rows={4}
                    />
                  </div>
                  {hasUnsavedChanges && (
                    <div className="flex justify-end">
                      <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTACTS TAB */}
            <TabsContent value="contacts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowAddContact(true)} className="bg-slate-900 hover:bg-slate-800 text-white">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </CardHeader>
                <CardContent>
                  {(!property.emergency_contacts || property.emergency_contacts.length === 0) ? (
                    <p className="text-slate-400 italic text-center py-8">No emergency contacts added</p>
                  ) : (
                    <div className="space-y-4">
                      {property.emergency_contacts.map((contact, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-slate-500">{contact.relationship}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1 text-sm">
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                <Phone className="h-3.5 w-3.5" />
                                {contact.phone}
                              </a>
                            )}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                {contact.email}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      {/* Add Follow-Up Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
          <DialogHeader className="rounded-t-2xl bg-slate-900 px-6 pt-6 pb-4">
            <DialogTitle className="text-white text-lg font-semibold">Add Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="px-6 pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Follow-Up Title *</Label>
                <input id="task-title" type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g., Fix roof leak" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" />
              </div>
              <div>
                <Label htmlFor="task-description">Details</Label>
                <textarea id="task-description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task details..." className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-priority">Priority</Label>
                  <select id="task-priority" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="task-due-date">Due Date</Label>
                  <input id="task-due-date" type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 pb-6">
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button onClick={handleAddTask} disabled={savingTask} className="bg-slate-900 hover:bg-slate-800">
                {savingTask ? 'Creating...' : 'Create Follow-Up'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Emergency Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
          <DialogHeader className="rounded-t-2xl bg-slate-900 px-6 pt-6 pb-4">
            <DialogTitle className="text-white text-lg font-semibold">Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pt-4">
            <div>
              <Label htmlFor="contact-name">Name *</Label>
              <input id="contact-name" type="text" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Contact name" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" />
            </div>
            <div>
              <Label htmlFor="contact-relationship">Relationship</Label>
              <input id="contact-relationship" type="text" value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} placeholder="e.g., Owner, Manager" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <input id="contact-phone" type="tel" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone number" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <input id="contact-email" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="Email address" className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-black bg-white/60 backdrop-blur" />
            </div>
            <div className="flex justify-end gap-3 pt-2 pb-6">
              <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
              <Button onClick={handleAddContact} disabled={savingContact} className="bg-slate-900 hover:bg-slate-800">
                {savingContact ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contractor Search Modal */}
      <ContractorSearchDialog
        open={showContractorSearchModal}
        onOpenChange={setShowContractorSearchModal}
        onSelect={handleContractorSearchSelect}
        properties={allProperties}
        companyId={property?.tenant_id}
        currentProperty={property}
      />

      {/* Change Owner Dialog */}
      <Dialog open={showChangeOwnerDialog} onOpenChange={setShowChangeOwnerDialog}>
        <DialogContent className="max-w-sm rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
          <DialogHeader className="rounded-t-2xl bg-slate-900 px-6 pt-6 pb-4">
            <DialogTitle className="text-white text-lg font-semibold">Change Property Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pt-4 pb-6">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowChangeOwnerDialog(false)}>Cancel</Button>
              <Button onClick={handleChangeOwner} disabled={changingOwner || !selectedClientId} className="bg-slate-900 hover:bg-slate-800">
                {changingOwner ? 'Changing...' : 'Change Owner'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visit Type Selection Dialog */}
      <VisitTypeSelectionDialog
        open={showVisitTypeDialog}
        onOpenChange={setShowVisitTypeDialog}
        property={property}
        propertyChecklist={propertyChecklist}
      />
    </div>
  );
}