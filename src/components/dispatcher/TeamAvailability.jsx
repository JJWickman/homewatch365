import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function TeamAvailability({ team, companyId }) {
  const [weeklyVisits, setWeeklyVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadWeeklyData();
    }
  }, [companyId]);

  const loadWeeklyData = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const weekEnd = addDays(weekStart, 6);

      // Get all visits for the week
      const visits = await base44.entities.Visit.filter({
        company_id: companyId,
      });

      // Filter visits for this week
      const thisWeekVisits = visits.filter(v => {
        const visitDate = new Date(v.scheduled_date);
        return visitDate >= weekStart && visitDate <= weekEnd;
      });

      setWeeklyVisits(thisWeekVisits);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const getMemberStats = (memberEmail) => {
    const memberVisits = weeklyVisits.filter(v => v.assigned_to === memberEmail);
    const today = new Date();
    
    const todayVisits = memberVisits.filter(v => isSameDay(new Date(v.scheduled_date), today));
    const weekTotal = memberVisits.length;
    const completed = memberVisits.filter(v => v.status === 'completed').length;

    return {
      todayCount: todayVisits.length,
      weekTotal,
      completed,
      todayCompleted: todayVisits.filter(v => v.status === 'completed').length,
    };
  };

  const activeTeam = team.filter(t => t.is_active && (t.role === 'field_inspector' || t.role === 'technician'));

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Availability
          <Badge variant="outline" className="ml-auto">This Week</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTeam.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No team members assigned</p>
              </div>
            ) : (
              activeTeam.map((member) => {
                const stats = getMemberStats(member.user_email);
                
                return (
                  <div 
                    key={member.id}
                    className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-slate-900 text-white text-sm">
                          {getInitials(member.user_name, member.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.user_name || member.user_email}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {member.role === 'field_inspector' ? 'Field Inspector' : member.role}
                        </p>

                        <div className="mt-3 space-y-2">
                          {/* Today's Progress */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Today
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {stats.todayCompleted}/{stats.todayCount}
                              </span>
                              {stats.todayCount > 0 && (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                          </div>

                          {/* Week Progress */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Week Total</span>
                            <span className="font-medium">
                              {stats.completed}/{stats.weekTotal}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          {stats.weekTotal > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${(stats.completed / stats.weekTotal) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="mt-2">
                          {stats.todayCount === 0 ? (
                            <Badge variant="outline" className="text-xs">
                              No visits today
                            </Badge>
                          ) : stats.todayCompleted === stats.todayCount ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              All done today
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {stats.todayCount - stats.todayCompleted} remaining
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}