import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { 
  ClipboardCheck, Building2, Users, AlertTriangle, 
  Calendar, ArrowRight, Clock, MapPin, CheckCircle2,
  TrendingUp, FileWarning, CloudRain, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProperties: 0,
    inspectionsThisWeek: 0,
    completedThisWeek: 0,
    pendingTasks: 0,
    issuesFound: 0,
    monthlyRevenue: 0
  });
  const [todayInspections, setTodayInspections] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Stripe checkout success
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      const tenantId = params.get('tenant_id');
      if (tenantId) {
        base44.functions.invoke('finalizeOnboarding', { tenant_id: tenantId })
          .catch(e => console.error('Error finalizing onboarding:', e));
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = base44.entities.User.subscribe((event) => {
      if (event.type === 'update' && event.id === user.id) {
        setUser(event.data);
      }
    });
    
    return unsubscribe;
  }, [user?.id]);

  const loadDashboardData = async () => {
   try {
     const currentUser = await base44.auth.me();
     setUser(currentUser);

     const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
     setCompanyMember(members[0]);

     const [tenants, clients, properties, visits] = await Promise.all([
       base44.entities.Tenant.filter({ id: currentUser.primary_tenant_id }),
       base44.entities.Client.filter({ is_active: true }),
       base44.entities.Property.filter({ is_active: true }),
       base44.entities.Visit.list('-updated_date', 100),
     ]);

     setCompany(tenants[0]);

      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

      // Filter visits based on user role
      const isFieldInspector = members[0]?.role === 'field_inspector' || members[0]?.role === 'technician';
      const weekVisits = visits.filter(v => {
        const date = v.scheduled_date;
        const matchesDate = date >= weekStart && date <= weekEnd;
        const matchesAssignment = !isFieldInspector || v.assigned_to === currentUser.email;
        return matchesDate && matchesAssignment;
      });

      const completedThisWeek = weekVisits.filter(v => v.status === 'completed').length;
      const highPriorityVisits = visits.filter(v => 
        v.visit_type === 'followup' &&
        (v.status === 'open' || v.status === 'scheduled') && 
        (v.priority === 'high' || v.priority === 'urgent')
      ).length;

      const recurringRevenue = clients.reduce((sum, c) => sum + (c.monthly_rate || 0), 0);

      setStats({
        totalClients: clients.length,
        totalProperties: properties.length,
        inspectionsThisWeek: weekVisits.length,
        completedThisWeek,
        pendingTasks: 0,
        issuesFound: highPriorityVisits,
        monthlyRevenue: recurringRevenue
      });

      const todayScheduled = visits.filter(v => {
        const matchesDate = v.scheduled_date === today && v.status !== 'cancelled';
        const matchesAssignment = !isFieldInspector || v.assigned_to === currentUser.email;
        return matchesDate && matchesAssignment;
      });

      // Enrich with property and client data
      const enrichedVisits = await Promise.all(todayScheduled.map(async (visit) => {
        const [props, cls] = await Promise.all([
          base44.entities.Property.filter({ id: visit.property_id }),
          base44.entities.Client.filter({ id: visit.client_id })
        ]);
        return { ...visit, property: props[0], client: cls[0] };
      }));

      // Build recent activity from visits (last 10 updates)
      const recentVisits = visits.slice(0, 10).map(v => {
        const client = clients.find(c => c.id === v.client_id);
        const property = properties.find(p => p.id === v.property_id);
        return {
          id: v.id,
          user_name: v.completed_by || v.assigned_to_name || 'Field Staff',
          action: v.status === 'completed' ? 'complet' : 'updat',
          entity_name: `${property?.name || property?.address || 'Property'} - ${v.visit_type}`,
          entity_type: 'visit',
          entity_id: v.id,
          created_date: v.updated_date || v.created_date,
          details: `${client?.first_name} ${client?.last_name} (${v.status})`
        };
      });

      setTodayInspections(enrichedVisits);
      setRecentActivity(recentVisits);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActivityLink = (activity) => {
    if (activity.entity_type === 'visit') {
      return createPageUrl('VisitDetail') + `?id=${activity.entity_id}`;
    }
    
    const entityTypeMap = {
      'client': 'ClientDetail',
      'property': 'PropertyDetail',
      'task': 'Visits',
      'staff': 'Settings',
      'billing': 'Dashboard',
      'template': 'Settings',
      'settings': 'Settings'
    };

    const page = entityTypeMap[activity.entity_type] || 'Dashboard';
    const params = activity.entity_id ? `?id=${activity.entity_id}` : '';
    return createPageUrl(page) + params;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {companyMember?.user_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your properties today.</p>
        </div>
        <Link to={createPageUrl('Visits') + '?action=new'}>
          <Button className="bg-black text-white hover:bg-slate-900">
            <Calendar className="h-4 w-4 mr-2" />
            Book a Visit
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to={createPageUrl('Properties')} className="cursor-pointer h-full">
          <StatsCard
            title="Total Properties"
            value={stats.totalProperties}
            icon={Building2}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
        </Link>
        <Link to={createPageUrl('Clients')} className="cursor-pointer h-full">
          <StatsCard
            title="Active Clients"
            value={stats.totalClients}
            icon={Users}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </Link>
        <Link to={createPageUrl('Visits')} className="cursor-pointer h-full">
          <StatsCard
            title="Visits This Week"
            value={`${stats.completedThisWeek}/${stats.inspectionsThisWeek}`}
            icon={ClipboardCheck}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            className="[&_p.text-2xl]:mt-10"
          />
        </Link>
        <Link to={createPageUrl('Visits') + '?filter=followup'} className="cursor-pointer h-full">
          <StatsCard
            title="Urgent Issues"
            value={stats.issuesFound}
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
        </Link>
        <Link to={createPageUrl('Billing')} className="cursor-pointer h-full">
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
        </Link>
      </div>

      {/* Today's Schedule - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
          <Link to={createPageUrl('Schedule')} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {todayInspections.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No visits scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayInspections.map((visit) => (
                <Link 
                 key={visit.id} 
                 to={createPageUrl('VisitDetail') + `?id=${visit.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <p className="font-medium text-slate-900 truncate">
                        {visit.property?.name || visit.property?.address}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {visit.client?.first_name} {visit.client?.last_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      {visit.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {visit.scheduled_time}
                        </span>
                      )}
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {visit.property?.city}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={visit.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity - Full Width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
               {recentActivity.slice(0, 8).map((activity) => (
                 <Link key={activity.id} to={getActivityLink(activity)} className="flex items-start sm:items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors hover:border-slate-300">
                   <Avatar className="h-8 w-8 shrink-0">
                     <AvatarFallback className="text-xs bg-slate-100">
                       {getInitials(activity.user_name)}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex-1 min-w-0">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
                       <p className="text-sm text-slate-900 leading-tight">
                         <span className="font-medium">{activity.user_name || 'Someone'}</span>
                         {' '}{activity.action}d{' '}
                         <span className="font-medium">{activity.entity_name || activity.entity_type}</span>
                       </p>
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                         <StatusBadge status={activity.action} className="text-xs" />
                         <span className="hidden sm:flex items-center gap-1 shrink-0">
                           <Clock className="h-3 w-3" />
                           {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                         </span>
                         <span className="sm:hidden shrink-0">
                           {format(new Date(activity.created_date), 'MMM d')}
                         </span>
                       </div>
                     </div>
                     {activity.details && (
                       <p className="text-xs text-slate-500 mt-1 line-clamp-1">{activity.details}</p>
                     )}
                   </div>
                 </Link>
               ))}
             </div>
          )}
        </CardContent>
      </Card>

      {/* Issues Alert */}
      {stats.issuesFound > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                {stats.issuesFound} high priority issue{stats.issuesFound !== 1 ? 's' : ''} require attention
              </p>
              <p className="text-sm text-amber-700">Review and address these issues as soon as possible.</p>
            </div>
            <Link to={createPageUrl('Visits') + '?filter=followup'}>
              <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                View Issues
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}