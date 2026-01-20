import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Mail, Phone, MapPin, Building2, ClipboardCheck, 
  Edit, Plus, Calendar, DollarSign, ExternalLink,
  FileText, Clock, CheckCircle2, Upload, Download, Trash2, File, Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import InvoiceTab from '@/components/client/InvoiceTab';
import { toast } from 'sonner';

export default function ClientDetail() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [properties, setProperties] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showPortalDialog, setShowPortalDialog] = useState(false);
  const [portalEmail, setPortalEmail] = useState('');
  const [savingPortal, setSavingPortal] = useState(false);
  const [serviceSubscription, setServiceSubscription] = useState(null);
  const [additionalProducts, setAdditionalProducts] = useState([]);

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
      const [clientData, propertiesData, visitsData] = await Promise.all([
        base44.entities.Client.filter({ id }),
        base44.entities.Property.filter({ client_id: id }),
        base44.entities.Visit.filter({ client_id: id }, '-scheduled_date', 20)
      ]);

      if (clientData.length > 0) {
        const c = clientData[0];
        setClient(c);
        setProperties(propertiesData);
        setVisits(visitsData);
        setPortalEmail(c.portal_user_email || '');

        // Load service subscription details
        if (c.service_subscription_id) {
          const services = await base44.entities.ProductService.filter({ id: c.service_subscription_id });
          if (services.length > 0) {
            setServiceSubscription(services[0]);
          }
        }

        // Load additional products
        if (c.additional_products && c.additional_products.length > 0) {
          const allProducts = await base44.entities.ProductService.list();
          const selectedProducts = allProducts.filter(p => c.additional_products.includes(p.id));
          setAdditionalProducts(selectedProducts);
        }
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

  const completedVisits = visits.filter(v => v.status === 'completed').length;

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

  const handlePortalSetup = async () => {
    if (!portalEmail) {
      toast.error('Portal email is required');
      return;
    }

    setSavingPortal(true);
    try {
      await base44.entities.Client.update(client.id, {
        portal_access: true,
        portal_user_email: portalEmail
      });
      setClient({ ...client, portal_access: true, portal_user_email: portalEmail });
      setShowPortalDialog(false);
      toast.success('Portal access enabled for this client');
    } catch (error) {
      console.error('Error setting up portal:', error);
      toast.error('Failed to enable portal access');
    } finally {
      setSavingPortal(false);
    }
  };

  const handleDisablePortal = async () => {
    setSavingPortal(true);
    try {
      await base44.entities.Client.update(client.id, {
        portal_access: false,
        portal_user_email: ''
      });
      setClient({ ...client, portal_access: false, portal_user_email: '' });
      setPortalEmail('');
      toast.success('Portal access disabled');
    } catch (error) {
      console.error('Error disabling portal:', error);
      toast.error('Failed to disable portal access');
    } finally {
      setSavingPortal(false);
    }
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
                   <AvatarImage src={client.avatar_url} alt={`${client.first_name} ${client.last_name}`} />
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
              <div>
                <span className="text-sm text-slate-500 block mb-1">Subscription</span>
                <span className="font-medium">
                  {serviceSubscription ? serviceSubscription.name : 'No subscription'}
                </span>
              </div>
              {additionalProducts.length > 0 && (
                <div>
                  <span className="text-sm text-slate-500 block mb-1">Add-ons</span>
                  <div className="space-y-1">
                    {additionalProducts.map(product => (
                      <div key={product.id} className="text-sm font-medium">
                        {product.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-slate-500">Monthly Rate</span>
                <span className="font-semibold text-lg">
                  ${(() => {
                    let total = serviceSubscription?.price || 0;
                    additionalProducts.forEach(p => total += p.price);
                    return total.toFixed(2);
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Billing</span>
                <span className="font-medium capitalize">{client.billing_frequency || 'Monthly'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Portal Access */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Portal Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <span className={`font-medium text-sm px-2 py-1 rounded ${
                  client.portal_access ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {client.portal_access ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {client.portal_access && client.portal_user_email && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Portal Email</p>
                  <p className="font-mono text-sm text-slate-600">{client.portal_user_email}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {!client.portal_access ? (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setShowPortalDialog(true);
                      setPortalEmail(client.email || '');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create Portal
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleDisablePortal}
                    disabled={savingPortal}
                    className="w-full"
                  >
                    {savingPortal ? 'Disabling...' : 'Disable Portal'}
                  </Button>
                )}
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
                  <p className="text-2xl font-bold">{completedVisits}</p>
                  <p className="text-sm text-slate-500">Visits Completed</p>
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
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
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

            <TabsContent value="visits">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  {visits.length === 0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No visits"
                      description="No visits have been scheduled yet"
                    />
                  ) : (
                    <div className="space-y-3">
                      {visits.slice(0, 10).map((visit) => (
                        <Link
                          key={visit.id}
                          to={createPageUrl('InspectionDetail') + `?id=${visit.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <ClipboardCheck className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {format(new Date(visit.scheduled_date), 'MMM d, yyyy')}
                              </p>
                              <p className="text-sm text-slate-500 capitalize">{visit.visit_type === 'inspection' ? `${visit.inspection_type || 'routine'} inspection` : visit.followup_type || 'follow-up'}</p>
                            </div>
                          </div>
                          <StatusBadge status={visit.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <InvoiceTab clientId={client.id} client={client} />
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

      {/* Portal Setup Dialog */}
      <Dialog open={showPortalDialog} onOpenChange={setShowPortalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Client Portal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Enable portal access for this client. They will be able to view their properties and inspection reports.
            </p>
            <div>
              <Label htmlFor="portal-email">Portal Email Address *</Label>
              <input
                id="portal-email"
                type="email"
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 mt-1"
              />
              <p className="text-xs text-slate-500 mt-2">This is the email the client will use to log into their portal</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPortalDialog(false)}>Cancel</Button>
              <Button onClick={handlePortalSetup} disabled={savingPortal} className="bg-slate-900 hover:bg-slate-800">
                {savingPortal ? 'Creating...' : 'Create Portal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}