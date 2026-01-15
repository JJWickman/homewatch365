import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  AlertCircle, Clock, CheckCircle2, Plus, Building2, 
  ChevronRight, Search, Filter, User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';

const statusConfig = {
  open: { 
    label: 'Open', 
    icon: AlertCircle, 
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: Clock, 
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200'
  },
  closed: { 
    label: 'Closed', 
    icon: CheckCircle2, 
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200'
  }
};

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    property_id: '',
    priority: 'medium',
    status: 'open'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.Issue.subscribe((event) => {
      if (event.type === 'create') {
        setIssues(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setIssues(prev => prev.map(i => i.id === event.id ? event.data : i));
      } else if (event.type === 'delete') {
        setIssues(prev => prev.filter(i => i.id !== event.id));
      }
    });
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const companyId = members[0].company_id;
        const [issuesData, propertiesData, clientsData, staffData] = await Promise.all([
          base44.entities.Issue.filter({ company_id: companyId }),
          base44.entities.Property.filter({ company_id: companyId }),
          base44.entities.Client.filter({ company_id: companyId }),
          base44.entities.CompanyMember.filter({ company_id: companyId, is_active: true })
        ]);
        setIssues(issuesData);
        setProperties(propertiesData);
        setClients(clientsData);
        setStaff(staffData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const property = properties.find(p => p.id === newIssue.property_id);
        await base44.entities.Issue.create({
          ...newIssue,
          company_id: members[0].company_id,
          client_id: property?.client_id
        });
        setShowNewDialog(false);
        setNewIssue({ title: '', description: '', property_id: '', priority: 'medium', status: 'open' });
      }
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (issue, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'closed') {
        const user = await base44.auth.me();
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user.email;
      }
      await base44.entities.Issue.update(issue.id, updates);
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const handleAssigneeChange = async (issue, newAssignee) => {
    try {
      const assignedMember = staff.find(s => s.user_email === newAssignee);
      await base44.entities.Issue.update(issue.id, { 
        assigned_to: newAssignee,
        assigned_to_name: assignedMember?.user_name || newAssignee
      });
    } catch (error) {
      console.error('Error reassigning issue:', error);
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || property?.address || 'Unknown';
  };

  const filteredIssues = issues.filter(issue => 
    issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedIssues = {
    open: filteredIssues.filter(i => i.status === 'open'),
    in_progress: filteredIssues.filter(i => i.status === 'in_progress'),
    closed: filteredIssues.filter(i => i.status === 'closed')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Issues"
        subtitle="Track and manage property issues"
        action={() => setShowNewDialog(true)}
        actionLabel="New Issue"
      />

      <div className="mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No issues yet"
          description="Create your first issue to start tracking property problems."
          action={() => setShowNewDialog(true)}
          actionLabel="New Issue"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const StatusIcon = config.icon;
            const statusIssues = groupedIssues[status];
            
            return (
              <div key={status} className="space-y-4">
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${config.bg}`}>
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  <span className="font-semibold">{config.label}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {statusIssues.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {statusIssues.map(issue => (
                    <Card key={issue.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{issue.title}</h3>
                            {issue.property_id && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Building2 className="h-3 w-3" />
                                {getPropertyName(issue.property_id)}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              <span className="text-slate-400">Owner:</span> {issue.assigned_to_name || staff.find(s => s.user_email === issue.assigned_to)?.user_name || issue.assigned_to_name || staff.find(s => s.user_email === issue.created_by)?.user_name || issue.created_by || 'Unassigned'}
                            </p>
                            {issue.description && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                {issue.description}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={issue.priority} />
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Select
                            value={issue.status}
                            onValueChange={(value) => handleStatusChange(issue, value)}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={issue.assigned_to || ''}
                            onValueChange={(value) => handleAssigneeChange(issue, value)}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map(member => (
                                <SelectItem key={member.id} value={member.user_email}>
                                  {member.user_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {statusIssues.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No {config.label.toLowerCase()} issues
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Issue</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newIssue.title}
                onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Issue title"
              />
            </div>
            <div>
              <Label>Property</Label>
              <Select
                value={newIssue.property_id}
                onValueChange={(value) => setNewIssue(prev => ({ ...prev, property_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name || property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={newIssue.priority}
                onValueChange={(value) => setNewIssue(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
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
              <Label>Description</Label>
              <Textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateIssue}
              disabled={!newIssue.title || saving}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {saving ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}