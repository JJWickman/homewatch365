import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, isToday, isTomorrow, isPast, addDays, addWeeks, addMonths } from 'date-fns';
import { 
  ClipboardCheck, Search, Plus, Building2, Calendar,
  Filter, Eye, Play, MoreVertical, User, MapPin, Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import DataTable from '@/components/shared/DataTable';

export default function Inspections() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // New inspection dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newInspection, setNewInspection] = useState({
    property_id: '',
    template_id: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '',
    type: 'routine',
    assigned_to: '',
    is_recurring: false,
    recurrence_frequency: 'weekly',
    recurrence_end_date: ''
  });
  const [creating, setCreating] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [scheduledInspectionToReplace, setScheduledInspectionToReplace] = useState(null);

  useEffect(() => {
    loadData();
    
    // Check for action parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      const propertyId = params.get('property_id');
      if (propertyId) {
        setNewInspection(prev => ({ ...prev, property_id: propertyId }));
      }
      setShowNewDialog(true);
    }
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [inspectionsData, propertiesData, clientsData, templatesData, staffData] = await Promise.all([
          base44.entities.Inspection.filter({ company_id: cId }, '-scheduled_date'),
          base44.entities.Property.filter({ company_id: cId, is_active: true }),
          base44.entities.Client.filter({ company_id: cId }),
          base44.entities.InspectionTemplate.filter({ company_id: cId, is_active: true }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true })
        ]);
        
        setInspections(inspectionsData);
        setProperties(propertiesData);
        setClients(clientsData);
        setTemplates(templatesData);
        setStaff(staffData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);
  const getClient = (clientId) => clients.find(c => c.id === clientId);

  const getDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const filteredInspections = inspections.filter(inspection => {
    const property = getProperty(inspection.property_id);
    const matchesSearch = 
      property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    const matchesType = typeFilter === 'all' || inspection.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const checkForScheduledInspection = () => {
    if (newInspection.type !== 'stop_by') return false;
    
    const selectedDate = parseISO(newInspection.scheduled_date);
    const weekStart = addDays(selectedDate, -selectedDate.getDay());
    const weekEnd = addDays(weekStart, 6);
    
    const scheduledInSameWeek = inspections.find(insp => 
      insp.property_id === newInspection.property_id &&
      insp.status === 'scheduled' &&
      insp.type !== 'stop_by'
    );
    
    if (scheduledInSameWeek) {
      const inspDate = parseISO(scheduledInSameWeek.scheduled_date);
      if (inspDate >= weekStart && inspDate <= weekEnd) {
        setScheduledInspectionToReplace(scheduledInSameWeek);
        setShowReplaceDialog(true);
        return true;
      }
    }
    
    return false;
  };

  const handleCreateInspection = async () => {
    if (!companyId || !newInspection.property_id) return;
    
    // Check for scheduled inspection in same week for stop-by
    if (checkForScheduledInspection()) {
      return;
    }
    
    setCreating(true);

    const property = getProperty(newInspection.property_id);
    const staffMember = staff.find(s => s.user_email === newInspection.assigned_to);

    const baseData = {
      company_id: companyId,
      property_id: newInspection.property_id,
      client_id: property?.client_id,
      template_id: newInspection.template_id || null,
      scheduled_time: newInspection.scheduled_time || null,
      type: newInspection.type,
      assigned_to: newInspection.assigned_to || null,
      assigned_to_name: staffMember?.user_name || null,
      status: newInspection.type === 'stop_by' ? 'completed' : 'scheduled',
      completed_at: newInspection.type === 'stop_by' ? new Date().toISOString() : null
    };

    // Generate inspection dates
    const dates = [newInspection.scheduled_date];
    
    if (newInspection.is_recurring && newInspection.recurrence_end_date) {
      let currentDate = parseISO(newInspection.scheduled_date);
      const endDate = parseISO(newInspection.recurrence_end_date);
      
      while (currentDate < endDate) {
        if (newInspection.recurrence_frequency === 'daily') {
          currentDate = addDays(currentDate, 1);
        } else if (newInspection.recurrence_frequency === 'weekly') {
          currentDate = addWeeks(currentDate, 1);
        } else if (newInspection.recurrence_frequency === 'bi_weekly') {
          currentDate = addWeeks(currentDate, 2);
        } else if (newInspection.recurrence_frequency === 'monthly') {
          currentDate = addMonths(currentDate, 1);
        }
        
        if (currentDate <= endDate) {
          dates.push(format(currentDate, 'yyyy-MM-dd'));
        }
      }
    }

    // Create all inspections
    const inspectionsToCreate = dates.map(date => ({
      ...baseData,
      scheduled_date: date
    }));

    await base44.entities.Inspection.bulkCreate(inspectionsToCreate);
    
    setShowNewDialog(false);
    setNewInspection({
      property_id: '',
      template_id: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '',
      type: 'routine',
      assigned_to: '',
      is_recurring: false,
      recurrence_frequency: 'weekly',
      recurrence_end_date: ''
    });
    setCreating(false);
    loadData();
  };

  const handleReplaceScheduled = async (replace) => {
    setCreating(true);
    
    if (replace && scheduledInspectionToReplace) {
      await base44.entities.Inspection.update(scheduledInspectionToReplace.id, {
        status: 'cancelled'
      });
    }
    
    setShowReplaceDialog(false);
    setScheduledInspectionToReplace(null);
    
    const property = getProperty(newInspection.property_id);
    const staffMember = staff.find(s => s.user_email === newInspection.assigned_to);
    
    await base44.entities.Inspection.create({
      company_id: companyId,
      property_id: newInspection.property_id,
      client_id: property?.client_id,
      template_id: newInspection.template_id || null,
      scheduled_date: newInspection.scheduled_date,
      scheduled_time: newInspection.scheduled_time || null,
      type: newInspection.type,
      assigned_to: newInspection.assigned_to || null,
      assigned_to_name: staffMember?.user_name || null,
      status: 'completed',
      completed_at: new Date().toISOString()
    });
    
    setShowNewDialog(false);
    setNewInspection({
      property_id: '',
      template_id: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '',
      type: 'routine',
      assigned_to: '',
      is_recurring: false,
      recurrence_frequency: 'weekly',
      recurrence_end_date: ''
    });
    setCreating(false);
    loadData();
  };

  const columns = [
    {
      header: 'Property',
      cell: (inspection) => {
        const property = getProperty(inspection.property_id);
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              {property?.primary_photo_url ? (
                <img src={property.primary_photo_url} alt="" className="h-full w-full object-cover rounded-lg" />
              ) : (
                <Building2 className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">
                {property?.name || property?.address}
              </p>
              <p className="text-sm text-slate-500 truncate">
                {property?.city}, {property?.state}
              </p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Date',
      cell: (inspection) => (
        <div>
          <p className="font-medium">{getDateLabel(inspection.scheduled_date)}</p>
          {inspection.scheduled_time && (
            <p className="text-sm text-slate-500">{inspection.scheduled_time}</p>
          )}
        </div>
      ),
      className: 'hidden sm:table-cell'
    },
    {
      header: 'Type',
      cell: (inspection) => (
        <StatusBadge status={inspection.type} />
      ),
      className: 'hidden md:table-cell'
    },
    {
      header: 'Assigned',
      cell: (inspection) => (
        <span className="text-slate-600">{inspection.assigned_to_name || '—'}</span>
      ),
      className: 'hidden lg:table-cell'
    },
    {
      header: 'Status',
      cell: (inspection) => (
        <StatusBadge status={inspection.status} />
      )
    },
    {
      header: '',
      cell: (inspection) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(createPageUrl('InspectionDetail') + `?id=${inspection.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {inspection.status === 'scheduled' && (
              <DropdownMenuItem onClick={() => navigate(createPageUrl('InspectionFlow') + `?id=${inspection.id}`)}>
                <Play className="h-4 w-4 mr-2" />
                Start Inspection
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Inspections"
        subtitle={`${inspections.length} total inspections`}
        action={() => setShowNewDialog(true)}
        actionLabel="Schedule Inspection"
      />

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by property..."
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
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="arrival">Arrival</SelectItem>
              <SelectItem value="departure">Departure</SelectItem>
              <SelectItem value="pre_storm">Pre-Storm</SelectItem>
              <SelectItem value="post_storm">Post-Storm</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="stop_by">Stop By</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table / Empty State */}
      {inspections.length === 0 && !loading ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="No inspections yet"
            description="Schedule your first inspection to start monitoring properties."
            action={() => setShowNewDialog(true)}
            actionLabel="Schedule Inspection"
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInspections}
          loading={loading}
          onRowClick={(inspection) => navigate(createPageUrl('InspectionDetail') + `?id=${inspection.id}`)}
          emptyMessage="No inspections match your filters"
        />
      )}

      {/* New Inspection Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
            <DialogDescription>
              Create a new inspection for a property
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Property *</Label>
              <Select
                value={newInspection.property_id}
                onValueChange={(value) => setNewInspection(prev => ({ ...prev, property_id: value }))}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newInspection.scheduled_date}
                  onChange={(e) => setNewInspection(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newInspection.scheduled_time}
                  onChange={(e) => setNewInspection(prev => ({ ...prev, scheduled_time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={newInspection.type}
                onValueChange={(value) => setNewInspection(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="arrival">Arrival</SelectItem>
                  <SelectItem value="departure">Departure</SelectItem>
                  <SelectItem value="pre_storm">Pre-Storm</SelectItem>
                  <SelectItem value="post_storm">Post-Storm</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="stop_by">Stop By</SelectItem>
                  </SelectContent>
                  </Select>
                  </div>

                  {newInspection.type === 'stop_by' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                  <strong>Stop By:</strong> Recording an unscheduled inspection that already happened. This will be marked as completed.
                  </p>
                  </div>
                  )}

                  <div>
                  <Label>Assign To</Label>
              <Select
                value={newInspection.assigned_to}
                onValueChange={(value) => setNewInspection(prev => ({ ...prev, assigned_to: value }))}
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

            {templates.length > 0 && (
              <div>
                <Label>Template</Label>
                <Select
                  value={newInspection.template_id}
                  onValueChange={(value) => setNewInspection(prev => ({ ...prev, template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newInspection.type !== 'stop_by' && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Recurring Inspection</Label>
                  <p className="text-sm text-slate-500">Schedule multiple inspections</p>
                </div>
                <Switch
                  checked={newInspection.is_recurring}
                  onCheckedChange={(checked) => setNewInspection(prev => ({ ...prev, is_recurring: checked }))}
                />
              </div>
            )}

            {newInspection.is_recurring && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={newInspection.recurrence_frequency}
                    onValueChange={(value) => setNewInspection(prev => ({ ...prev, recurrence_frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newInspection.recurrence_end_date}
                    min={newInspection.scheduled_date}
                    onChange={(e) => setNewInspection(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInspection}
              disabled={!newInspection.property_id || !newInspection.scheduled_date || creating || (newInspection.is_recurring && !newInspection.recurrence_end_date)}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {creating ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Scheduled Inspection Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scheduled Inspection Found</DialogTitle>
            <DialogDescription>
              There is already a scheduled inspection for this property this week on{' '}
              {scheduledInspectionToReplace && format(parseISO(scheduledInspectionToReplace.scheduled_date), 'MMM d, yyyy')}.
              Would you like to cancel the scheduled inspection and record this stop-by instead?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleReplaceScheduled(false)}
              disabled={creating}
            >
              Keep Both
            </Button>
            <Button 
              onClick={() => handleReplaceScheduled(true)}
              disabled={creating}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Replace Scheduled
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}