import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Building2, MapPin, User, Key, Wifi, Phone, 
  Edit, ClipboardCheck, Calendar, Clock, 
  AlertTriangle, CheckCircle2, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';

export default function PropertyDetail() {
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setProperty(propertyData[0]);
        setInspections(inspectionsData);
        setTasks(tasksData);
        
        // Load client
        if (propertyData[0].client_id) {
          const clientData = await base44.entities.Client.filter({ id: propertyData[0].client_id });
          if (clientData.length > 0) {
            setClient(clientData[0]);
          }
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

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={property.name || property.address}
        backLink="Properties"
        backLabel="Back to Properties"
      >
        <Button variant="outline" onClick={() => navigate(createPageUrl('PropertyForm') + `?id=${property.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button onClick={() => navigate(createPageUrl('Inspections') + `?action=new&property_id=${property.id}`)}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          New Inspection
        </Button>
      </PageHeader>

      {/* Hero Image */}
      <Card className="mb-6 overflow-hidden">
        <div className="aspect-[3/1] bg-slate-100 relative">
          <img 
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(property.address + ', ' + property.city + ', ' + property.state + ' ' + property.zip)}&zoom=17&size=1200x400&maptype=roadmap&markers=color:red%7C${encodeURIComponent(property.address + ', ' + property.city + ', ' + property.state + ' ' + property.zip)}`}
            alt={property.name || property.address}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <StatusBadge status={property.status} />
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Owner</CardTitle>
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
    </div>
  );
}