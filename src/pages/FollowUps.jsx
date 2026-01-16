import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { 
  FileText, Search, Plus, Building2, Calendar,
  MoreVertical, CheckCircle2, Clock, AlertTriangle, AlertCircle,
  User, Filter, Wrench, Briefcase
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';

const typeConfig = {
  issue: { label: 'Issue', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  contractor_appointment: { label: 'Contractor Appt', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100' },
  repair: { label: 'Repair', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100' },
  inspection_followup: { label: 'Inspection Follow-up', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  arrival_prep: { label: 'Arrival Prep', icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' },
  departure: { label: 'Departure', icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-100' },
  storm_prep: { label: 'Storm Prep', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  client_request: { label: 'Client Request', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  other: { label: 'Other', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' }
};

export default function FollowUps() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    property_id: '',
    contractor_id: '',
    priority: 'medium',
    type: 'issue',
    follow_up_category: 'general',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    assigned_to: ''
  });
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showContractorDialog, setShowContractorDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.FollowUp.subscribe((event) => {
      if (event.type === 'create') {
        setFollowUps(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setFollowUps(prev => prev.map(i => i.id === event.id ? event.data : i));
      } else if (event.type === 'delete') {
        setFollowUps(prev => prev.filter(i => i.id !== event.id));
      }
    });
    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [followUpsData, propertiesData, clientsData, staffData, contractorsData] = await Promise.all([
          base44.entities.FollowUp.filter({ company_id: cId }, '-created_date'),
          base44.entities.Property.filter({ company_id: cId, is_active: true }),
          base44.entities.Client.filter({ company_id: cId }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true }),
          base44.entities.Contractor.filter({ company_id: cId, is_active: true })
        ]);
        
        setFollowUps(followUpsData);
        setProperties(propertiesData);
        setClients(clientsData);
        setStaff(staffData);
        setContractors(contractorsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);
  const getContractor = (contractorId) => contractors.find(c => c.id === contractorId);

  const filteredFollowUps = followUps.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'issues' && item.type === 'issue') ||
                       (activeTab === 'appointments' && item.type === 'contractor_appointment') ||
                       (activeTab === 'tasks' && !['issue', 'contractor_appointment'].includes(item.type));
    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesTab;
  });

  const handleCategoryChange = (category) => {
    setNewItem(prev => ({ ...prev, follow_up_category: category }));
    
    if (category === 'general') {
      setNewItem(prev => ({ 
        ...prev, 
        assigned_to: currentUser?.email || '',
        follow_up_category: category
      }));
    } else if (category === 'urgent_issue') {
      setShowAssignmentDialog(true);
    } else if (category === 'contractor_needed') {
      setShowContractorDialog(true);
    }
  };

  const handleCreate = async () => {
    if (!companyId || !newItem.title) return;

    const property = getProperty(newItem.property_id);
    const staffMember = staff.find(s => s.user_email === newItem.assigned_to);

    const data = {
      company_id: companyId,
      property_id: newItem.property_id || null,
      client_id: property?.client_id || null,
      contractor_id: newItem.contractor_id || null,
      title: newItem.title,
      description: newItem.description,
      priority: newItem.priority,
      type: newItem.type,
      follow_up_category: newItem.follow_up_category,
      due_date: newItem.due_date || null,
      assigned_to: newItem.assigned_to || null,
      assigned_to_name: staffMember?.user_name || null,
      status: 'open'
    };

    await base44.entities.FollowUp.create(data);
    setShowNewDialog(false);
    setShowAssignmentDialog(false);
    setShowContractorDialog(false);
    setNewItem({
      title: '',
      description: '',
      property_id: '',
      contractor_id: '',
      priority: 'medium',
      type: 'issue',
      follow_up_category: 'general',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      assigned_to: ''
    });
  };

  const toggleComplete = async (item) => {
    const newStatus = item.status === 'completed' ? 'open' : 'completed';
    await base44.entities.FollowUp.update(item.id, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    });
  };

  const handleStatusChange = async (item, newStatus) => {
    await base44.entities.FollowUp.update(item.id, { status: newStatus });
  };

  const isOverdue = (item) => {
    if (!item.due_date || item.status === 'completed') return false;
    return isPast(parseISO(item.due_date)) && !isToday(parseISO(item.due_date));
  };

  const getDueDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isPast(date)) return 'Overdue';
    return format(date, 'MMM d');
  };

  const openCount = followUps.filter(f => f.status === 'open').length;
  const issueCount = followUps.filter(f => f.type === 'issue' && f.status !== 'completed').length;
  const appointmentCount = followUps.filter(f => f.type === 'contractor_appointment' && f.status !== 'completed').length;

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
        title="Follow-Ups"
        subtitle={`${openCount} open items`}
        action={() => setShowNewDialog(true)}
        actionLabel="New Follow-Up"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            Issues
            {issueCount > 0 && <Badge variant="secondary" className="ml-1">{issueCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            Appointments
            {appointmentCount > 0 && <Badge variant="secondary" className="ml-1">{appointmentCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="tasks">Other Follow-Ups</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search follow-ups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      {followUps.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No follow-ups yet"
            description="Create follow-ups to track issues, appointments, and tasks."
            action={() => setShowNewDialog(true)}
            actionLabel="New Follow-Up"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFollowUps.map((item) => {
            const property = getProperty(item.property_id);
            const contractor = getContractor(item.contractor_id);
            const overdue = isOverdue(item);
            const config = typeConfig[item.type] || typeConfig.other;
            const TypeIcon = config.icon;
            
            return (
              <Card 
                key={item.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  item.status === 'completed' ? 'opacity-60' : ''
                } ${overdue ? 'border-red-200' : ''}`}
                onClick={() => navigate(createPageUrl(`FollowUpDetail?id=${item.id}`))}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={item.status === 'completed'}
                      onCheckedChange={(e) => {
                        e.stopPropagation();
                        toggleComplete(item);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${config.bg} ${config.color} border-0`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            <h3 className={`font-medium ${item.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {item.title}
                            </h3>
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={item.priority} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(item, 'open'); }}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Mark Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(item, 'in_progress'); }}>
                                <Clock className="h-4 w-4 mr-2" />
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleComplete(item); }}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {item.status === 'completed' ? 'Mark Open' : 'Mark Complete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                        {property && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {property.name || property.address}
                          </div>
                        )}
                        {contractor && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {contractor.business_name}
                          </div>
                        )}
                        {item.due_date && (
                          <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                            {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                            <Calendar className="h-3.5 w-3.5" />
                            {getDueDateLabel(item.due_date)}
                          </div>
                        )}
                        {item.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {item.assigned_to_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Follow-Up Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Follow-Up</DialogTitle>
            <DialogDescription>
              Add a new issue, appointment, or task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Follow-Up Category *</Label>
              <Select
                value={newItem.follow_up_category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="urgent_issue">Urgent Issue</SelectItem>
                  <SelectItem value="contractor_needed">Contractor Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={newItem.type}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
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
              <Label>Title *</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What needs to be done?"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, priority: value }))}
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
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newItem.due_date}
                  onChange={(e) => setNewItem(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Property</Label>
              <Select
                value={newItem.property_id}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, property_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name || property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newItem.type === 'contractor_appointment' && (
              <div>
                <Label>Contractor</Label>
                <Select
                  value={newItem.contractor_id}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, contractor_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Assign To</Label>
              <Select
                value={newItem.assigned_to}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, assigned_to: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(m => m.role === 'field_inspector' || m.role === 'dispatcher' || m.role === 'administrator').map((member) => (
                    <SelectItem key={member.id} value={member.user_email}>
                      {member.user_name || member.user_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!newItem.title}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog for Urgent Issues */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Urgent Issue</DialogTitle>
            <DialogDescription>
              This is an urgent issue. Would you like to assign it to a manager or keep it for yourself?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Assign To</Label>
              <Select
                value={newItem.assigned_to}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, assigned_to: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentUser?.email || ''}>
                    Myself ({currentUser?.full_name})
                  </SelectItem>
                  {staff.filter(m => m.role === 'dispatcher' || m.role === 'administrator').map((member) => (
                    <SelectItem key={member.id} value={member.user_email}>
                      {member.user_name || member.user_email} ({m.role === 'dispatcher' ? 'Dispatcher/Manager' : 'Administrator'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignmentDialog(false);
              setNewItem(prev => ({ ...prev, follow_up_category: 'general' }));
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowAssignmentDialog(false)}
              disabled={!newItem.assigned_to}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contractor Dialog */}
      <Dialog open={showContractorDialog} onOpenChange={setShowContractorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contractor Needed</DialogTitle>
            <DialogDescription>
              {(() => {
                const prop = getProperty(newItem.property_id);
                const hasContractors = prop?.contractors && prop.contractors.length > 0;
                return hasContractors 
                  ? "Would you like to reach out to one of the assigned contractors?"
                  : "No contractors are assigned to this property. Search for a contractor.";
              })()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {(() => {
              const prop = getProperty(newItem.property_id);
              const hasContractors = prop?.contractors && prop.contractors.length > 0;
              
              if (hasContractors) {
                const propertyContractors = contractors.filter(c => prop.contractors.includes(c.id));
                return (
                  <div>
                    <Label>Select Contractor</Label>
                    <Select
                      value={newItem.contractor_id}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, contractor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyContractors.map((contractor) => (
                          <SelectItem key={contractor.id} value={contractor.id}>
                            {contractor.business_name} - {contractor.contractor_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              } else {
                return (
                  <div>
                    <Label>Search & Assign Contractor</Label>
                    <Select
                      value={newItem.contractor_id}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, contractor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search contractors" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractors.map((contractor) => (
                          <SelectItem key={contractor.id} value={contractor.id}>
                            {contractor.business_name} - {contractor.contractor_type?.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-2">
                      The contractor will be assigned to this follow-up only, not the property.
                    </p>
                  </div>
                );
              }
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowContractorDialog(false);
              setNewItem(prev => ({ ...prev, follow_up_category: 'general', contractor_id: '' }));
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowContractorDialog(false)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}