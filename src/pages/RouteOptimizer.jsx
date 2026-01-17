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
        
        const [propertiesData, teamMembersData] = await Promise.all([
          base44.entities.Property.filter({ company_id: cId }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true })
        ]);
        
        setProperties(propertiesData);
        setTeamMembers(teamMembersData);
        
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
    const [inspectionsData, followUpsData] = await Promise.all([
      base44.entities.Inspection.filter({ 
        company_id: companyId, 
        scheduled_date: selectedDate,
        assigned_to: selectedUser,
        status: { $in: ['scheduled', 'in_progress'] }
      }),
      base44.entities.FollowUp.filter({
        company_id: companyId,
        assigned_to: selectedUser,
        due_date: selectedDate,
        status: { $in: ['open', 'in_progress'] }
      })
    ]);
    
    // Combine inspections and follow-ups into a single list
    const combined = [
      ...inspectionsData.map(i => ({ ...i, type: 'inspection' })),
      ...followUpsData.map(f => ({ ...f, type: 'followup' }))
    ];
    
    setInspections(combined);
    setOptimizedRoute(null);
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);

  const optimizeRoute = async () => {
    if (inspections.length === 0) return;
    
    setOptimizing(true);
    try {
      const stops = inspections.map(i => {
        let property, address, time;
        
        if (i.type === 'inspection') {
          property = getProperty(i.property_id);
          address = `${property?.address}, ${property?.city}, ${property?.state} ${property?.zip}`;
          time = i.scheduled_time;
        } else {
          property = getProperty(i.property_id);
          address = `${property?.address}, ${property?.city}, ${property?.state} ${property?.zip}`;
          time = i.due_time;
        }
        
        return {
          id: i.id,
          type: i.type,
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
                disabled={inspections.length === 0 || optimizing}
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {optimizedRoute.optimized_stops.map((stop, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                      {stop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{stop.name}</p>
                      <p className="text-xs text-slate-500 truncate">{stop.address}</p>
                      {stop.estimated_arrival && (
                        <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stop.estimated_arrival}
                        </p>
                      )}
                      {stop.drive_time_minutes && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                          <span>{stop.drive_time_minutes} min</span>
                          {stop.distance_miles && <span>• {stop.distance_miles} mi</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {inspections.map((item, index) => {
                  const property = getProperty(item.property_id);
                  const time = item.type === 'inspection' ? item.scheduled_time : item.due_time;
                  const label = item.type === 'inspection' ? 'Inspection' : 'Follow-Up';
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-sm truncate">{property?.name || property?.address}</p>
                          <Badge variant="outline" className="text-xs w-fit">
                            {label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {property?.address}, {property?.city}
                        </p>
                        {time && (
                          <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {time}
                          </p>
                        )}
                      </div>
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
            stops={optimizedRoute?.optimized_stops || inspections.map((i, idx) => {
              const property = getProperty(i.property_id);
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