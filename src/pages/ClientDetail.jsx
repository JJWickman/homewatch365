import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Mail, Phone, MapPin, Building2, ClipboardCheck, 
  Edit, Plus, Calendar, DollarSign, ExternalLink,
  FileText, Clock, CheckCircle2, Upload, Download, Trash2, File
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

export default function ClientDetail() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [properties, setProperties] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      navigate(createPageUrl('Clients'));
      return;
    }

    try {
      const [clientData, propertiesData, inspectionsData] = await Promise.all([
        base44.entities.Client.filter({ id }),
        base44.entities.Property.filter({ client_id: id }),
        base44.entities.Inspection.filter({ client_id: id }, '-scheduled_date', 20)
      ]);

      if (clientData.length > 0) {
        setClient(clientData[0]);
        setProperties(propertiesData);
        setInspections(inspectionsData);
      }
    } catch (error) {
      console.error('Error loading client:', error);
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

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Client not found</p>
      </div>
    );
  }

  const getInitials = () => {
    return `${client.first_name?.[0] || ''}${client.last_name?.[0] || ''}`.toUpperCase();
  };

  const completedInspections = inspections.filter(i => i.status === 'completed').length;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newFile = {
        name: file.name,
        url: file_url,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      };

      const updatedFiles = [...(client.files || []), newFile];
      await base44.entities.Client.update(client.id, { files: updatedFiles });
      setClient({ ...client, files: updatedFiles });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDelete = async (fileUrl) => {
    try {
      const updatedFiles = client.files.filter(f => f.url !== fileUrl);
      await base44.entities.Client.update(client.id, { files: updatedFiles });
      setClient({ ...client, files: updatedFiles });
      toast.success('File deleted');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎥';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('sheet') || type?.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={`${client.first_name} ${client.last_name}`}
        backLink="Clients"
        backLabel="Back to Clients"
      >
        <Button variant="outline" onClick={() => navigate(createPageUrl('ClientForm') + `?id=${client.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="bg-slate-900 text-white text-xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{client.first_name} {client.last_name}</h2>
                <StatusBadge status={client.billing_status || 'active'} className="mt-2" />
              </div>

              <div className="mt-6 space-y-3">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {client.phone}
                  </a>
                )}
                {client.address && (
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <span>
                      {client.address}<br />
                      {client.city}, {client.state} {client.zip}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Service Tier</span>
                <span className="font-medium capitalize">{client.service_tier || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Monthly Rate</span>
                <span className="font-medium">
                  {client.monthly_rate ? `$${client.monthly_rate.toFixed(2)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Billing</span>
                <span className="font-medium capitalize">{client.billing_frequency || 'Monthly'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Portal Access</span>
                <span className="font-medium">{client.portal_access ? 'Enabled' : 'Disabled'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{properties.length}</p>
                  <p className="text-sm text-slate-500">Properties</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedInspections}</p>
                  <p className="text-sm text-slate-500">Inspections Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="properties">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Properties</CardTitle>
                  <Button size="sm" onClick={() => navigate(createPageUrl('PropertyForm') + `?client_id=${client.id}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add Property</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <EmptyState
                      icon={Building2}
                      title="No properties"
                      description="Add the first property for this client"
                      action={() => navigate(createPageUrl('PropertyForm') + `?client_id=${client.id}`)}
                      actionLabel="Add Property"
                    />
                  ) : (
                    <div className="space-y-3">
                      {properties.map((property) => (
                        <Link
                          key={property.id}
                          to={createPageUrl('PropertyDetail') + `?id=${property.id}`}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border"
                        >
                          <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            {property.primary_photo_url ? (
                              <img src={property.primary_photo_url} alt="" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              <Building2 className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {property.name || property.address}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {property.city}, {property.state}
                            </p>
                          </div>
                          <StatusBadge status={property.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspections">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  {inspections.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No inspections"
                      description="No inspections have been scheduled yet"
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
                              <p className="text-sm text-slate-500 capitalize">{inspection.type} inspection</p>
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

            <TabsContent value="files">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Files & Documents</CardTitle>
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => document.getElementById('file-upload').click()}
                      disabled={uploadingFile}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span>{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!client.files || client.files.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No files uploaded"
                      description="Upload documents, images, videos, or any other files"
                      action={() => document.getElementById('file-upload').click()}
                      actionLabel="Upload File"
                    />
                  ) : (
                    <div className="space-y-2">
                      {client.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-2xl">{getFileIcon(file.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{file.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{formatFileSize(file.size)}</span>
                                {file.uploaded_at && (
                                  <>
                                    <span>•</span>
                                    <span>{format(new Date(file.uploaded_at), 'MMM d, yyyy')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFileDelete(file.url)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.notes ? (
                    <p className="text-slate-600 whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <p className="text-slate-400 italic">No notes added</p>
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