import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, AlertCircle, Clock, CheckCircle2, Save, 
  Trash2, User, Building2, FileText, Calendar, Briefcase
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StatusBadge from '@/components/shared/StatusBadge';

export default function FollowUpDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = searchParams.get('id');
  
  const [item, setItem] = useState(null);
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [contractor, setContractor] = useState(null);
  const [staff, setStaff] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'issue',
    priority: 'medium',
    status: 'open',
    assigned_to: '',
    assigned_to_name: '',
    contractor_id: '',
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [itemId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0 && itemId) {
        const companyId = members[0].company_id;
        const [itemData, staffData, contractorsData] = await Promise.all([
          base44.entities.FollowUp.filter({ id: itemId }),
          base44.entities.CompanyMember.filter({ company_id: companyId, is_active: true }),
          base44.entities.Contractor.filter({ company_id: companyId, is_active: true })
        ]);
        
        if (itemData.length > 0) {
          const record = itemData[0];
          setItem(record);
          setFormData({
            title: record.title || '',
            description: record.description || '',
            type: record.type || 'issue',
            priority: record.priority || 'medium',
            status: record.status || 'open',
            assigned_to: record.assigned_to || '',
            assigned_to_name: record.assigned_to_name || '',
            contractor_id: record.contractor_id || '',
            due_date: record.due_date || '',
            notes: record.notes || ''
          });
          
          setStaff(staffData);
          setContractors(contractorsData);
          
          if (record.property_id) {
            const propertiesData = await base44.entities.Property.filter({ id: record.property_id, company_id: companyId });
            if (propertiesData.length > 0) setProperty(propertiesData[0]);
          }
          
          if (record.client_id) {
            const clientsData = await base44.entities.Client.filter({ id: record.client_id, company_id: companyId });
            if (clientsData.length > 0) setClient(clientsData[0]);
          }

          if (record.contractor_id) {
            const contractorData = contractorsData.find(c => c.id === record.contractor_id);
            if (contractorData) setContractor(contractorData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!item) return;
    
    setSaving(true);
    try {
      await base44.entities.FollowUp.update(item.id, formData);
      setItem({ ...item, ...formData });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    try {
      await base44.entities.FollowUp.delete(item.id);
      navigate(createPageUrl('FollowUps'));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('FollowUps'))} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Follow-Ups
        </Button>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Follow-up not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('FollowUps'))} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Follow-Ups
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{formData.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge status={formData.status} />
                    <StatusBadge status={formData.priority} />
                    <Badge variant="outline" className="capitalize">{formData.type.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issue">Issue</SelectItem>
                      <SelectItem value="contractor_appointment">Contractor Appointment</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection_followup">Inspection Follow-up</SelectItem>
                      <SelectItem value="arrival_prep">Arrival Prep</SelectItem>
                      <SelectItem value="departure">Departure</SelectItem>
                      <SelectItem value="storm_prep">Storm Prep</SelectItem>
                      <SelectItem value="client_request">Client Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-2 min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select 
                  value={formData.assigned_to || 'unassigned'} 
                  onValueChange={(value) => {
                    const selected = staff.find(s => s.user_email === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      assigned_to: value === 'unassigned' ? '' : value,
                      assigned_to_name: value === 'unassigned' ? '' : selected?.user_name || ''
                    }));
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staff.map(member => (
                      <SelectItem key={member.id} value={member.user_email}>
                        {member.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'contractor_appointment' && (
                <div>
                  <Label htmlFor="contractor">Contractor</Label>
                  <Select 
                    value={formData.contractor_id || 'none'} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractor_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Contractor</SelectItem>
                      {contractors.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.business_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-2 min-h-20"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {property && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{property.name || property.address}</p>
                {property.city && property.state && (
                  <p className="text-sm text-slate-500">{property.city}, {property.state}</p>
                )}
              </CardContent>
            </Card>
          )}

          {client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{client.first_name} {client.last_name}</p>
                {client.email && <p className="text-sm text-slate-500">{client.email}</p>}
              </CardContent>
            </Card>
          )}

          {contractor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-4 w-4" />
                  Contractor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{contractor.business_name}</p>
                {contractor.contact_name && <p className="text-sm text-slate-500">{contractor.contact_name}</p>}
                {contractor.phone && <p className="text-sm text-slate-500">{contractor.phone}</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {new Date(item.created_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {item.completed_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  {new Date(item.completed_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}