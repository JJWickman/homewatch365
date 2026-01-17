import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { 
  ClipboardCheck, Building2, Users, AlertTriangle, 
  Calendar, ArrowRight, Clock, MapPin, CheckCircle2,
  TrendingUp, FileWarning, CloudRain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import StatsDetailModal from '@/components/dashboard/StatsDetailModal';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [companyMember, setCompanyMember] = useState(null);
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProperties: 0,
    inspectionsThisWeek: 0,
    completedThisWeek: 0,
    pendingTasks: 0,
    issuesFound: 0
  });
  const [todayInspections, setTodayInspections] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    description: '',
    items: [],
    type: null
  });
  const [allData, setAllData] = useState({
    clients: [],
    properties: [],
    inspections: [],
    followUps: []
  });

  useEffect(() => {
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
      // Fetch fresh user data to get full_name
      const userList = await base44.entities.User.filter({ email: currentUser.email });
      const freshUser = userList.length > 0 ? { ...currentUser, full_name: userList[0].full_name, id: userList[0].id } : currentUser;
      setUser(freshUser);

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length === 0) {
        setLoading(false);
        return;
      }
      
      setCompanyMember(members[0]);
      const companyId = members[0].company_id;
      
      const [companies, clients, properties, inspections, followUps, activities] = await Promise.all([
        base44.entities.Company.filter({ id: companyId }),
        base44.entities.Client.filter({ company_id: companyId, is_active: true }),
        base44.entities.Property.filter({ company_id: companyId, is_active: true }),
        base44.entities.Inspection.filter({ company_id: companyId }),
        base44.entities.FollowUp.filter({ company_id: companyId, status: 'open' }),
        base44.entities.ActivityLog.filter({ company_id: companyId }, '-created_date', 10)
      ]);

      if (companies.length > 0) {
        setCompany(companies[0]);
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

      const weekInspections = inspections.filter(i => {
        const date = i.scheduled_date;
        return date >= weekStart && date <= weekEnd;
      });

      const completedThisWeek = weekInspections.filter(i => i.status === 'completed').length;
      const issuesFound = followUps.filter(f => f.type === 'issue' && (f.priority === 'high' || f.priority === 'urgent')).length;

      setStats({
        totalClients: clients.length,
        totalProperties: properties.length,
        inspectionsThisWeek: weekInspections.length,
        completedThisWeek,
        pendingTasks: followUps.length,
        issuesFound
      });

      setAllData({
        clients,
        properties,
        inspections: weekInspections,
        followUps
      });

      const todayScheduled = inspections.filter(i => i.scheduled_date === today && i.status !== 'cancelled');
      
      // Enrich with property data
      const enrichedInspections = await Promise.all(todayScheduled.map(async (inspection) => {
        const props = await base44.entities.Property.filter({ id: inspection.property_id, company_id: companyId });
        return { ...inspection, property: props[0] };
      }));
      
      setTodayInspections(enrichedInspections.slice(0, 5));
      setRecentActivity(activities);

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

  const openModal = (type) => {
    let title = '';
    let description = '';
    let items = [];

    if (type === 'properties') {
      title = 'Total Properties';
      description = `You have ${allData.properties.length} active properties`;
      items = allData.properties.map(p => ({
        label: p.name || p.address,
        value: `${p.city}, ${p.state}`
      }));
    } else if (type === 'clients') {
      title = 'Active Clients';
      description = `You have ${allData.clients.length} active clients`;
      items = allData.clients.map(c => ({
        label: `${c.first_name} ${c.last_name}`,
        value: c.email
      }));
    } else if (type === 'week') {
      title = 'This Week Inspections';
      description = `${stats.completedThisWeek} of ${stats.inspectionsThisWeek} inspections completed`;
      items = allData.inspections.map(i => ({
        label: i.property?.name || 'Property',
        value: `${i.status === 'completed' ? 'Completed' : 'Scheduled'} - ${format(new Date(i.scheduled_date), 'MMM d')}`
      }));
    } else if (type === 'followups') {
      title = 'Pending Follow-Ups';
      description = `You have ${allData.followUps.length} pending follow-ups`;
      items = allData.followUps.map(f => ({
        label: f.title,
        value: `${f.type} - Priority: ${f.priority}`
      }));
    }

    setModalState({
      isOpen: true,
      title,
      description,
      items,
      type
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
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

  if (!companyMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Building2 className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Welcome to Estate Watch</h2>
        <p className="text-slate-500 text-center max-w-md mb-6">
          You're not currently associated with any company. Please contact your administrator or create a new company.
        </p>
        <Link to={createPageUrl('CompanyOnboarding')}>
          <Button className="bg-slate-900 hover:bg-slate-800">
            Create Company
          </Button>
        </Link>
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
        <Link to={createPageUrl('Inspections') + '?action=new'}>
          <Button className="bg-black text-white hover:bg-slate-900">
            <Calendar className="h-4 w-4 mr-2" />
            Book a Visit
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Link to={createPageUrl('Inspections')} className="cursor-pointer h-full">
          <StatsCard
            title="This Week"
            value={`${stats.completedThisWeek}/${stats.inspectionsThisWeek}`}
            icon={ClipboardCheck}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            className="[&_p.text-2xl]:mt-10"
          />
        </Link>
        <Link to={createPageUrl('Inspections')} className="cursor-pointer h-full">
          <StatsCard
            title="Pending Visits"
            value={stats.pendingTasks}
            icon={FileWarning}
            iconColor="text-slate-600"
            iconBg="bg-slate-100"
          />
        </Link>
      </div>

      {/* Today's Inspections - Full Width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Today's Inspections</CardTitle>
          <Link to={createPageUrl('Schedule')} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {todayInspections.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No inspections scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayInspections.map((inspection) => (
                <Link 
                  key={inspection.id} 
                  to={createPageUrl('InspectionDetail') + `?id=${inspection.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {inspection.property?.name || inspection.property?.address}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {inspection.scheduled_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {inspection.scheduled_time}
                        </span>
                      )}
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {inspection.property?.city}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={inspection.status} />
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
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-slate-100">
                      {getInitials(activity.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium">{activity.user_name || 'Someone'}</span>
                      {' '}{activity.action}d{' '}
                      <span className="font-medium">{activity.entity_name || activity.entity_type}</span>
                    </p>
                    {activity.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{activity.details}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                    <StatusBadge status={activity.action} className="text-xs" />
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
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
            <Link to={createPageUrl('FollowUps') + '?type=issue&priority=high'}>
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