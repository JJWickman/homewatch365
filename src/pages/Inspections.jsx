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
import { Textarea } from "@/components/ui/textarea";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import DataTable from '@/components/shared/DataTable';

export default function Inspections() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visitTypeFilter, setVisitTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // New visit dialog (inspection or follow-up)
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [visitType, setVisitType] = useState('inspection'); // 'inspection' or 'followup'
  const [editingId, setEditingId] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('manual'); // 'manual' or 'search'
  const [searchResults, setSearchResults] = useState([]);
  const [newVisit, setNewVisit] = useState({
    property_id: '',
    template_id: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '',
    type: 'routine',
    assigned_to: '',
    is_recurring: false,
    recurrence_frequency: 'weekly',
    recurrence_end_date: '',
    custom_name: '',
    inspection_details: '',
    followup_type: 'issue',
    followup_category: 'general',
    followup_priority: 'medium',
    followup_title: '',
    followup_description: '',
    followup_due_date: format(new Date(), 'yyyy-MM-dd'),
    followup_due_time: ''
    });
  const [creating, setCreating] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [scheduledInspectionToReplace, setScheduledInspectionToReplace] = useState(null);
  const [followUpsData, setFollowUpsData] = useState([]);

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
        
        const [visitsData, propertiesData, clientsData, templatesData, staffData] = await Promise.all([
          base44.entities.Visit.filter({ company_id: cId }, '-scheduled_date'),
          base44.entities.Property.filter({ company_id: cId, is_active: true }),
          base44.entities.Client.filter({ company_id: cId }),
          base44.entities.InspectionTemplate.filter({ company_id: cId, is_active: true }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true })
        ]);
        
        setVisits(visitsData);
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
  
  const getVisitDetails = (visit) => {
    const details = [];
    
    if (visit.visit_type === 'inspection') {
      if (visit.overall_status === 'issues_found' || visit.overall_status === 'urgent') {
        details.push('Issues found');
      }
    } else if (visit.visit_type === 'followup') {
      details.push(visit.priority || 'medium');
    }
    
    return details.length > 0 ? details.join(', ') : '—';
  };

  const getDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const filteredVisits = visits.filter(visit => {
    const property = getProperty(visit.property_id);
    const matchesSearch = 
      property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    const matchesVisitType = visitTypeFilter === 'all' || visit.visit_type === visitTypeFilter;
    const matchesAssigned = assignedFilter === 'all' || visit.assigned_to === assignedFilter;
    const matchesProperty = propertyFilter === 'all' || visit.property_id === propertyFilter;
    
    return matchesSearch && matchesStatus && matchesVisitType && matchesAssigned && matchesProperty;
  });

  const checkForScheduledInspection = () => {
    if (newVisit.inspection_type !== 'drop_in') return false;
    
    const selectedDate = parseISO(newVisit.scheduled_date);
    const weekStart = addDays(selectedDate, -selectedDate.getDay());
    const weekEnd = addDays(weekStart, 6);
    
    const scheduledInSameWeek = visits.find(v => 
      v.property_id === newVisit.property_id &&
      v.visit_type === 'inspection' &&
      v.status === 'scheduled' &&
      v.inspection_type === 'routine'
    );
    
    if (scheduledInSameWeek) {
      const visitDate = parseISO(scheduledInSameWeek.scheduled_date);
      if (visitDate >= weekStart && visitDate <= weekEnd) {
        setScheduledInspectionToReplace(scheduledInSameWeek);
        setShowReplaceDialog(true);
        return true;
      }
    }
    
    return false;
  };

  const handleCreateVisit = async () => {
    if (!companyId || !newVisit.property_id) return;
    
    setCreating(true);

    try {
      const property = getProperty(newVisit.property_id);
      const staffMember = staff.find(s => s.user_email === newVisit.assigned_to);

      if (visitType === 'inspection') {
        if (!editingId && checkForScheduledInspection()) {
          return;
        }

        const isFlexibleType = ['other', 'custom_client_request', 'drop_in'].includes(newVisit.inspection_type);
        
        const visitData = {
          company_id: companyId,
          property_id: newVisit.property_id,
          client_id: property?.client_id,
          visit_type: 'inspection',
          inspection_type: newVisit.inspection_type,
          template_id: !isFlexibleType ? (newVisit.template_id || null) : null,
          scheduled_date: newVisit.scheduled_date,
          scheduled_time: newVisit.scheduled_time || null,
          assigned_to: newVisit.assigned_to || null,
          assigned_to_name: staffMember?.user_name || null,
          status: isFlexibleType ? 'completed' : 'scheduled',
          completed_at: isFlexibleType ? new Date().toISOString() : null,
          ...(isFlexibleType && { summary_notes: newVisit.inspection_details || '' }),
          ...(newVisit.custom_name && { custom_inspection_name: newVisit.custom_name })
        };

        if (editingId) {
          await base44.entities.Visit.update(editingId, visitData);
        } else {
          const dates = [newVisit.scheduled_date];
          
          if (newVisit.is_recurring && newVisit.recurrence_end_date) {
            let currentDate = parseISO(newVisit.scheduled_date);
            const endDate = parseISO(newVisit.recurrence_end_date);
            
            while (currentDate < endDate) {
              if (newVisit.recurrence_frequency === 'daily') {
                currentDate = addDays(currentDate, 1);
              } else if (newVisit.recurrence_frequency === 'weekly') {
                currentDate = addWeeks(currentDate, 1);
              } else if (newVisit.recurrence_frequency === 'bi_weekly') {
                currentDate = addWeeks(currentDate, 2);
              } else if (newVisit.recurrence_frequency === 'monthly') {
                currentDate = addMonths(currentDate, 1);
              }
              
              if (currentDate <= endDate) {
                dates.push(format(currentDate, 'yyyy-MM-dd'));
              }
            }
          }

          const visitsToCreate = dates.map(date => ({
            ...visitData,
            scheduled_date: date
          }));

          await base44.entities.Visit.bulkCreate(visitsToCreate);
        }
      } else {
        const visitData = {
          company_id: companyId,
          property_id: newVisit.property_id,
          client_id: property?.client_id,
          visit_type: 'followup',
          title: newVisit.followup_title,
          description: newVisit.followup_description,
          followup_type: newVisit.followup_type,
          priority: newVisit.followup_priority,
          followup_category: newVisit.followup_category,
          status: 'open',
          scheduled_date: newVisit.followup_due_date,
          scheduled_time: newVisit.followup_due_time || null,
          assigned_to: newVisit.assigned_to || null,
          assigned_to_name: staffMember?.user_name || null
        };

        if (editingId) {
          await base44.entities.Visit.update(editingId, visitData);
        } else {
          await base44.entities.Visit.create(visitData);
        }
      }
    } catch (error) {
      console.error('Error creating visit:', error);
    } finally {
      setShowNewDialog(false);
      setEditingId(null);
      setVisitType('inspection');
      setNewVisit({
        property_id: '',
        template_id: '',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '',
        inspection_type: 'routine',
        assigned_to: '',
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_end_date: '',
        custom_name: '',
        inspection_details: '',
        followup_type: 'issue',
        followup_category: 'general',
        followup_priority: 'medium',
        followup_title: '',
        followup_description: '',
        followup_due_date: format(new Date(), 'yyyy-MM-dd'),
        followup_due_time: ''
      });
      setCreating(false);
      loadData();
    }
  };

  const handleEditInspection = (inspection) => {
    setEditingInspectionId(inspection.id);
    setNewInspection({
      property_id: inspection.property_id,
      template_id: inspection.template_id || '',
      scheduled_date: inspection.scheduled_date,
      scheduled_time: inspection.scheduled_time || '',
      type: inspection.type,
      assigned_to: inspection.assigned_to || '',
      is_recurring: false,
      recurrence_frequency: 'weekly',
      recurrence_end_date: '',
      custom_name: inspection.custom_inspection_name || '',
      inspection_details: inspection.summary_notes || ''
    });
    setShowNewDialog(true);
  };

  const handleReplaceScheduled = async (replace) => {
    setCreating(true);
    
    const property = getProperty(newInspection.property_id);
    const staffMember = staff.find(s => s.user_email === newInspection.assigned_to);
    
    const isFlexibleType = ['other', 'custom_client_request', 'drop_in'].includes(newInspection.type);
    
    const inspectionData = {
      company_id: companyId,
      property_id: newInspection.property_id,
      client_id: property?.client_id,
      template_id: !isFlexibleType ? (newInspection.template_id || null) : null,
      scheduled_date: newInspection.scheduled_date,
      scheduled_time: newInspection.scheduled_time || null,
      type: newInspection.type,
      assigned_to: newInspection.assigned_to || null,
      assigned_to_name: staffMember?.user_name || null,
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...(isFlexibleType && { summary_notes: newInspection.inspection_details || '' }),
      ...(newInspection.custom_name && { custom_inspection_name: newInspection.custom_name })
    };
    
    if (replace && scheduledInspectionToReplace) {
      await base44.entities.Inspection.update(scheduledInspectionToReplace.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        related_drop_in_id: undefined
      });
    }
    
    await base44.entities.Inspection.create(inspectionData);
    
    setShowReplaceDialog(false);
    setScheduledInspectionToReplace(null);
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
      recurrence_end_date: '',
      custom_name: '',
      inspection_details: ''
    });
    setCreating(false);
    loadData();
  };

  const columns = [
    {
      header: 'Property',
      cell: (visit) => {
        const property = getProperty(visit.property_id);
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
      cell: (visit) => (
        <div>
          <p className="font-medium">{getDateLabel(visit.scheduled_date)}</p>
          {visit.scheduled_time && (
            <p className="text-sm text-slate-500">{visit.scheduled_time}</p>
          )}
        </div>
      ),
      className: 'hidden sm:table-cell'
    },
    {
      header: 'Visit Type',
      cell: (visit) => (
        <StatusBadge status={visit.visit_type} />
      ),
      className: 'hidden md:table-cell'
    },
    {
      header: 'Assigned',
      cell: (visit) => (
        <span className="text-slate-600">{visit.assigned_to_name || '—'}</span>
      ),
      className: 'hidden lg:table-cell'
    },
    {
      header: 'Status',
      cell: (visit) => (
        <StatusBadge status={visit.status} />
      )
    },
    {
      header: 'Details',
      cell: (visit) => (
        <span className="text-sm text-slate-600">{getVisitDetails(visit)}</span>
      ),
      className: 'hidden sm:table-cell'
    },
    {
      header: '',
      cell: (visit) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              navigate(createPageUrl('InspectionDetail') + `?id=${visit.id}`);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {visit.visit_type === 'inspection' && visit.status === 'scheduled' && (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('InspectionFlow') + `?id=${visit.id}`);
                }}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Inspection
                </DropdownMenuItem>
              </>
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
         title="Visits"
         subtitle={`${visits.length} total visits`}
         action={() => {
           setVisitType('inspection');
           setShowNewDialog(true);
         }}
         actionLabel="Schedule a Visit"
         actionClassName="bg-black text-white hover:bg-slate-900"
       />

      {/* Search */}
       <Card className="mb-6 p-4">
         <div className="relative mb-4">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input
             placeholder="Search inspections by property name or address..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 h-10 text-base"
           />
         </div>

         {/* Filters */}
         <div className="flex flex-col sm:flex-row gap-4">
           <Select value={propertyFilter} onValueChange={setPropertyFilter}>
             <SelectTrigger className="w-full sm:w-36">
               <SelectValue placeholder="Property" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Properties</SelectItem>
               {properties.map((property) => (
                 <SelectItem key={property.id} value={property.id}>
                   {property.name || property.address}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
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
           <Select value={visitTypeFilter} onValueChange={setVisitTypeFilter}>
             <SelectTrigger className="w-full sm:w-36">
               <SelectValue placeholder="Visit Type" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Types</SelectItem>
               <SelectItem value="inspection">Inspection</SelectItem>
               <SelectItem value="followup">Follow-Up</SelectItem>
             </SelectContent>
           </Select>
           <Select value={assignedFilter} onValueChange={setAssignedFilter}>
             <SelectTrigger className="w-full sm:w-36">
               <SelectValue placeholder="Assigned" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Staff</SelectItem>
               {staff.map((member) => (
                 <SelectItem key={member.id} value={member.user_email}>
                   {member.user_name || member.user_email}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </Card>

      {/* Table / Empty State */}
      {visits.length === 0 && !loading ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="No visits yet"
            description="Schedule your first visit to start monitoring properties."
            action={() => {
              setVisitType('inspection');
              setShowNewDialog(true);
            }}
            actionLabel="Schedule a Visit"
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredVisits}
          loading={loading}
          onRowClick={(visit) => navigate(createPageUrl('InspectionDetail') + `?id=${visit.id}`)}
          emptyMessage="No visits match your filters"
        />
      )}

      {/* New Visit Dialog (Inspection or Follow-up) */}
       <Dialog open={showNewDialog} onOpenChange={(open) => {
         setShowNewDialog(open);
         if (!open) {
           setEditingId(null);
           setVisitType('inspection');
           setNewVisit({
             property_id: '',
             template_id: '',
             scheduled_date: format(new Date(), 'yyyy-MM-dd'),
             scheduled_time: '',
             type: 'routine',
             assigned_to: '',
             is_recurring: false,
             recurrence_frequency: 'weekly',
             recurrence_end_date: '',
             custom_name: '',
             inspection_details: '',
             followup_type: 'issue',
             followup_category: 'general',
             followup_priority: 'medium',
             followup_title: '',
             followup_description: '',
             followup_due_date: format(new Date(), 'yyyy-MM-dd'),
             followup_due_time: ''
           });
         }
       }}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>{editingId ? 'Edit Visit' : 'Schedule a Visit'}</DialogTitle>
             <DialogDescription>
               {editingId ? 'Update visit details' : 'Create a new inspection or follow-up'}
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-4 py-4">
             {/* Visit Type Selector */}
             <div>
               <Label>Visit Type *</Label>
               <Select value={visitType} onValueChange={setVisitType}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="inspection">Inspection</SelectItem>
                   <SelectItem value="followup">Follow-Up</SelectItem>
                 </SelectContent>
               </Select>
             </div>
            <div>
              <Label>Property *</Label>
              <Select
                value={newVisit.property_id}
                onValueChange={(value) => setNewVisit(prev => ({ ...prev, property_id: value }))}
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

            {visitType === 'inspection' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newVisit.scheduled_date}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Time Block</Label>
                  <Select
                    value={newVisit.scheduled_time}
                    onValueChange={(value) => setNewVisit(prev => ({ ...prev, scheduled_time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={newVisit.followup_due_date}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, followup_due_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Time Block</Label>
                  <Select
                    value={newVisit.followup_due_time}
                    onValueChange={(value) => setNewVisit(prev => ({ ...prev, followup_due_time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {visitType === 'inspection' ? (
               <>
                 <div>
                   <Label>Inspection Type</Label>
                   <Select
                     value={newVisit.inspection_type}
                     onValueChange={(value) => setNewVisit(prev => ({ ...prev, inspection_type: value, template_id: !['other', 'custom_client_request', 'drop_in'].includes(value) ? prev.template_id : '' }))}
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

                 {newVisit.inspection_type === 'other' && (
                   <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <div>
                       <Label>Inspection Name</Label>
                       <Input
                         placeholder="e.g., Annual Maintenance Check"
                         value={newVisit.custom_name}
                         onChange={(e) => setNewVisit(prev => ({ ...prev, custom_name: e.target.value }))}
                       />
                     </div>
                     <div>
                       <Label>What was inspected?</Label>
                       <Textarea
                         placeholder="Describe what was inspected..."
                         value={newVisit.inspection_details}
                         onChange={(e) => setNewVisit(prev => ({ ...prev, inspection_details: e.target.value }))}
                         rows={2}
                       />
                     </div>
                     <p className="text-xs text-blue-700">Photos can be added after creation</p>
                   </div>
                 )}

                 {newVisit.inspection_type === 'custom_client_request' && (
                   <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                     <div>
                       <Label>What was requested to inspect?</Label>
                       <Textarea
                         placeholder="Describe what the client requested..."
                         value={newVisit.inspection_details}
                         onChange={(e) => setNewVisit(prev => ({ ...prev, inspection_details: e.target.value }))}
                         rows={2}
                       />
                     </div>
                     <p className="text-xs text-purple-700">Photos can be added after creation</p>
                   </div>
                 )}

                 {newVisit.inspection_type === 'drop_in' && (
                   <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                     <div>
                       <Label>Inspection Name</Label>
                       <Input
                         placeholder="e.g., Quick Property Check"
                         value={newVisit.custom_name}
                         onChange={(e) => setNewVisit(prev => ({ ...prev, custom_name: e.target.value }))}
                       />
                     </div>
                     <p className="text-xs text-green-700">
                       <strong>Drop-In:</strong> Unscheduled inspection during convenience visit. If a scheduled inspection exists for this week, you'll be offered to use this instead.
                     </p>
                   </div>
                 )}
               </>
             ) : (
               <div className="space-y-4">
                 <div>
                   <Label>Title *</Label>
                   <Input
                     placeholder="e.g., Fix roof leak"
                     value={newVisit.followup_title}
                     onChange={(e) => setNewVisit(prev => ({ ...prev, followup_title: e.target.value }))}
                   />
                 </div>
                 <div>
                   <Label>Priority</Label>
                   <Select
                     value={newVisit.followup_priority}
                     onValueChange={(value) => setNewVisit(prev => ({ ...prev, followup_priority: value }))}
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
                     placeholder="Describe the follow-up details..."
                     value={newVisit.followup_description}
                     onChange={(e) => setNewVisit(prev => ({ ...prev, followup_description: e.target.value }))}
                     rows={2}
                   />
                 </div>
               </div>
             )}

                  <div>
                    <Label>Assign To</Label>
                    <Select
                      value={newVisit.assigned_to}
                      onValueChange={(value) => setNewVisit(prev => ({ ...prev, assigned_to: value }))}
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

                  {visitType === 'inspection' && templates.length > 0 && !['other', 'custom_client_request', 'drop_in'].includes(newVisit.inspection_type) && (
                    <div>
                      <Label>Template</Label>
                      <Select
                        value={newVisit.template_id}
                        onValueChange={(value) => setNewVisit(prev => ({ ...prev, template_id: value }))}
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

                  {visitType === 'inspection' && !['other', 'custom_client_request', 'drop_in'].includes(newVisit.inspection_type) && (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <Label>Recurring Inspection</Label>
                        <p className="text-sm text-slate-500">Schedule multiple inspections</p>
                      </div>
                      <Switch
                        checked={newVisit.is_recurring}
                        onCheckedChange={(checked) => setNewVisit(prev => ({ ...prev, is_recurring: checked }))}
                      />
                    </div>
                  )}

                  {visitType === 'inspection' && newVisit.is_recurring && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={newVisit.recurrence_frequency}
                          onValueChange={(value) => setNewVisit(prev => ({ ...prev, recurrence_frequency: value }))}
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
                          value={newVisit.recurrence_end_date}
                          min={newVisit.scheduled_date}
                          onChange={(e) => setNewVisit(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
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
              onClick={handleCreateVisit}
              disabled={
                !newVisit.property_id ||
                (visitType === 'inspection' && !newVisit.scheduled_date) ||
                (visitType === 'followup' && !newVisit.followup_due_date) ||
                (visitType === 'followup' && !newVisit.followup_title) ||
                creating ||
                (visitType === 'inspection' && newVisit.is_recurring && !newVisit.recurrence_end_date) ||
                (visitType === 'inspection' && ['other', 'custom_client_request'].includes(newVisit.inspection_type) && !newVisit.inspection_details)
              }
              className="bg-slate-900 hover:bg-slate-800"
            >
              {creating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Scheduled Inspection Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Use Drop-In to Fulfill Scheduled Inspection?</DialogTitle>
            <DialogDescription>
              There is a scheduled {scheduledInspectionToReplace?.type === 'routine' ? 'Routine' : scheduledInspectionToReplace?.type} inspection for this property on{' '}
              {scheduledInspectionToReplace && format(parseISO(scheduledInspectionToReplace.scheduled_date), 'MMM d, yyyy')}.
              You can mark that scheduled inspection as complete and link this drop-in visit instead.
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
              Use Drop-In & Mark Scheduled Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}