import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Route, Loader2, Clock, MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PageHeader from '@/components/shared/PageHeader';
import { createPageUrl } from '@/utils';
import StaticRouteMap from '@/components/route/StaticRouteMap';

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
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startType, setStartType] = useState('home');
  const [customStartAddress, setCustomStartAddress] = useState('');

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

  const handleOptimizeRoute = () => {
    if (visits.length === 0) return;
    setShowStartDialog(true);
  };

  const confirmOptimizeRoute = async () => {
    const finalStartAddress = startType === 'home' ? startAddress : customStartAddress;
    
    if (!finalStartAddress) {
      alert('Please enter a start address');
      return;
    }

    setShowStartDialog(false);
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
        startAddress: finalStartAddress
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

  const exportToGoogleMaps = () => {
    if (!optimizedRoute?.optimized_stops) return;
    
    const finalStartAddress = startType === 'home' ? startAddress : customStartAddress;
    const encodedStart = encodeURIComponent(finalStartAddress);
    
    const waypoints = optimizedRoute.optimized_stops
      .map(stop => encodeURIComponent(`${stop.lat},${stop.lng}`))
      .join('/');
    
    const url = `https://www.google.com/maps/dir/${encodedStart}/${waypoints}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <PageHeader
        title="Route Optimizer"
        subtitle="Plan efficient routes for your inspections"
        backLink="Schedule"
        backLabel="Back to Schedule"
      />

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
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
      </div>

      {/* Scheduled Visits */}
      {visits.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Scheduled Visits ({visits.length})</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visits.map((visit, idx) => {
                const property = getProperty(visit.property_id);
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border">
                    <div className="h-8 w-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{property?.name || property?.address}</p>
                      <p className="text-xs text-slate-500">{property?.address}, {property?.city}</p>
                    </div>
                    {visit.scheduled_time && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
                        <Clock className="h-3 w-3" />
                        {visit.scheduled_time}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimized Route */}
      {showOptimized && optimizedRoute && (
        <>
          {/* Map */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Route Map</CardTitle>
            </CardHeader>
            <CardContent>
              <StaticRouteMap 
                stops={optimizedRoute.optimized_stops.map(stop => ({
                  ...stop,
                  property_name: stop.name
                }))} 
                startAddress={startType === 'home' ? startAddress : customStartAddress}
              />
            </CardContent>
          </Card>

          {/* Route List */}
          <Card className="mb-6 border-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Optimized Route</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Optimized based on scheduled times and locations
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToGoogleMaps}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowOptimized(false)}
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {optimizedRoute.optimized_stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border border-slate-900">
                    <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {stop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{stop.name}</p>
                      <p className="text-xs text-slate-500">{stop.address}</p>
                    </div>
                    {stop.scheduled_time && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
                        <Clock className="h-3 w-3" />
                        {stop.scheduled_time}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Summary Stats - Only show when optimized */}
      {showOptimized && optimizedRoute && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Route Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{optimizedRoute.total_distance_miles || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Total Miles</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{optimizedRoute.optimized_stops?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Stops</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${
                optimizedRoute.fits_in_business_hours 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {optimizedRoute.fits_in_business_hours ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <p className={`text-sm font-semibold ${
                    optimizedRoute.fits_in_business_hours ? 'text-green-900' : 'text-amber-900'
                  }`}>
                    {optimizedRoute.fits_in_business_hours ? 'On Schedule' : 'Over Schedule'}
                  </p>
                </div>
                <p className="text-xs text-slate-600">8am - 5pm window</p>
              </div>
            </div>
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

      {/* Start Location Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Start Location</DialogTitle>
            <DialogDescription>
              Where will you be starting your route from?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div
                onClick={() => setStartType('home')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  startType === 'home' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border-2 ${
                    startType === 'home' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                  } flex items-center justify-center`}>
                    {startType === 'home' && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Home Address</p>
                    <p className="text-sm text-slate-500">{startAddress || 'Your default start location'}</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStartType('other')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  startType === 'other' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border-2 ${
                    startType === 'other' ? 'border-slate-900 bg-slate-900' : 'border-slate-300'
                  } flex items-center justify-center`}>
                    {startType === 'other' && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Other Location</p>
                    <p className="text-sm text-slate-500">Enter a custom start address</p>
                  </div>
                </div>
              </div>
            </div>

            {startType === 'other' && (
              <div className="space-y-2">
                <Label>Start Address</Label>
                <Input
                  value={customStartAddress}
                  onChange={(e) => setCustomStartAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowStartDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmOptimizeRoute}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Optimize Route
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}