import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, AlertCircle, Clock, CheckCircle2, Save, 
  Trash2, User, Building2, FileText, Calendar
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
import PageHeader from '@/components/shared/PageHeader';

export default function IssueDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const issueId = searchParams.get('id');
  
  const [issue, setIssue] = useState(null);
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    assigned_to: '',
    assigned_to_name: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [issueId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0 && issueId) {
        const companyId = members[0].company_id;
        const [issueData, staffData] = await Promise.all([
          base44.entities.Issue.filter({ id: issueId }),
          base44.entities.CompanyMember.filter({ company_id: companyId, is_active: true })
        ]);
        
        if (issueData.length > 0) {
          const issueRecord = issueData[0];
          setIssue(issueRecord);
          setFormData({
            title: issueRecord.title || '',
            description: issueRecord.description || '',
            priority: issueRecord.priority || 'medium',
            status: issueRecord.status || 'open',
            assigned_to: issueRecord.assigned_to || '',
            assigned_to_name: issueRecord.assigned_to_name || '',
            notes: issueRecord.notes || ''
          });
          
          setStaff(staffData);
          
          // Load property if available
          if (issueRecord.property_id) {
            const propertiesData = await base44.entities.Property.filter({ id: issueRecord.property_id });
            if (propertiesData.length > 0) {
              setProperty(propertiesData[0]);
            }
          }
          
          // Load client if available
          if (issueRecord.client_id) {
            const clientsData = await base44.entities.Client.filter({ id: issueRecord.client_id });
            if (clientsData.length > 0) {
              setClient(clientsData[0]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!issue) return;
    
    setSaving(true);
    try {
      await base44.entities.Issue.update(issue.id, formData);
      setIssue({ ...issue, ...formData });
    } catch (error) {
      console.error('Error saving issue:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    
    try {
      await base44.entities.Issue.delete(issue.id);
      navigate(createPageUrl('Issues'));
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Issues'))} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Button>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Issue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(createPageUrl('Issues'))} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Issues
      </Button>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{formData.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <StatusBadge status={formData.status} />
                    <StatusBadge status={formData.priority} />
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

        {/* Sidebar */}
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
                {property.address && (
                  <p className="text-sm text-slate-500 mt-1">{property.address}</p>
                )}
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
                {client.email && (
                  <p className="text-sm text-slate-500 mt-1">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-sm text-slate-500">{client.phone}</p>
                )}
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
                {new Date(issue.created_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {issue.resolved_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  {new Date(issue.resolved_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this issue? This action cannot be undone.
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