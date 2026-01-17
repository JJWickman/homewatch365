import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { 
  MapPin, Navigation, Clock, Cloud, Car, Route, 
  ExternalLink, Loader2, RefreshCw, ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '@/components/shared/PageHeader';
import RouteMap from '@/components/route/RouteMap';
import { createPageUrl } from '@/utils';

export default function RouteOptimizer() {
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [inspections, setInspections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [startAddress, setStartAddress] = useState('');
  const [company, setCompany] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (companyId && selectedUser) {
      loadInspectionsForDate();
    }
  }, [selectedDate, companyId, selectedUser]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setSelectedUser(user.email);
      
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [propertiesData, teamMembersData, companyData] = await Promise.all([
          base44.entities.Property.filter({ company_id: cId }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true }),
          base44.entities.Company.filter({ id: cId })
        ]);
        
        setProperties(propertiesData);
        setTeamMembers(teamMembersData);
        if (companyData.length > 0) {
          setCompany(companyData[0]);
        }
        
        // Use user's Base HQ address if available, otherwise fall back to company address
        if (user.base_hq_address && user.base_hq_address.address) {
          setStartAddress(`${user.base_hq_address.address}, ${user.base_hq_address.city}, ${user.base_hq_address.state}`);
        } else {
          const companyData = await base44.entities.Company.filter({ id: cId });
          if (companyData.length > 0 && companyData[0].address) {
            setStartAddress(`${companyData[0].address}, ${companyData[0].city}, ${companyData[0].state}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInspectionsForDate = async () => {
    const visitsData = await base44.entities.Visit.filter({ 
      company_id: companyId, 
      scheduled_date: selectedDate,
      assigned_to: selectedUser,
      status: { $in: ['scheduled', 'in_progress', 'open'] }
    });
    
    setInspections(visitsData);
    setOptimizedRoute(null);
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);

  const optimizeRoute = async () => {
    if (inspections.length === 0) return;
    
    setOptimizing(true);
    try {
      const stops = inspections.map(visit => {
        const property = getProperty(visit.property_id);
        const address = `${property?.address}, ${property?.city}, ${property?.state} ${property?.zip}`;
        const time = visit.scheduled_time;
        
        return {
          id: visit.id,
          type: visit.visit_type,
          name: property?.name || property?.address,
          address,
          scheduled_time: time,
          lat: property?.latitude,
          lng: property?.longitude
        };
      }).filter(s => s.address && s.lat && s.lng);
      
      console.log('Stops for optimization:', stops);

      const response = await base44.functions.invoke('optimizeRoute', {
        stops,
        startAddress
      });

      const result = response.data;
      
      console.log('Optimized route:', result);

      setOptimizedRoute({
        ...result,
        start_address: startAddress
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const generateNavigationUrl = (app) => {
    if (!optimizedRoute || optimizedRoute.optimized_stops.length === 0) return '#';
    
    const stops = optimizedRoute.optimized_stops;
    const waypoints = stops.map(s => encodeURIComponent(s.address));
    const destination = waypoints[waypoints.length - 1];
    const waypointsStr = waypoints.slice(0, -1).join('|');
    
    switch (app) {
      case 'google':
        if (stops.length === 1) {
          return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypointsStr}&travelmode=driving`;
      
      case 'waze':
        // Waze only supports single destination, so use first stop
        return `https://waze.com/ul?q=${waypoints[0]}&navigate=yes`;
      
      case 'apple':
        const appleStops = stops.map(s => s.address).join('&daddr=');
        return `http://maps.apple.com/?daddr=${appleStops}`;
      
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // Check if user has Professional or Enterprise plan
  const hasAccess = company?.subscription_plan === 'professional' || company?.subscription_plan === 'enterprise';

  if (!hasAccess) {
    return (
      <div>
        <PageHeader
          title="Route Optimizer"
          subtitle="Plan the most efficient route for your inspections"
          backLink="Schedule"
          backLabel="Back to Schedule"
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Professional Plan Required</h3>
              <p className="text-sm text-amber-800 mb-4">
                Route Optimization is available on Professional and Enterprise plans. Upgrade your subscription to unlock this feature.
              </p>
              <a href={createPageUrl('Pricing')} className="inline-block">
                <Button className="bg-amber-600 hover:bg-amber-700">View Pricing Plans</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Route Optimizer"
        subtitle="Plan the most efficient route for your inspections"
        backLink="Schedule"
        backLabel="Back to Schedule"
      />

      {/* Top Row - Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* User Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create Optimized Route For:</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedUser || ''} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.user_email}>
                    {member.user_name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Date & Start Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Route Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Starting Location</Label>
              <Input
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                placeholder="Enter address"
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits & Route Summary */}
      <div className="mb-6 space-y-6">

        {/* Visits List - Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span>Visits ({inspections.length})</span>
                {optimizedRoute && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    Optimized
                  </Badge>
                )}
              </CardTitle>
              <Button 
                onClick={optimizeRoute} 
                disabled={inspections.length === 0 || optimizing || !inspections.every(v => {
                  const prop = getProperty(v.property_id);
                  return prop?.latitude && prop?.longitude;
                })}
                className="bg-slate-900 hover:bg-slate-800"
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
            {inspections.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No visits scheduled for this date
              </p>
            ) : optimizedRoute ? (
              <div className="space-y-2">
                {optimizedRoute.optimized_stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                      {stop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{stop.name}</p>
                      <p className="text-xs text-slate-500">{stop.address}</p>
                    </div>
                    {stop.estimated_arrival && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{stop.estimated_arrival}</span>
                      </div>
                    )}
                    {stop.drive_time_minutes && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 shrink-0">
                        <span>{stop.drive_time_minutes} min</span>
                        {stop.distance_miles && <span>{stop.distance_miles} mi</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {inspections.map((visit, index) => {
                  const property = getProperty(visit.property_id);
                  const time = visit.scheduled_time;
                  const label = visit.visit_type === 'inspection' ? 'Inspection' : 'Follow-Up';
                  return (
                    <div key={visit.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{property?.name || property?.address}</p>
                        <p className="text-xs text-slate-500">{property?.address}, {property?.city}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {label}
                      </Badge>
                      {time && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
                          <Clock className="h-3 w-3" />
                          <span>{time}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Summary - Full Width */}
        {optimizedRoute && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Route Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    {optimizedRoute.total_distance_miles || '—'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Total Miles</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    {optimizedRoute.total_drive_time_minutes || '—'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Total Minutes</p>
                </div>

                {optimizedRoute.weather_advisory && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Cloud className="h-5 w-5" />
                      <span className="font-medium text-sm">Weather</span>
                    </div>
                    <p className="text-xs text-blue-600">{optimizedRoute.weather_advisory}</p>
                  </div>
                )}

                {optimizedRoute.traffic_notes && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <Car className="h-5 w-5" />
                      <span className="font-medium text-sm">Traffic</span>
                    </div>
                    <p className="text-xs text-amber-600">{optimizedRoute.traffic_notes}</p>
                  </div>
                )}

                {optimizedRoute.recommendations && (
                  <div className="p-4 bg-slate-50 rounded-lg lg:col-span-2">
                    <p className="font-medium text-sm mb-2">Recommendations</p>
                    <p className="text-xs text-slate-600">{optimizedRoute.recommendations}</p>
                  </div>
                )}

                <div className="p-4 border rounded-lg lg:col-span-2">
                  <p className="text-sm font-medium mb-3">Open in Navigation App</p>
                  <div className="grid grid-cols-3 gap-3">
                    <a
                      href={generateNavigationUrl('google')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <img src="https://www.google.com/images/branding/product/2x/maps_96dp.png" alt="Google Maps" className="h-8 w-8" />
                      <span className="text-xs font-medium">Google</span>
                    </a>
                    <a
                      href={generateNavigationUrl('waze')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <img src="https://www.waze.com/favicon.ico" alt="Waze" className="h-8 w-8" />
                      <span className="text-xs font-medium">Waze</span>
                    </a>
                    <a
                      href={generateNavigationUrl('apple')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <img src="https://www.apple.com/favicon.ico" alt="Apple Maps" className="h-8 w-8" />
                      <span className="text-xs font-medium">Apple</span>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full Width Map */}
      <Card>
        <CardContent className="p-0 h-[500px]">
          <RouteMap
            stops={optimizedRoute?.optimized_stops || inspections.map((visit, idx) => {
              const property = getProperty(visit.property_id);
              return {
                order: idx + 1,
                name: property?.name || property?.address,
                address: `${property?.address}, ${property?.city}`,
                lat: property?.latitude,
                lng: property?.longitude
              };
            })}
            startAddress={startAddress}
            isOptimized={!!optimizedRoute}
          />
        </CardContent>
      </Card>
    </div>
  );
}