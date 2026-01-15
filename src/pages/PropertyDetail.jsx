import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, MapPin, User, Key, Wifi, Phone, 
  Edit, ClipboardCheck, Calendar, Clock, 
  AlertTriangle, CheckCircle2, FileText, Upload, Image, 
  AlertCircle, Circle
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
  const [inspections, setInspections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fetchingAerial, setFetchingAerial] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingOwner, setChangingOwner] = useState(false);
  const [showChangeOwnerDialog, setShowChangeOwnerDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    loadProperty();
  }, []);

  const loadProperty = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      navigate(createPageUrl('Properties'));
      return;
    }

    try {
      const [propertyData, inspectionsData, tasksData] = await Promise.all([
        base44.entities.Property.filter({ id }),
        base44.entities.Inspection.filter({ property_id: id }, '-scheduled_date', 20),
        base44.entities.Task.filter({ property_id: id }, '-created_date', 10)
      ]);

      if (propertyData.length > 0) {
        const prop = propertyData[0];
        setProperty(prop);
        setInspections(inspectionsData);
        setTasks(tasksData);
        
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

  const completedInspections = inspections.filter(i => i.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  
  const tasksByStatus = {
    completed: tasks.filter(t => t.status === 'completed'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    pending: tasks.filter(t => t.status === 'pending'),
    upcoming: tasks.filter(t => t.due_date && new Date(t.due_date) > new Date() && t.status === 'pending')
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
        <Button onClick={() => navigate(createPageUrl('Inspections') + `?action=new&property_id=${property.id}`)}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          <span>New Inspection</span>
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
                  <p className="text-2xl font-bold">{completedInspections}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTasks}</p>
                  <p className="text-sm text-slate-500">Pending Tasks</p>
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
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspections">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Inspections</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(createPageUrl('Inspections') + `?action=new&property_id=${property.id}`)}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </CardHeader>
                <CardContent>
                  {inspections.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No inspections"
                      description="Schedule the first inspection for this property"
                    />
                  ) : (
                    <div className="space-y-3">
                      {inspections.slice(0, 10).map((inspection) => (
                        <Link
                          key={inspection.id}
                          to={createPageUrl('InspectionDetail') + `?id=${inspection.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <ClipboardCheck className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {format(new Date(inspection.scheduled_date), 'MMM d, yyyy')}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="capitalize">{inspection.type}</span>
                                {inspection.assigned_to_name && (
                                  <>
                                    <span>•</span>
                                    <span>{inspection.assigned_to_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={inspection.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No tasks"
                      description="No tasks assigned to this property"
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* In Progress */}
                      {tasksByStatus.in_progress.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            In Progress ({tasksByStatus.in_progress.length})
                          </h4>
                          <div className="space-y-2">
                            {tasksByStatus.in_progress.map((task) => (
                              <div key={task.id} className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">{task.title}</p>
                                    {task.description && (
                                      <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">In Progress</span>
                                      {task.priority && (
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{task.priority}</span>
                                      )}
                                      {task.due_date && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(task.due_date), 'MMM d')}
                                        </span>
                                      )}
                                      {task.assigned_to_name && (
                                        <span className="text-slate-600">Assigned: {task.assigned_to_name}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending */}
                      {tasksByStatus.pending.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            Pending ({tasksByStatus.pending.length})
                          </h4>
                          <div className="space-y-2">
                            {tasksByStatus.pending.map((task) => (
                              <div key={task.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">{task.title}</p>
                                    {task.description && (
                                      <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
                                      {task.priority && (
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{task.priority}</span>
                                      )}
                                      {task.due_date && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(task.due_date), 'MMM d')}
                                        </span>
                                      )}
                                      {task.assigned_to_name && (
                                        <span className="text-slate-600">Assigned: {task.assigned_to_name}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed */}
                      {tasksByStatus.completed.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Completed ({tasksByStatus.completed.length})
                          </h4>
                          <div className="space-y-2">
                            {tasksByStatus.completed.map((task) => (
                              <div key={task.id} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900 line-through text-slate-600">{task.title}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">Completed</span>
                                      {task.completed_at && (
                                        <span className="flex items-center gap-1 text-slate-600">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(task.completed_at), 'MMM d')}
                                        </span>
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
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contractors
                  </CardTitle>
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
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
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