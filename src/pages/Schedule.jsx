import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  format, startOfWeek, endOfWeek, addDays, addWeeks, subDays,
  subWeeks, isSameDay, parseISO, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isToday
} from 'date-fns';
import { 
  Calendar, ChevronLeft, ChevronRight, Building2, 
  Clock, User, Plus, MapPin, Route
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';

export default function Schedule() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [companyId, setCompanyId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('my');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setUserEmail(user.email);
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [visitsData, propertiesData, staffData] = await Promise.all([
          base44.entities.Visit.filter({ company_id: cId }),
          base44.entities.Property.filter({ company_id: cId }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true })
        ]);
        
        setVisits(visitsData);
        setProperties(propertiesData);
        setStaffMembers(staffData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // Pad start of month
    const startDay = getDay(start);
    const paddedStart = Array.from({ length: startDay }, (_, i) => 
      addDays(start, -(startDay - i))
    );
    
    // Pad end of month
    const endDay = getDay(end);
    const paddedEnd = Array.from({ length: 6 - endDay }, (_, i) => 
      addDays(end, i + 1)
    );
    
    return [...paddedStart, ...days, ...paddedEnd];
  };

  const getItemsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let dayVisits = visits.filter(v => v.scheduled_date === dateStr && v.status !== 'cancelled');
    
    if (selectedUser === 'my' && userEmail) {
      dayVisits = dayVisits.filter(v => v.assigned_to === userEmail);
    } else if (selectedUser !== 'all') {
      dayVisits = dayVisits.filter(v => v.assigned_to === selectedUser);
    }
    
    return dayVisits;
  };

  const navigatePrev = () => {
    if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const DayCard = ({ date, compact = false }) => {
    const dayVisits = getItemsForDate(date);
    const isCurrentDay = isToday(date);
    
    return (
      <div 
        className={`min-h-[120px] ${compact ? 'min-h-[80px]' : ''} border-r last:border-r-0 ${
          isCurrentDay ? 'bg-blue-50' : ''
        }`}
      >
        <div className={`p-2 border-b text-center ${isCurrentDay ? 'bg-blue-100' : 'bg-slate-50'}`}>
          <p className="text-xs text-slate-500 uppercase">{format(date, 'EEE')}</p>
          <p className={`text-lg font-semibold ${isCurrentDay ? 'text-blue-700' : ''}`}>
            {format(date, 'd')}
          </p>
        </div>
        <div className="p-1 space-y-1 max-h-[200px] overflow-y-auto">
          {dayVisits.map((visit) => {
            const property = getProperty(visit.property_id);
            const isInspection = visit.visit_type === 'inspection';
            const isFollowUp = visit.visit_type === 'followup';
            
            return (
              <Link
                key={visit.id}
                to={createPageUrl(isInspection ? 'InspectionDetail' : 'FollowUpDetail') + `?id=${visit.id}`}
                className={`block p-1.5 rounded text-xs ${
                  visit.status === 'completed' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : visit.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : isFollowUp && visit.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : isFollowUp
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                } hover:opacity-80 transition-opacity`}
              >
                <div className="font-medium truncate">
                  {isInspection ? (property?.name || property?.address?.slice(0, 15)) : visit.title}
                </div>
                <div className="text-[10px] opacity-75 capitalize">
                  {visit.visit_type === 'followup' 
                    ? (visit.followup_type?.replace(/_/g, ' ') || 'Follow-Up')
                    : (visit.checkin_type?.replace(/_/g, ' ') || visit.visit_type?.replace(/-/g, ' ') || 'Check-In')}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
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
        title="Schedule"
        subtitle="View and manage visits and tasks"
        action={() => navigate(createPageUrl('Visits') + '?action=new')}
        actionLabel="New Visit"
        actionClassName="bg-black text-white hover:bg-slate-900"
      />

      {/* Calendar Controls */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[200px] text-center">
                {view === 'week' 
                  ? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')
                }
              </h2>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my">My Schedule</SelectItem>
                  <SelectItem value="all">Everyone</SelectItem>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.user_email}>
                      {member.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={view} onValueChange={setView}>
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week View */}
      {view === 'week' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {getWeekDays().map((date, i) => (
              <DayCard key={i} date={date} />
            ))}
          </div>
        </Card>
      )}

      {/* Month View */}
      {view === 'month' && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 bg-slate-50 border-b">
                {day}
              </div>
            ))}
            {getMonthDays().map((date, i) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r last:border-r-0 ${
                    !isCurrentMonth ? 'bg-slate-50 opacity-50' : ''
                  } ${isToday(date) ? 'bg-blue-50' : ''}`}
                >
                  <div className={`p-1 text-right ${isToday(date) ? 'font-bold text-blue-700' : ''}`}>
                    <span className="text-sm">{format(date, 'd')}</span>
                  </div>
                  <div className="px-1 space-y-0.5">
                    {getItemsForDate(date).slice(0, 3).map((visit) => {
                       const property = getProperty(visit.property_id);
                       const isInspection = visit.visit_type === 'inspection';
                       const isFollowUp = visit.visit_type === 'followup';
                       
                       return (
                         <Link
                           key={visit.id}
                           to={createPageUrl(isInspection ? 'InspectionDetail' : 'FollowUpDetail') + `?id=${visit.id}`}
                           className={`block px-1 py-0.5 rounded text-[10px] truncate ${
                             visit.status === 'completed' 
                               ? 'bg-emerald-100 text-emerald-800' 
                               : isFollowUp && visit.priority === 'urgent'
                                 ? 'bg-red-100 text-red-800'
                                 : isFollowUp
                                   ? 'bg-purple-100 text-purple-800'
                                   : 'bg-blue-100 text-blue-800'
                           }`}
                         >
                           {isInspection ? (property?.name || property?.address?.slice(0, 10)) : visit.title?.slice(0, 10)}
                         </Link>
                       );
                     })}
                     {getItemsForDate(date).length > 3 && (
                       <div className="text-[10px] text-slate-500 px-1">
                         +{getItemsForDate(date).length - 3} more
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Legend */}
       <div className="flex flex-wrap gap-4 mt-4 text-sm">
         <div className="flex items-center gap-2">
           <div className="h-3 w-3 rounded bg-blue-100 border border-blue-200" />
           <span className="text-slate-600">Scheduled Visit</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="h-3 w-3 rounded bg-amber-100 border border-amber-200" />
           <span className="text-slate-600">In Progress</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="h-3 w-3 rounded bg-emerald-100 border border-emerald-200" />
           <span className="text-slate-600">Completed</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="h-3 w-3 rounded bg-purple-100 border border-purple-200" />
           <span className="text-slate-600">Follow-Up</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="h-3 w-3 rounded bg-red-100 border border-red-200" />
           <span className="text-slate-600">Urgent</span>
         </div>
       </div>
    </div>
  );
}