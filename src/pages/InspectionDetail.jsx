import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { 
  ClipboardCheck, Building2, User, Calendar, Clock, 
  MapPin, Play, CheckCircle2, AlertTriangle, Camera,
  FileText, Download, Send, Eye, Edit
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';

export default function InspectionDetail() {
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [staff, setStaff] = useState([]);
  const [editingDate, setEditingDate] = useState(false);
  const [editData, setEditData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    type: 'routine',
    assigned_to: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInspection();
  }, []);

  const loadInspection = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      navigate(createPageUrl('Inspections'));
      return;
    }

    try {
      const inspectionData = await base44.entities.Visit.filter({ id });
      
      if (inspectionData.length > 0) {
        const insp = inspectionData[0];
        setInspection(insp);
        setEditData({
          scheduled_date: insp.scheduled_date,
          scheduled_time: insp.scheduled_time || '',
          type: insp.visit_type === 'inspection' ? insp.inspection_type : insp.followup_type,
          assigned_to: insp.assigned_to || ''
        });
        
        const [propertyData, clientData, staffData] = await Promise.all([
          base44.entities.Property.filter({ id: insp.property_id }),
          insp.client_id ? base44.entities.Client.filter({ id: insp.client_id }) : [],
          base44.entities.CompanyMember.filter({ company_id: insp.company_id, is_active: true })
        ]);
        
        if (propertyData.length > 0) setProperty(propertyData[0]);
        if (clientData.length > 0) setClient(clientData[0]);
        setStaff(staffData);
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInspection = async () => {
    if (!inspection) return;
    
    setUpdating(true);
    try {
      const staffMember = staff.find(s => s.user_email === editData.assigned_to);
      const updateData = {
        scheduled_date: editData.scheduled_date,
        scheduled_time: editData.scheduled_time || null,
        assigned_to: editData.assigned_to || null,
        assigned_to_name: staffMember?.user_name || null
      };
      
      if (inspection.visit_type === 'inspection') {
        updateData.inspection_type = editData.type;
      } else {
        updateData.followup_type = editData.type;
      }
      
      await base44.entities.Visit.update(inspection.id, updateData);
      
      setShowEditDialog(false);
      loadInspection();
    } catch (error) {
      console.error('Error updating inspection:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotifyClient = async () => {
    if (!inspection || !client) return;
    
    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: client.email,
      subject: `Inspection Report - ${property?.name || property?.address}`,
      body: `
Dear ${client.first_name},

Your property inspection has been completed.

Property: ${property?.name || property?.address}
Date: ${format(new Date(inspection.scheduled_date), 'MMMM d, yyyy')}
Status: ${inspection.overall_status === 'all_clear' ? 'All Clear' : 'Issues Found'}

${inspection.summary_notes ? `Summary: ${inspection.summary_notes}` : ''}

You can view the full report in your client portal.

Best regards,
Your Property Management Team
      `.trim()
    });

    await base44.entities.Visit.update(inspection.id, {
      client_notified: true,
      client_notified_at: new Date().toISOString()
    });

    loadInspection();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Inspection not found</p>
      </div>
    );
  }

  const totalItems = inspection.checklist_data?.reduce((sum, section) => sum + (section.items?.length || 0), 0) || 0;
  const completedItems = inspection.checklist_data?.reduce((sum, section) => 
    sum + (section.items?.filter(item => item.status)?.length || 0), 0) || 0;
  const flaggedItems = inspection.checklist_data?.reduce((sum, section) => 
    sum + (section.items?.filter(item => item.flagged)?.length || 0), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={`Visit - ${format(parseISO(inspection.scheduled_date), 'MMM d, yyyy')}`}
        backLink="Inspections"
        backLabel="Back to Visits"
      >
        <div className="flex gap-3">
          {inspection.status === 'scheduled' && (
            <>
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => navigate(createPageUrl('VisitFlow') + `?id=${inspection.id}`)} className="bg-black text-white hover:bg-slate-900">
                <Play className="h-4 w-4 mr-2" />
                 Start Check-In
                </Button>
            </>
          )}
          {inspection.status === 'in_progress' && (
            <Button onClick={() => navigate(createPageUrl('VisitFlow') + `?id=${inspection.id}`)} className="bg-black text-white hover:bg-slate-900">
              <Play className="h-4 w-4 mr-2" />
              Continue Visit
            </Button>
          )}
          {inspection.status === 'completed' && !inspection.client_notified && client && (
            <Button onClick={handleNotifyClient}>
              <Send className="h-4 w-4 mr-2" />
              Notify Client
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Status Banner */}
      {inspection.status === 'completed' && (
        <Card className={`mb-6 ${
          inspection.overall_status === 'all_clear' 
            ? 'bg-emerald-50 border-emerald-200' 
            : inspection.overall_status === 'urgent'
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
        }`}>
          <CardContent className="flex items-center gap-4 py-4">
            {inspection.overall_status === 'all_clear' ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <AlertTriangle className={`h-8 w-8 ${inspection.overall_status === 'urgent' ? 'text-red-600' : 'text-amber-600'}`} />
            )}
            <div>
              <p className={`font-semibold ${
                inspection.overall_status === 'all_clear' 
                  ? 'text-emerald-900' 
                  : inspection.overall_status === 'urgent'
                    ? 'text-red-900'
                    : 'text-amber-900'
              }`}>
                {inspection.overall_status === 'all_clear' 
                  ? 'All Clear - No Issues Found' 
                  : inspection.overall_status === 'urgent'
                    ? 'Urgent Issues Require Attention'
                    : 'Issues Found - Review Required'}
              </p>
              {inspection.summary_notes && (
                <p className="text-sm mt-1 opacity-80">{inspection.summary_notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Property</CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                to={createPageUrl('PropertyDetail') + `?id=${property?.id}`}
                className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                  {property?.primary_photo_url ? (
                    <img src={property.primary_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{property?.name || property?.address}</p>
                  <p className="text-sm text-slate-500">{property?.city}, {property?.state}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Inspection Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={inspection.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Type</span>
                <StatusBadge status={inspection.visit_type === 'inspection' ? inspection.inspection_type : inspection.followup_type} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Scheduled</span>
                {editingDate ? (
                  <Input
                    type="date"
                    value={editData.scheduled_date}
                    onChange={(e) => setEditData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    onBlur={async () => {
                      if (editData.scheduled_date !== inspection.scheduled_date) {
                        setUpdating(true);
                        try {
                          await base44.entities.Visit.update(inspection.id, {
                            scheduled_date: editData.scheduled_date
                          });
                          setInspection(prev => ({ ...prev, scheduled_date: editData.scheduled_date }));
                        } catch (error) {
                          console.error('Error updating date:', error);
                          setEditData(prev => ({ ...prev, scheduled_date: inspection.scheduled_date }));
                        } finally {
                          setUpdating(false);
                          setEditingDate(false);
                        }
                      } else {
                        setEditingDate(false);
                      }
                    }}
                    autoFocus
                    className="w-40"
                  />
                ) : (
                  <button
                    onClick={() => setEditingDate(true)}
                    className="font-medium hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                  >
                    {format(parseISO(inspection.scheduled_date), 'MMM d, yyyy')}
                  </button>
                )}
              </div>
              {inspection.scheduled_time && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="font-medium">{inspection.scheduled_time}</span>
                </div>
              )}
              {inspection.assigned_to_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned</span>
                  <span className="font-medium">{inspection.assigned_to_name}</span>
                </div>
              )}
              {inspection.completed_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-medium">
                    {format(new Date(inspection.completed_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {inspection.status === 'completed' && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedItems}/{totalItems}</p>
                    <p className="text-sm text-slate-500">Items Checked</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{flaggedItems}</p>
                    <p className="text-sm text-slate-500">Issues Flagged</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inspection.photo_count || 0}</p>
                    <p className="text-sm text-slate-500">Photos Taken</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Notification */}
          {inspection.status === 'completed' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-500">Client Notification</span>
                </div>
                {inspection.client_notified ? (
                  <p className="text-sm text-emerald-600">
                    ✓ Sent {inspection.client_notified_at && format(new Date(inspection.client_notified_at), 'MMM d, h:mm a')}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Not yet notified</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="checklist">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="checklist">Visit</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              {inspection.issues_found?.length > 0 && (
                <TabsTrigger value="issues">Issues ({inspection.issues_found.length})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="checklist">
              <Card>
                <CardContent className="pt-6">
                  {!inspection.checklist_data || inspection.checklist_data.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <ClipboardCheck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p>No checklist data available</p>
                      {inspection.status === 'scheduled' && (
                        <Button 
                          className="mt-4 bg-black text-white hover:bg-slate-900"
                          onClick={() => navigate(createPageUrl('VisitFlow') + `?id=${inspection.id}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Check-In
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {inspection.checklist_data.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <h3 className="font-semibold text-slate-900 mb-3">{section.section_name}</h3>
                          <div className="space-y-2">
                            {section.items?.map((item, itemIndex) => (
                              <div 
                                key={itemIndex}
                                className={`p-3 rounded-lg border ${
                                  item.flagged 
                                    ? 'bg-amber-50 border-amber-200' 
                                    : item.status === 'pass' || item.status === 'yes'
                                      ? 'bg-emerald-50 border-emerald-200'
                                      : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-2">
                                    {item.flagged ? (
                                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    ) : item.status === 'pass' || item.status === 'yes' ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border-2 border-slate-300 mt-0.5" />
                                    )}
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      {item.notes && (
                                        <p className="text-sm text-slate-600 mt-1">{item.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                  {item.status && (
                                    <Badge variant="outline" className="capitalize">
                                      {item.status}
                                    </Badge>
                                  )}
                                </div>
                                {item.photo_urls?.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {item.photo_urls.map((url, photoIndex) => (
                                      <a 
                                        key={photoIndex}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-16 w-16 rounded-lg overflow-hidden bg-slate-100"
                                      >
                                        <img src={url} alt="" className="h-full w-full object-cover" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos">
              <Card>
                <CardContent className="pt-6">
                  {(() => {
                    const allPhotos = inspection.checklist_data?.flatMap(section => 
                      section.items?.flatMap(item => item.photo_urls || []) || []
                    ) || [];
                    
                    if (allPhotos.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-500">
                          <Camera className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                          <p>No photos taken</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {allPhotos.map((url, index) => (
                          <a 
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity"
                          >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {inspection.issues_found?.length > 0 && (
              <TabsContent value="issues">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-slate-500">Issues from this visit are tracked in the Issues page</p>
                      <Link to={createPageUrl('Issues')}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View All Issues
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {inspection.issues_found.map((issue, index) => (
                        <div key={index} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-amber-900">{issue.item_name}</p>
                              <p className="text-sm text-amber-800 mt-1">{issue.description}</p>
                              {issue.severity && (
                                <Badge variant="outline" className="mt-2 capitalize">
                                  {issue.severity} severity
                                </Badge>
                              )}
                            </div>
                            {issue.photo_url && (
                              <a 
                                href={issue.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-16 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0"
                              >
                                <img src={issue.photo_url} alt="" className="h-full w-full object-cover" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Edit Inspection Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Visit</DialogTitle>
            <DialogDescription>
              Update visit details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editData.scheduled_date}
                  onChange={(e) => setEditData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={editData.scheduled_time}
                  onChange={(e) => setEditData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={editData.type}
                onValueChange={(value) => setEditData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="pre_storm">Pre-Storm</SelectItem>
                  <SelectItem value="post_storm">Post-Storm</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="custom_client_request">Custom Client Request</SelectItem>
                  <SelectItem value="drop_in">Drop-In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assign To</Label>
              <Select
                value={editData.assigned_to}
                onValueChange={(value) => setEditData(prev => ({ ...prev, assigned_to: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value={null}>Unassigned</SelectItem>
                   {staff.map((member) => (
                    <SelectItem key={member.id} value={member.user_email}>
                      {member.user_name || member.user_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updating}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateInspection}
              disabled={updating || !editData.scheduled_date}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {updating ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}