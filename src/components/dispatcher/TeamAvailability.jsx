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

  const getStatusColor = (count, total) => {
    if (count === 0) return 'bg-slate-200';
    const percentage = (count / total) * 100;
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Status
          <Badge variant="outline" className="ml-auto">Live</Badge>
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
                const completionRate = stats.todayCount > 0 ? (stats.todayCompleted / stats.todayCount) * 100 : 0;
                
                return (
                  <div 
                    key={member.id}
                    className="p-4 rounded-lg border bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold">
                            {getInitials(member.user_name, member.user_email)}
                          </AvatarFallback>
                        </Avatar>
                        {stats.todayCount > 0 && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-white">
                            {completionRate === 100 ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {member.user_name || member.user_email}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {member.role === 'field_inspector' ? 'Field Inspector' : member.role}
                        </p>

                        {/* Visual Progress Circle */}
                        <div className="mt-3 flex items-center gap-4">
                          <div className="relative">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-slate-100"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
                                className={completionRate === 100 ? 'text-green-500' : completionRate >= 50 ? 'text-blue-500' : 'text-amber-500'}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">{stats.todayCompleted}</p>
                                <p className="text-xs text-slate-500">/{stats.todayCount}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 font-medium">Today</span>
                              <span className="font-semibold text-slate-900">
                                {stats.todayCount > 0 ? `${Math.round(completionRate)}%` : '0%'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">This Week</span>
                              <span className="font-medium text-slate-700">
                                {stats.completed}/{stats.weekTotal}
                              </span>
                            </div>
                            
                            {/* Status Badge */}
                            {stats.todayCount === 0 ? (
                              <Badge variant="outline" className="text-xs w-full justify-center">
                                Off Today
                              </Badge>
                            ) : completionRate === 100 ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs w-full justify-center">
                                ✓ Complete
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs w-full justify-center">
                                {stats.todayCount - stats.todayCompleted} left
                              </Badge>
                            )}
                          </div>
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