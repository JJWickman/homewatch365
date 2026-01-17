import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Route, Loader2, Clock, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/shared/PageHeader';
import RouteMap from '@/components/route/RouteMap';
import StaticRouteMap from '@/components/route/StaticRouteMap';
import { createPageUrl } from '@/utils';

export default function RouteOptimizer() {
  const [companyId, setCompanyId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [visits, setVisits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showOptimized, setShowOptimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [startAddress, setStartAddress] = useState('');
  const [company, setCompany] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (companyId && selectedUser) {
      loadVisits();
      loadSelectedUserStartLocation();
    }
  }, [selectedDate, selectedUser, companyId]);

  const loadSelectedUserStartLocation = async () => {
    const selectedUserMember = teamMembers.find(m => m.user_email === selectedUser);
    if (selectedUserMember?.start_location) {
      setStartAddress(selectedUserMember.start_location);
    } else if (company?.address) {
      setStartAddress(`${company.address}, ${company.city}, ${company.state}`);
    }
  };

  const loadInitialData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });

      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        setSelectedUser(user.email);

        const [propsData, teamData, companyData] = await Promise.all([
          base44.entities.Property.filter({ company_id: cId }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true }),
          base44.entities.Company.filter({ id: cId })
        ]);

        setProperties(propsData);
        setTeamMembers(teamData);
        
        // Set start location from selected user's settings
        const selectedUserMember = teamData.find(m => m.user_email === user.email);
        if (selectedUserMember?.start_location) {
          setStartAddress(selectedUserMember.start_location);
        } else if (companyData.length > 0 && companyData[0].address) {
          setStartAddress(`${companyData[0].address}, ${companyData[0].city}, ${companyData[0].state}`);
        }
        
        if (companyData.length > 0) {
          setCompany(companyData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVisits = async () => {
    try {
      const visitsData = await base44.entities.Visit.filter({
        company_id: companyId,
        scheduled_date: selectedDate,
        assigned_to: selectedUser,
        status: { $in: ['scheduled', 'in_progress', 'open'] }
      });
      setVisits(visitsData);
      setOptimizedRoute(null);
      setShowOptimized(false);
    } catch (error) {
      console.error('Error loading visits:', error);
    }
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);

  const handleOptimizeRoute = async () => {
    if (visits.length === 0) return;

    setOptimizing(true);
    try {
      const stops = visits
        .map(visit => {
          const property = getProperty(visit.property_id);
          if (!property?.latitude || !property?.longitude) return null;

          return {
            id: visit.id,
            name: property.name || property.address,
            address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
            lat: property.latitude,
            lng: property.longitude,
            scheduled_time: visit.scheduled_time
          };
        })
        .filter(Boolean);

      if (stops.length === 0) {
        alert('No visits have valid coordinates');
        setOptimizing(false);
        return;
      }

      const response = await base44.functions.invoke('optimizeRoute', {
        stops,
        startAddress
      });

      setOptimizedRoute(response.data);
      setShowOptimized(true);
    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const hasAccess = ['growth', 'professional', 'enterprise'].includes(company?.subscription_plan);

  if (!hasAccess) {
    return (
      <div>
        <PageHeader
          title="Route Optimizer"
          subtitle="Plan efficient routes for your inspections"
          backLink="Schedule"
          backLabel="Back to Schedule"
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Professional Plan Required</h3>
              <p className="text-sm text-amber-800 mb-4">
                Route Optimization requires Growth, Professional, or Enterprise plan.
              </p>
              <a href={createPageUrl('Pricing')}>
                <Button className="bg-amber-600 hover:bg-amber-700">View Plans</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mapStops = visits.map((visit, idx) => {
    const property = getProperty(visit.property_id);
    return {
      order: idx + 1,
      name: property?.name || property?.address,
      address: `${property?.address}, ${property?.city}`,
      lat: property?.latitude,
      lng: property?.longitude
    };
  });

  return (
    <div>
      <PageHeader
        title="Route Optimizer"
        subtitle="Plan efficient routes for your inspections"
        backLink="Schedule"
        backLabel="Back to Schedule"
      />

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(m => (
                  <SelectItem key={m.id} value={m.user_email}>
                    {m.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Start Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder="Enter address"
              className="h-9"
            />
          </CardContent>
        </Card>
      </div>

      {/* Visits List */}
      {visits.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Visits ({visits.length})
              </CardTitle>
              <Button
                onClick={handleOptimizeRoute}
                disabled={optimizing}
                className="bg-slate-900 hover:bg-slate-800"
                size="sm"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Route className="h-4 w-4 mr-2" />
                    Optimize Route
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(showOptimized && optimizedRoute ? optimizedRoute.optimized_stops : visits).map((item, idx) => {
                const visit = showOptimized ? null : item;
                const stop = showOptimized ? item : null;
                const property = visit ? getProperty(visit.property_id) : null;

                return (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border">
                    <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {stop ? stop.order : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{stop ? stop.name : property?.name || property?.address}</p>
                      <p className="text-xs text-slate-500">{stop ? stop.address : `${property?.address}, ${property?.city}`}</p>
                    </div>
                    {visit?.scheduled_time && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
                        <Clock className="h-3 w-3" />
                        {visit.scheduled_time}
                      </div>
                    )}
                    {stop?.estimated_arrival && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 shrink-0">
                        <Clock className="h-3 w-3" />
                        ETA: {stop.estimated_arrival}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats - Only show when optimized */}
      {showOptimized && optimizedRoute && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Route Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{optimizedRoute.total_distance_miles || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Miles</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{optimizedRoute.total_drive_time_minutes || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      {visits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">
                  {showOptimized ? 'Optimized Route Map' : 'Properties Map'}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {showOptimized ? 'Best route based on location and time' : 'All properties for selected date'}
                </CardDescription>
              </div>
              {showOptimized && (
                <Button
                  variant="outline"
                  onClick={() => setShowOptimized(false)}
                  size="sm"
                >
                  Back to Overview
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[500px]">
            {showOptimized ? (
              <RouteMap
                stops={optimizedRoute.optimized_stops}
                startAddress={startAddress}
                isOptimized={true}
              />
            ) : (
              <StaticRouteMap
                stops={mapStops}
                startAddress={startAddress}
              />
            )}
          </CardContent>
        </Card>
      )}

      {visits.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-slate-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No visits scheduled</p>
              <p className="text-sm">Select a staff member and date to view visits</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}