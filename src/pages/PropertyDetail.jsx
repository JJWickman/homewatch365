import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, MapPin, User, Key, Wifi, Phone, 
  Edit, ClipboardCheck, Calendar, Clock, 
  AlertTriangle, CheckCircle2, FileText, Upload, Image, 
  AlertCircle, Circle, Plus
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
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

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

  useEffect(() => {
    loadProperty();
  }, []);

  useEffect(() => {
    if (property?.latitude && property?.longitude) {
      loadMapUrl();
    }
  }, [property?.latitude, property?.longitude]);

  const loadMapUrl = async () => {
    if (!property?.latitude || !property?.longitude) return;
    
    setLoadingMap(true);
    try {
      const response = await base44.functions.invoke('generateStaticMapUrl', {
        stops: [{
          latitude: property.latitude,
          longitude: property.longitude,
          order: 1
        }]
      });
      
      if (response.data?.mapUrl) {
        setMapUrl(response.data.mapUrl);
      }
    } catch (error) {
      console.error('Error loading map:', error);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    if (!property?.id) return;
    const unsubscribe = base44.entities.Visit.subscribe((event) => {
      if (event.property_id === property.id) {
        if (event.type === 'create') {
          setVisits(prev => [event.data, ...prev]);
        } else if (event.type === 'update') {
          setVisits(prev => prev.map(v => v.id === event.id ? event.data : v));
        } else if (event.type === 'delete') {
          setVisits(prev => prev.filter(v => v.id !== event.id));
        }
      }
    });
    return unsubscribe;
  }, [property?.id]);

  const loadProperty = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      navigate(createPageUrl('Properties'));
      return;
    }

    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      const companyId = members[0]?.company_id;

      const [propertyData, visitsData] = await Promise.all([
        base44.entities.Property.filter({ id, company_id: companyId }),
        base44.entities.Visit.filter({ property_id: id, company_id: companyId }, '-scheduled_date', 20)
      ]);

      if (propertyData.length > 0) {
        const prop = propertyData[0];
        setProperty(prop);
        setVisits(visitsData);
        
        // Load client and all clients
        if (prop.client_id) {
          const [clientData, allClientsData] = await Promise.all([
            base44.entities.Client.filter({ id: prop.client_id }),
            base44.entities.Client.filter({ company_id: prop.company_id, is_active: true })
          ]);
          if (clientData.length > 0) {
            setClient(clientData[0]);
          }
          setClients(allClientsData);
        }
        
        // Load contractors
        if (prop.contractors && prop.contractors.length > 0) {
          const contractorsData = await base44.entities.Contractor.filter({ 
            id: { $in: prop.contractors } 
          });
          setContractors(contractorsData);
        }
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
  
  const filteredVisits = visits.filter(v => visitTypeFilter === 'all' || v.visit_type === visitTypeFilter);
  
  const visitsByType = {
    inspection: filteredVisits.filter(v => v.visit_type === 'inspection'),
    followup: filteredVisits.filter(v => v.visit_type === 'followup')
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <Circle className="h-5 w-5 text-slate-400" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'pending':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
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
    if (!property.address || !property.city || !property.state) {
      toast.error('Property address is incomplete');
      return;
    }

    setFetchingAerial(true);
    try {
      const response = await base44.functions.invoke('testGoogleMapsAPI', {
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip
      });

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
        primary_photo_url: property.primary_photo_url 
      });
      setHasUnsavedChanges(false);
      toast.success('Property saved successfully');
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

  const handleAddTask = async () => {
    if (!newTask.title) {
      toast.error('Please enter a task title');
      return;
    }

    setSavingTask(true);
    try {
      await base44.entities.FollowUp.create({
        company_id: property.company_id,
        property_id: property.id,
        client_id: property.client_id,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        due_date: newTask.due_date,
        type: 'other',
        status: 'open'
      });
      setVisits(await base44.entities.Visit.filter({ property_id: property.id, company_id: property.company_id }, '-scheduled_date', 20));
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
    if (!newContact.name) {
      toast.error('Please enter a contact name');
      return;
    }

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

  return (
    <div className="max-w-5xl mx-auto">
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
        <Button variant="outline" onClick={() => navigate(createPageUrl('PropertyForm') + `?id=${property.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          <span>Edit</span>
        </Button>
      </PageHeader>

      {/* Hero Image */}
      <Card className="mb-6 overflow-hidden">
        <div className="aspect-[3/1] bg-slate-100 relative flex items-center justify-center">
          {property.primary_photo_url ? (
            <img 
              src={property.primary_photo_url}
              alt={property.name || property.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400">No photo uploaded</div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <StatusBadge status={property.status} />
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => document.getElementById('photo-upload').click()}
              disabled={uploadingPhoto}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFetchAerialView}
              disabled={fetchingAerial}
            >
              <Image className="h-4 w-4 mr-2" />
              {fetchingAerial ? 'Fetching...' : 'Fetch Aerial View'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Address Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium">{property.address}</p>
                  <p className="text-slate-500">{property.city}, {property.state} {property.zip}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Card */}
          {client && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">Owner</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setSelectedClientId(property.client_id);
                    setShowChangeOwnerDialog(true);
                  }}
                >
                  Change
                </Button>
              </CardHeader>
              <CardContent>
                <Link 
                  to={createPageUrl('ClientDetail') + `?id=${client.id}`}
                  className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-medium">
                    {client.first_name?.[0]}{client.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{client.first_name} {client.last_name}</p>
                    <p className="text-sm text-slate-500">{client.email}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Property Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-medium capitalize">{property.property_type?.replace('_', ' ')}</span>
              </div>
              {property.square_feet && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Size</span>
                  <span className="font-medium">{property.square_feet.toLocaleString()} sqft</span>
                </div>
              )}
              {property.bedrooms && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Inspection</span>
                <span className="font-medium capitalize">{property.inspection_frequency?.replace('_', '-')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                   <p className="text-2xl font-bold">{completedVisits}</p>
                   <p className="text-sm text-slate-500">Completed</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingVisits}</p>
                  <p className="text-sm text-slate-500">Pending Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="access">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="access">Access Info</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="contractors">Contractors</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="access">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Access Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {property.access_instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2">Access Instructions</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{property.access_instructions}</p>
                    </div>
                  )}
                  
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
                    {property.gate_code && (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Gate Code</p>
                        <p className="font-mono font-semibold text-lg">{property.gate_code}</p>
                      </div>
                    )}
                  </div>

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

                  {(!property.access_instructions && !property.alarm_code && !property.lockbox_code && !property.wifi_network) && (
                   <p className="text-slate-400 italic text-center py-4">No access information provided</p>
                  )}

                  {/* Static Map */}
                  {property.latitude && property.longitude && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <h4 className="text-sm font-medium text-slate-500">Location</h4>
                      </div>
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        {loadingMap ? (
                          <div className="w-full h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                          </div>
                        ) : mapUrl ? (
                          <img
                            src={mapUrl}
                            alt="Property Location"
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <div className="w-full h-64 flex items-center justify-center text-slate-400">
                            Map unavailable
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Use this map to verify you're at the correct location
                      </p>
                    </div>
                  )}
                  </CardContent>
                  </Card>
                  </TabsContent>

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
                        <SelectItem value="inspection">Inspections</SelectItem>
                        <SelectItem value="followup">Follow-Ups</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(createPageUrl('Inspections') + `?action=new&property_id=${property.id}`)}
                      className="bg-black hover:bg-gray-900 text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredVisits.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No visits"
                      description="Schedule your first visit for this property"
                    />
                  ) : (
                    <div className="space-y-6">
                      {visitsByType.inspection.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-blue-600" />
                            Inspections ({visitsByType.inspection.length})
                          </h4>
                          <div className="space-y-2">
                            {visitsByType.inspection.map((visit) => (
                              <Link
                                key={visit.id}
                                to={createPageUrl('InspectionDetail') + `?id=${visit.id}`}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <ClipboardCheck className="h-5 w-5 text-slate-500" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900">
                                      {format(new Date(visit.scheduled_date), 'MMM d, yyyy')}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                      <span className="capitalize">{visit.inspection_type || 'routine'}</span>
                                      {visit.assigned_to_name && (
                                        <>
                                          <span>•</span>
                                          <span>{visit.assigned_to_name}</span>
                                        </>
                                      )}
                                    </div>
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
                                    {visit.description && (
                                      <p className="text-sm text-slate-600 mt-1">{visit.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <StatusBadge status={visit.status} />
                                      {visit.priority && (
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{visit.priority}</span>
                                      )}
                                      {visit.scheduled_date && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(visit.scheduled_date), 'MMM d')}
                                        </span>
                                      )}
                                      {visit.assigned_to_name && (
                                        <span className="text-slate-600">Assigned: {visit.assigned_to_name}</span>
                                      )}
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

            <TabsContent value="contractors">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contractors
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(createPageUrl('PropertyForm') + `?id=${property.id}#contractors`)}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                </CardHeader>
                <CardContent>
                  {contractors.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-8">No contractors assigned</p>
                  ) : (
                    <div className="space-y-3">
                      {contractors.map((contractor) => (
                        <div key={contractor.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">{contractor.business_name}</p>
                              <p className="text-sm text-amber-600 capitalize font-medium">
                                {contractor.contractor_type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          {contractor.contact_name && (
                            <p className="text-sm text-slate-600 mb-2">Contact: {contractor.contact_name}</p>
                          )}
                          <div className="space-y-1 text-sm">
                            {contractor.phone && (
                              <a href={`tel:${contractor.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                                <Phone className="h-3.5 w-3.5" />
                                {contractor.phone}
                              </a>
                            )}
                            {contractor.email && (
                              <a href={`mailto:${contractor.email}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mt-1">
                                {contractor.email}
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

            <TabsContent value="contacts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddContact(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
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
      </div>

      {/* Add Follow-Up Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Add Follow-Up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Follow-Up Title *</Label>
              <input
                id="task-title"
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Fix roof leak"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Details</Label>
              <textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task details..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <Label htmlFor="task-due-date">Due Date</Label>
                <input
                  id="task-due-date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-name">Name *</Label>
              <input
                id="contact-name"
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Contact name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <Label htmlFor="contact-relationship">Relationship</Label>
              <input
                id="contact-relationship"
                type="text"
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                placeholder="e.g., Owner, Manager"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone</Label>
              <input
                id="contact-phone"
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <input
                id="contact-email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="Email address"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
              <Button onClick={handleAddContact} disabled={savingContact} className="bg-slate-900 hover:bg-slate-800">
                {savingContact ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Owner Dialog */}
      <Dialog open={showChangeOwnerDialog} onOpenChange={setShowChangeOwnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Property Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowChangeOwnerDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangeOwner} disabled={changingOwner || !selectedClientId}>
                {changingOwner ? 'Changing...' : 'Change Owner'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}