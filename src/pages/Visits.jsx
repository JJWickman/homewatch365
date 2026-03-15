import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, isToday, isTomorrow, isPast, addDays, addWeeks, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import { 
  ClipboardCheck, Search, Plus, Building2, Calendar,
  Filter, Eye, Play, MoreVertical, User, MapPin, Clock, Zap
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

export default function Visits() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('scheduled,open');
  const [visitTypeFilter, setVisitTypeFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);
  
  // New visit dialog (check-in or follow-up)
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [visitType, setVisitType] = useState('check-in'); // 'check-in' or 'followup'
  const [editingId, setEditingId] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('manual'); // 'manual' or 'search'
  const [searchResults, setSearchResults] = useState([]);
  const [newVisit, setNewVisit] = useState({
    property_id: '',
    template_id: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '',
    checkin_type: 'routine',
    assigned_to: '',
    is_recurring: false,
    recurrence_frequency: 'weekly',
    recurrence_end_date: '',
    custom_name: '',
    checkin_details: '',
    followup_type: 'issue',
    followup_category: 'general',
    followup_priority: 'medium',
    followup_title: '',
    followup_description: '',
    followup_due_date: format(new Date(), 'yyyy-MM-dd'),
    followup_due_time: '',
    estimated_hours: ''
    });
  const [creating, setCreating] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [scheduledVisitToReplace, setScheduledVisitToReplace] = useState(null);
  const [followUpsData, setFollowUpsData] = useState([]);
  const [showCheckInNow, setShowCheckInNow] = useState(false);
  const [checkInNowProperty, setCheckInNowProperty] = useState(null);
  const [checklists, setChecklists] = useState([]);

  useEffect(() => {
    loadData();
    
    // Check for action parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      const propertyId = params.get('property_id');
      if (propertyId) {
        setNewVisit(prev => ({ ...prev, property_id: propertyId }));
      }
      setShowNewDialog(true);
    }
    
    // Check for filter parameter
    if (params.get('filter') === 'week') {
      // Filter will be applied in filteredVisits
    }
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const member = members[0];
        setCurrentMember(member);
        const cId = member.company_id;
        setCompanyId(cId);
        
        // Set default filter based on role
        if (member.role === 'field_inspector') {
          setAssignedFilter('me');
        }
        
        const [visitsData, propertiesData, clientsData, templatesData, staffData, checklistsData] = await Promise.all([
          base44.entities.Visit.filter({ company_id: cId }, '-scheduled_date'),
          base44.entities.Property.filter({ company_id: cId, is_active: true }),
          base44.entities.Client.filter({ company_id: cId }),
          base44.entities.VisitTemplate.filter({ company_id: cId, is_active: true }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true }),
          base44.entities.PropertyChecklist.filter({ company_id: cId, is_active: true })
        ]);
        
        setVisits(visitsData);
        setProperties(propertiesData);
        setClients(clientsData);
        setTemplates(templatesData);
        setStaff(staffData);
        setChecklists(checklistsData);
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
    
    if (visit.visit_type === 'check-in') {
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

    const findAvailableSlots = async () => {
    const propertyId = newVisit.property_id;
    if (!propertyId) return;

    const selectedProperty = getProperty(propertyId);
    if (!selectedProperty?.address) {
      alert('Property address is required to find available slots');
      return;
    }

    const results = [];
    let currentDate = new Date();
    
    // Get all field staff members
    const availableStaff = staff.filter(m => 
      m.role === 'field_inspector' || m.role === 'dispatcher' || m.role === 'administrator'
    );

    // Search for available slots in the next 30 days
    for (let i = 0; i < 30; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay();

      // Skip Sundays
      if (dayOfWeek === 0) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Check each staff member for availability
      for (const staffMember of availableStaff) {
        // Get all visits for this staff member on this date
        const staffVisitsOnDate = visits.filter(v => 
          v.assigned_to === staffMember.user_email && 
          v.scheduled_date === dateStr &&
          v.status !== 'cancelled'
        );

        // Check morning availability (8am-12pm)
        const canDoMorning = await checkTimeSlotFeasibility(
          selectedProperty, 
          staffVisitsOnDate, 
          'morning',
          dateStr
        );

        // Check afternoon availability (12pm-4pm)
        const canDoAfternoon = await checkTimeSlotFeasibility(
          selectedProperty, 
          staffVisitsOnDate, 
          'afternoon',
          dateStr
        );

        if (canDoMorning) {
          results.push({ 
            date: dateStr, 
            time: 'morning', 
            staffEmail: staffMember.user_email,
            staffName: staffMember.user_name || staffMember.user_email,
            label: `${getDateLabel(dateStr)} - Morning (8am-12pm) - ${staffMember.user_name || staffMember.user_email}` 
          });
        }
        if (canDoAfternoon) {
          results.push({ 
            date: dateStr, 
            time: 'afternoon', 
            staffEmail: staffMember.user_email,
            staffName: staffMember.user_name || staffMember.user_email,
            label: `${getDateLabel(dateStr)} - Afternoon (12pm-4pm) - ${staffMember.user_name || staffMember.user_email}` 
          });
        }

        if (results.length >= 5) break;
      }

      if (results.length >= 5) break;
      currentDate = addDays(currentDate, 1);
    }

    setSearchResults(results);
    };

    const checkTimeSlotFeasibility = async (selectedProperty, staffVisitsOnDate, timeSlot, dateStr) => {
    if (staffVisitsOnDate.length === 0) return true;

    // Allow 1 hour buffer for travel and visit
    const TRAVEL_BUFFER_MINUTES = 60;

    for (const visit of staffVisitsOnDate) {
      const otherProperty = getProperty(visit.property_id);
      if (!otherProperty?.address) continue;

      try {
        const response = await base44.functions.invoke('calculateTravelTime', {
          fromAddress: otherProperty.address,
          toAddress: selectedProperty.address
        });

        const travelTimeMinutes = Math.ceil(response.data.duration / 60);
        const totalTimeNeeded = travelTimeMinutes + TRAVEL_BUFFER_MINUTES;

        // Check if time slot conflicts
        if (visit.scheduled_time === 'morning' && timeSlot === 'morning') {
          return false; // Same time block
        }
        if (visit.scheduled_time === 'afternoon' && timeSlot === 'afternoon') {
          return false; // Same time block
        }

        // Check if travel time is feasible between morning and afternoon
        if (visit.scheduled_time === 'morning' && timeSlot === 'afternoon') {
          // Morning ends at 12pm, afternoon starts at 12pm - need at least 4 hours buffer
          if (totalTimeNeeded > 240) return false;
        }
        if (visit.scheduled_time === 'afternoon' && timeSlot === 'morning') {
          // Not feasible - would need to complete morning before afternoon starts
          return false;
        }
      } catch (error) {
        console.error('Error calculating travel time:', error);
        // If we can't calculate, assume it's not feasible
        return false;
      }
    }

    return true;
    };

  const filteredVisits = visits.filter(visit => {
    const property = getProperty(visit.property_id);
    const matchesSearch = 
      property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || statusFilter.split(',').includes(visit.status);
    const matchesVisitType = visitTypeFilter === 'all' || visit.visit_type === visitTypeFilter;
    const matchesAssigned = assignedFilter === 'all' || (assignedFilter === 'me' ? visit.assigned_to === currentUser?.email : visit.assigned_to === assignedFilter);
    const matchesProperty = propertyFilter === 'all' || visit.property_id === propertyFilter;
    
    // Check for week filter from URL
    const params = new URLSearchParams(window.location.search);
    const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');
    const matchesWeek = params.get('filter') !== 'week' || (visit.scheduled_date >= weekStart && visit.scheduled_date <= weekEnd);
    
    return matchesSearch && matchesStatus && matchesVisitType && matchesAssigned && matchesProperty && matchesWeek;
  }).sort((a, b) => {
    // Upcoming/open: sort ascending (soonest first); completed/all: sort descending (most recent first)
    const isUpcomingView = statusFilter === 'scheduled,open' || statusFilter === 'scheduled' || statusFilter === 'open';
    if (isUpcomingView) {
      return a.scheduled_date > b.scheduled_date ? 1 : -1;
    }
    return a.scheduled_date < b.scheduled_date ? 1 : -1;
  });

  const checkForScheduledVisit = () => {
    if (newVisit.checkin_type !== 'drop_in') return false;
    
    const selectedDate = parseISO(newVisit.scheduled_date);
    const weekStart = addDays(selectedDate, -selectedDate.getDay());
    const weekEnd = addDays(weekStart, 6);
    
    const scheduledInSameWeek = visits.find(v => 
      v.property_id === newVisit.property_id &&
      v.visit_type === 'check-in' &&
      v.status === 'scheduled' &&
      v.checkin_type === 'routine'
    );
    
    if (scheduledInSameWeek) {
      const visitDate = parseISO(scheduledInSameWeek.scheduled_date);
      if (visitDate >= weekStart && visitDate <= weekEnd) {
        setScheduledVisitToReplace(scheduledInSameWeek);
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

      if (visitType === 'check-in') {
        if (!editingId && checkForScheduledVisit()) {
          return;
        }

        const isFlexibleType = ['other', 'customer_called_in', 'drop_in'].includes(newVisit.checkin_type);
        
        const visitData = {
          company_id: companyId,
          property_id: newVisit.property_id,
          client_id: property?.client_id,
          visit_type: 'check-in',
          checkin_type: newVisit.checkin_type,
          template_id: !isFlexibleType ? (newVisit.template_id || null) : null,
          scheduled_date: newVisit.scheduled_date,
          scheduled_time: newVisit.scheduled_time || null,
          assigned_to: newVisit.assigned_to || null,
          assigned_to_name: staffMember?.user_name || null,
          status: isFlexibleType ? 'completed' : 'scheduled',
          completed_at: isFlexibleType ? new Date().toISOString() : null,
          ...(isFlexibleType && { summary_notes: newVisit.checkin_details || '' }),
          ...(newVisit.custom_name && { custom_checkin_name: newVisit.custom_name })
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
      setVisitType('check-in');
      setNewVisit({
        property_id: '',
        template_id: '',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '',
        checkin_type: 'routine',
        assigned_to: '',
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_end_date: '',
        custom_name: '',
        checkin_details: '',
        followup_type: 'issue',
        followup_category: 'general',
        followup_priority: 'medium',
        followup_title: '',
        followup_description: '',
        followup_due_date: format(new Date(), 'yyyy-MM-dd'),
        followup_due_time: '',
        estimated_hours: ''
      });
      setCreating(false);
      loadData();
    }
  };

  const handleEditVisit = (visit) => {
    setEditingId(visit.id);
    setVisitType(visit.visit_type);
    if (visit.visit_type === 'check-in') {
      setNewVisit({
        property_id: visit.property_id,
        template_id: visit.template_id || '',
        scheduled_date: visit.scheduled_date,
        scheduled_time: visit.scheduled_time || '',
        checkin_type: visit.checkin_type,
        assigned_to: visit.assigned_to || '',
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_end_date: '',
        custom_name: visit.custom_checkin_name || '',
        checkin_details: visit.summary_notes || '',
        followup_type: 'issue',
        followup_category: 'general',
        followup_priority: 'medium',
        followup_title: '',
        followup_description: '',
        followup_due_date: format(new Date(), 'yyyy-MM-dd'),
        followup_due_time: '',
        estimated_hours: ''
      });
    } else {
      setNewVisit({
        property_id: visit.property_id,
        template_id: '',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '',
        checkin_type: 'routine',
        assigned_to: visit.assigned_to || '',
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_end_date: '',
        custom_name: '',
        checkin_details: '',
        followup_type: visit.followup_type,
        followup_category: visit.followup_category,
        followup_priority: visit.priority,
        followup_title: visit.title,
        followup_description: visit.description,
        followup_due_date: visit.scheduled_date,
        followup_due_time: visit.scheduled_time || '',
        estimated_hours: ''
      });
    }
    setShowNewDialog(true);
  };

  const handleReplaceScheduled = async (replace) => {
    setCreating(true);
    
    const property = getProperty(newVisit.property_id);
    const staffMember = staff.find(s => s.user_email === newVisit.assigned_to);
    
    const isFlexibleType = ['other', 'customer_called_in', 'drop_in'].includes(newVisit.checkin_type);
    
    const checkinData = {
      company_id: companyId,
      property_id: newVisit.property_id,
      client_id: property?.client_id,
      visit_type: 'check-in',
      template_id: !isFlexibleType ? (newVisit.template_id || null) : null,
      scheduled_date: newVisit.scheduled_date,
      scheduled_time: newVisit.scheduled_time || null,
      checkin_type: newVisit.checkin_type,
      assigned_to: newVisit.assigned_to || null,
      assigned_to_name: staffMember?.user_name || null,
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...(isFlexibleType && { summary_notes: newVisit.checkin_details || '' }),
      ...(newVisit.custom_name && { custom_checkin_name: newVisit.custom_name })
    };
    
    if (replace && scheduledVisitToReplace) {
      await base44.entities.Visit.update(scheduledVisitToReplace.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }
    
    await base44.entities.Visit.create(checkinData);
    
    setShowReplaceDialog(false);
    setScheduledVisitToReplace(null);
    setShowNewDialog(false);
    setNewVisit({
      property_id: '',
      template_id: '',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '',
      checkin_type: 'routine',
      assigned_to: '',
      is_recurring: false,
      recurrence_frequency: 'weekly',
      recurrence_end_date: '',
      custom_name: '',
      checkin_details: '',
      followup_type: 'issue',
      followup_category: 'general',
      followup_priority: 'medium',
      followup_title: '',
      followup_description: '',
      followup_due_date: format(new Date(), 'yyyy-MM-dd'),
      followup_due_time: '',
      estimated_hours: ''
    });
    setCreating(false);
    loadData();
  };

  const handleCheckInNow = async (propertyId) => {
    const propertyChecklist = checklists.find(c => c.property_id === propertyId);
    if (propertyChecklist) {
      const prop = properties.find(p => p.id === propertyId);
      const visit = await base44.entities.Visit.create({
        company_id: companyId,
        property_id: propertyId,
        client_id: prop?.client_id || null,
        visit_type: 'check-in',
        checkin_type: 'routine',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'in_progress',
        template_id: propertyChecklist.template_id || null
      });
      navigate(createPageUrl('VisitChecklistMobile') + `?visit_id=${visit.id}&property_id=${propertyId}`);
    }
    setShowCheckInNow(false);
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
              navigate(createPageUrl('VisitDetail') + `?id=${visit.id}`);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {visit.visit_type === 'check-in' && visit.status === 'scheduled' && (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('VisitChecklistMobile') + `?visit_id=${visit.id}&property_id=${visit.property_id}`);
                }}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Checklist
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
           setVisitType('check-in');
           setShowNewDialog(true);
         }}
         actionLabel="Schedule a Visit"
         actionClassName="bg-black text-white hover:bg-slate-900"
       />
       
       {/* Check-In Now Button */}
       <div className="mb-6 flex gap-2 justify-end">
         <Button
           onClick={() => setShowCheckInNow(true)}
           className="bg-amber-600 hover:bg-amber-700 text-white"
         >
           <Zap className="w-4 h-4 mr-2" />
           Check-In Now
         </Button>
       </div>

      {/* Search */}
       <Card className="mb-6 p-4">
         <div className="relative mb-4">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input
             placeholder="Search visits by property name or address..."
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
               <SelectItem value="scheduled,open">Open/Scheduled</SelectItem>
               <SelectItem value="scheduled">Scheduled</SelectItem>
               <SelectItem value="open">Open</SelectItem>
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
               <SelectItem value="check-in">Check-In</SelectItem>
               <SelectItem value="followup">Follow-Up</SelectItem>
             </SelectContent>
           </Select>
           <Select value={assignedFilter} onValueChange={setAssignedFilter}>
             <SelectTrigger className="w-full sm:w-36">
               <SelectValue placeholder="Assigned" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Staff</SelectItem>
               <SelectItem value="me">My Visits</SelectItem>
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
              setVisitType('check-in');
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
          onRowClick={(visit) => navigate(createPageUrl('VisitDetail') + `?id=${visit.id}`)}
          emptyMessage="No visits match your filters"
        />
      )}

      {/* New Visit Dialog (Check-In or Follow-up) */}
       <Dialog open={showNewDialog} onOpenChange={(open) => {
         setShowNewDialog(open);
         if (!open) {
           setEditingId(null);
           setVisitType('check-in');
           setScheduleMode('manual');
           setSearchResults([]);
           setNewVisit({
             property_id: '',
             template_id: '',
             scheduled_date: format(new Date(), 'yyyy-MM-dd'),
             scheduled_time: '',
             checkin_type: 'routine',
             assigned_to: '',
             is_recurring: false,
             recurrence_frequency: 'weekly',
             recurrence_end_date: '',
             custom_name: '',
             checkin_details: '',
             followup_type: 'issue',
             followup_category: 'general',
             followup_priority: 'medium',
             followup_title: '',
             followup_description: '',
             followup_due_date: format(new Date(), 'yyyy-MM-dd'),
             followup_due_time: '',
             estimated_hours: ''
           });
         }
       }}>
         <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white">
           <DialogHeader className="px-6 pt-6 pb-4 rounded-t-2xl bg-slate-900 -mx-0">
             <DialogTitle className="text-white text-lg font-semibold">{editingId ? 'Edit Visit' : 'Schedule a Visit'}</DialogTitle>
             <DialogDescription className="text-white">
               {editingId ? 'Update visit details' : 'Create a new check-in or follow-up'}
             </DialogDescription>
           </DialogHeader>
           <div className="px-6 pb-6">

           {!editingId && (
             <div className="flex gap-2 mb-4">
               <Button
                 variant={scheduleMode === 'manual' ? 'default' : 'outline'}
                 onClick={() => {
                   setScheduleMode('manual');
                   setSearchResults([]);
                 }}
                 className={`flex-1 font-medium ${scheduleMode === 'manual' ? 'bg-slate-900 text-white' : ''}`}
               >
                 Manual Schedule
               </Button>
               <Button
                 variant={scheduleMode === 'search' ? 'default' : 'outline'}
                 onClick={() => {
                   setScheduleMode('search');
                   setSearchResults([]);
                 }}
                 className={`flex-1 font-medium ${scheduleMode === 'search' ? 'bg-slate-900 text-white' : ''}`}
               >
                 Find Available
               </Button>
             </div>
           )}

           <div className="space-y-4 py-4">
              {/* Property - Shows first in both modes */}
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
                   {properties.length === 0 ? (
                     <div className="p-2">
                       <Button
                         onClick={() => {
                           setShowNewDialog(false);
                           navigate(createPageUrl('PropertyForm'));
                         }}
                         className="w-full bg-blue-600 hover:bg-blue-700"
                         size="sm"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Create Property
                       </Button>
                     </div>
                   ) : (
                     <>
                       {properties.map((property) => (
                         <SelectItem key={property.id} value={property.id}>
                           <div className="flex flex-col">
                             <span>{property.name || property.address}</span>
                             <span className="text-xs text-slate-500">{property.city}, {property.state}</span>
                           </div>
                         </SelectItem>
                       ))}
                       <div className="p-2 border-t">
                         <Button
                           onClick={() => {
                             setShowNewDialog(false);
                             navigate(createPageUrl('PropertyForm'));
                           }}
                           variant="outline"
                           className="w-full"
                           size="sm"
                         >
                           <Plus className="h-4 w-4 mr-2" />
                           Add New Property
                         </Button>
                       </div>
                     </>
                   )}
                 </SelectContent>
               </Select>
              </div>

              {/* Visit Type Selector */}
              <div>
                <Label>Visit Type *</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check-in">Check-In</SelectItem>
                    <SelectItem value="followup">Follow-Up</SelectItem>
                    <SelectItem value="pre_storm">Pre-Storm</SelectItem>
                    <SelectItem value="post_storm">Post-Storm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleMode === 'search' && !editingId && (
               <div className="space-y-4">
                {visitType === 'check-in' && (
                  <div>
                    <Label>Check-In Type *</Label>
                    <Select
                      value={newVisit.checkin_type}
                      onValueChange={(value) => setNewVisit(prev => ({ ...prev, checkin_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="customer_called_in">Customer Called-In</SelectItem>
                        <SelectItem value="drop_in">Drop-In</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {visitType === 'followup' && (
                  <div>
                    <Label>Follow-Up Type *</Label>
                    <Input
                      placeholder="e.g., Roof repair, HVAC maintenance"
                      value={newVisit.followup_type}
                      onChange={(e) => setNewVisit(prev => ({ ...prev, followup_type: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label>Estimated Hours *</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g., 2"
                    value={newVisit.estimated_hours || ''}
                    onChange={(e) => setNewVisit(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || '' }))}
                  />
                </div>

                <Button 
                  onClick={findAvailableSlots}
                  disabled={!newVisit.property_id}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Find First Available
                </Button>
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (visitType === 'check-in') {
                            setNewVisit(prev => ({
                              ...prev,
                              scheduled_date: result.date,
                              scheduled_time: result.time,
                              assigned_to: result.staffEmail
                            }));
                          } else {
                            setNewVisit(prev => ({
                              ...prev,
                              followup_due_date: result.date,
                              followup_due_time: result.time,
                              assigned_to: result.staffEmail
                            }));
                          }
                          setScheduleMode('manual');
                        }}
                        className="w-full text-left p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-sm font-medium text-slate-900"
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
             )}

             {scheduleMode === 'manual' && (
              <>
             {visitType === 'check-in' ? (
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

           {visitType === 'check-in' ? (
           <>
             <div>
               <Label>Check-In Type</Label>
               <Select
                 value={newVisit.checkin_type}
                 onValueChange={(value) => setNewVisit(prev => ({ ...prev, checkin_type: value, template_id: !['other', 'customer_called_in', 'drop_in'].includes(value) ? prev.template_id : '' }))}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="routine">Routine</SelectItem>
                   <SelectItem value="customer_called_in">Customer Called-In</SelectItem>
                   <SelectItem value="drop_in">Drop-In</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
             </div>

              {newVisit.checkin_type === 'other' && (
                <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <Label>Check-In Name</Label>
                    <Input
                      placeholder="e.g., Annual Maintenance Check"
                      value={newVisit.custom_name}
                      onChange={(e) => setNewVisit(prev => ({ ...prev, custom_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>What was checked?</Label>
                    <Textarea
                      placeholder="Describe what was checked..."
                      value={newVisit.checkin_details}
                      onChange={(e) => setNewVisit(prev => ({ ...prev, checkin_details: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <p className="text-xs text-blue-700">Photos can be added after creation</p>
                </div>
              )}

              {newVisit.checkin_type === 'customer_called_in' && (
                <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div>
                    <Label>What was requested to check?</Label>
                    <Textarea
                      placeholder="Describe what the client requested..."
                      value={newVisit.checkin_details}
                      onChange={(e) => setNewVisit(prev => ({ ...prev, checkin_details: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <p className="text-xs text-purple-700">Photos can be added after creation</p>
                </div>
              )}

              {newVisit.checkin_type === 'drop_in' && (
                <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <Label>Check-In Name</Label>
                    <Input
                      placeholder="e.g., Quick Property Check"
                      value={newVisit.custom_name}
                      onChange={(e) => setNewVisit(prev => ({ ...prev, custom_name: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-green-700">
                    <strong>Drop-In:</strong> Unscheduled check-in during convenience visit. If a scheduled check-in exists for this week, you'll be offered to use this instead.
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

              {visitType === 'check-in' && templates.length > 0 && !['other', 'customer_called_in', 'drop_in'].includes(newVisit.checkin_type) && (
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

              {visitType === 'check-in' && !['other', 'customer_called_in', 'drop_in'].includes(newVisit.checkin_type) && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Recurring Check-In</Label>
                    <p className="text-sm text-slate-500">Schedule multiple check-ins</p>
                  </div>
                  <Switch
                    checked={newVisit.is_recurring}
                    onCheckedChange={(checked) => setNewVisit(prev => ({ ...prev, is_recurring: checked }))}
                  />
                </div>
              )}

              {visitType === 'check-in' && newVisit.is_recurring && (
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
                  </>
                  )}
                  </div>
                  </div>

                  <DialogFooter className="px-6 pb-6">
                  <Button variant="outline" onClick={() => setShowNewDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateVisit}
            disabled={
              !newVisit.property_id ||
              (visitType === 'check-in' && !newVisit.scheduled_date) ||
              (visitType === 'followup' && !newVisit.followup_due_date) ||
              (visitType === 'followup' && !newVisit.followup_title) ||
              creating ||
              (visitType === 'check-in' && newVisit.is_recurring && !newVisit.recurrence_end_date) ||
              (visitType === 'check-in' && ['other', 'customer_called_in'].includes(newVisit.checkin_type) && !newVisit.checkin_details)
            }
            className="bg-slate-900 hover:bg-slate-800"
          >
            {creating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Replace Scheduled Visit Dialog */}
   <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
     <DialogContent className="max-w-md rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
       <DialogHeader className="rounded-t-2xl bg-slate-900 px-6 pt-6 pb-4">
         <DialogTitle className="text-white text-lg font-semibold">Use Drop-In to Fulfill Scheduled Check-In?</DialogTitle>
         <DialogDescription className="text-slate-300 text-sm">
           There is a scheduled {scheduledVisitToReplace?.checkin_type === 'routine' ? 'Routine' : scheduledVisitToReplace?.checkin_type} check-in for this property on{' '}
           {scheduledVisitToReplace && format(parseISO(scheduledVisitToReplace.scheduled_date), 'MMM d, yyyy')}.
           You can mark that scheduled check-in as complete and link this drop-in visit instead.
         </DialogDescription>
       </DialogHeader>

       <DialogFooter className="gap-2 px-6 py-5">
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
           Use Drop-In & Mark Check-In Complete
         </Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>

  {/* Check-In Now Dialog */}
   <Dialog open={showCheckInNow} onOpenChange={setShowCheckInNow}>
     <DialogContent className="max-w-md rounded-2xl p-0 bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl">
     <DialogHeader className="rounded-t-2xl bg-blue-950 px-6 pt-6 pb-4">
         <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
           <Zap className="h-5 w-5" /> Quick Check-In
         </DialogTitle>
         <DialogDescription className="text-amber-100 text-sm">Select a property to start a check-in with its saved checklist</DialogDescription>
       </DialogHeader>
       <div className="space-y-3 max-h-[60vh] overflow-y-auto px-6 py-4">
         {properties.length === 0 ? (
           <p className="text-sm text-slate-500 text-center py-6">No properties available</p>
         ) : (
           properties.map(property => {
             const hasChecklist = checklists.some(c => c.property_id === property.id);
             return (
               <button
                 key={property.id}
                 onClick={() => handleCheckInNow(property.id)}
                 disabled={!hasChecklist}
                 className={`w-full text-left p-3 rounded-xl border transition-all ${
                   hasChecklist
                     ? 'border-white/40 bg-white/60 hover:bg-blue-50/80 hover:border-blue-300 shadow-sm hover:shadow'
                     : 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed'
                 }`}
               >
                 <div className="flex items-start gap-3">
                   <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                     {property.primary_photo_url ? (
                       <img src={property.primary_photo_url} alt="" className="h-full w-full object-cover" />
                     ) : (
                       <Building2 className="h-4 w-4 text-slate-400" />
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-semibold text-slate-900">{property.name || property.address}</p>
                     <p className="text-sm text-slate-500 truncate">{property.city}, {property.state}</p>
                     {!hasChecklist && <p className="text-xs text-amber-600 mt-0.5">No checklist configured</p>}
                   </div>
                 </div>
               </button>
             );
           })
         )}
       </div>
       <DialogFooter className="px-6 pb-5">
         <Button variant="outline" onClick={() => setShowCheckInNow(false)}>Cancel</Button>
       </DialogFooter>
     </DialogContent>
   </Dialog>
    </div>
  );
  }