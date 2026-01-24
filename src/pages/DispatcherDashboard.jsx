import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Calendar, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/shared/PageHeader';
import DispatcherMap from '@/components/dispatcher/DispatcherMap';
import TeamAvailability from '@/components/dispatcher/TeamAvailability';
import DailySchedule from '@/components/dispatcher/DailySchedule';

export default function DispatcherDashboard() {
  const [visits, setVisits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyMember, setCompanyMember] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length === 0) return;
      
      const member = members[0];
      setCompanyMember(member);

      const today = new Date().toISOString().split('T')[0];
      
      const [visitsData, propertiesData, teamData] = await Promise.all([
        base44.entities.Visit.filter({ 
          company_id: member.company_id,
          scheduled_date: today
        }),
        base44.entities.Property.filter({ company_id: member.company_id }),
        base44.entities.CompanyMember.filter({ company_id: member.company_id })
      ]);

      setVisits(visitsData);
      setProperties(propertiesData);
      setTeam(teamData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduledVisits = visits.filter(v => v.status === 'scheduled');
  const completedVisits = visits.filter(v => v.status === 'completed');
  const inProgressVisits = visits.filter(v => v.status === 'in_progress');

  const propertiesWithVisits = properties.filter(p => 
    visits.some(v => v.property_id === p.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch Center"
        subtitle="Today's schedule, team status, and property locations"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Scheduled</p>
                <p className="text-2xl font-bold">{scheduledVisits.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">In Progress</p>
                <p className="text-2xl font-bold">{inProgressVisits.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold">{completedVisits.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Team</p>
                <p className="text-2xl font-bold">{team.filter(t => t.is_active).length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Schedule */}
          <DailySchedule 
            visits={visits} 
            onRefresh={loadData}
          />

          {/* Map View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DispatcherMap 
                properties={propertiesWithVisits}
                visits={visits}
              />
            </CardContent>
          </Card>
        </div>

        {/* Team Availability Sidebar */}
        <div className="lg:col-span-1">
          <TeamAvailability 
            team={team}
            companyId={companyMember?.company_id}
          />
        </div>
      </div>
    </div>
  );
}