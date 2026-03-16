import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building2, Search, Plus, MapPin, User, 
  MoreVertical, Edit, Trash2, Eye, Calendar, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ViewToggle from '@/components/shared/ViewToggle';
import { useViewMode } from '@/components/shared/useViewMode';
import StaticRouteMap from '@/components/route/StaticRouteMap';

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [visits, setVisits] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [viewMode, setViewMode] = useViewMode('properties', 'large-tiles');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    // Subscribe to property updates
    const unsubscribe = base44.entities.Property.subscribe((event) => {
      if (event.type === 'update') {
        setProperties(prev => prev.map(p => p.id === event.id ? event.data : p));
      }
    });
    return unsubscribe;
  }, []);

  const loadProperties = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [propertiesData, clientsData, visitsData, checklistsData] = await Promise.all([
          base44.entities.Property.filter({ company_id: cId, is_active: true }, '-created_date'),
          base44.entities.Client.filter({ company_id: cId }),
          base44.entities.Visit.filter({ company_id: cId }),
          base44.entities.PropertyChecklist.filter({ company_id: cId, is_active: true })
        ]);
        
        setProperties(propertiesData);
        setClients(clientsData);
        setVisits(visitsData);
        setChecklists(checklistsData);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown';
  };

  const handleDeleteProperty = async (propertyId) => {
    setDeleting(true);
    try {
      await base44.entities.Property.update(propertyId, { is_active: false });
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting property:', error);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getVisitStatuses = (propertyId) => {
    const propertyVisits = visits.filter(v => v.property_id === propertyId);
    return {
      open: propertyVisits.filter(v => v.status === 'open' || v.status === 'scheduled').length,
      pending: propertyVisits.filter(v => v.status === 'in_progress').length,
      completed: propertyVisits.filter(v => v.status === 'completed').length
    };
  };

  const PropertyCard = ({ property, compact = false }) => {
    const statuses = getVisitStatuses(property.id);
    const hasChecklist = checklists.some(c => c.property_id === property.id);

    return (
      <Card 
        className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
      >
        <div className={`${compact ? 'aspect-square' : 'aspect-video'} bg-slate-100 relative cursor-pointer`} onClick={() => navigate(createPageUrl('PropertyDetail') + `?id=${property.id}`)}>
           {property.primary_photo_url ? (
             <img 
               src={property.primary_photo_url} 
               alt={property.name || property.address}
               className="w-full h-full object-cover"
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center">
               <Building2 className={`${compact ? 'h-8 w-8' : 'h-12 w-12'} text-slate-300`} />
             </div>
           )}
          <div className="absolute top-3 right-3 flex gap-2">
            {!hasChecklist && (
              <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-xs font-semibold">⚠ No Checklist</span>
            )}
            <StatusBadge status={property.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-white/90 hover:bg-white text-slate-700"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => navigate(createPageUrl('PropertyForm') + `?id=${property.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                     onClick={(e) => {
                       e.stopPropagation();
                       setDeleteConfirm(property.id);
                     }}
                     className="text-red-600"
                   >
                     <Trash2 className="h-4 w-4 mr-2" />
                     Deactivate
                   </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className={`flex-1 flex flex-col ${compact ? 'p-3' : 'p-4'}`}>
           <div className="cursor-pointer hover:opacity-80 transition-opacity mb-3" onClick={() => navigate(createPageUrl('PropertyDetail') + `?id=${property.id}`)}>
             <h3 className={`font-semibold text-slate-900 truncate ${compact ? 'text-sm' : ''}`}>
               {property.name || property.address}
             </h3>
             {!compact && (
               <>
                 <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                   <MapPin className="h-3.5 w-3.5" />
                   {property.city}, {property.state}
                 </div>
                 <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                   <User className="h-3.5 w-3.5" />
                   {getClientName(property.client_id)}
                 </div>
                 <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                   <Calendar className="h-3.5 w-3.5" />
                   <span className="capitalize">{property.inspection_frequency?.replace('_', '-') || 'Weekly'}</span>
                 </div>
               </>
             )}
           </div>

           {/* Visit Status Badges */}
           {!compact && (
             <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-100">
               {statuses.open > 0 && (
                 <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                   <Clock className="h-3 w-3" />
                   {statuses.open} Open
                 </div>
               )}
               {statuses.pending > 0 && (
                 <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium">
                   <AlertCircle className="h-3 w-3" />
                   {statuses.pending} Pending
                 </div>
               )}
               {statuses.completed > 0 && (
                 <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                   <CheckCircle2 className="h-3 w-3" />
                   {statuses.completed} Completed
                 </div>
               )}
               {statuses.open === 0 && statuses.pending === 0 && statuses.completed === 0 && (
                 <div className="text-xs text-slate-400 py-1">No visits</div>
               )}
             </div>
           )}
         </div>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle={`${properties.length} total properties`}
        action={() => navigate(createPageUrl('PropertyForm'))}
        actionLabel="Add Property"
      />

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="for_sale">For Sale</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant={showMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className={showMap ? "bg-slate-900 hover:bg-slate-800" : ""}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Map View
            </Button>
            <ViewToggle view={viewMode} onViewChange={setViewMode} isMobile={false} />
          </div>
        </div>
      </Card>

      {/* Map View */}
      {showMap && filteredProperties.length > 0 && (
        <div className="mb-6 space-y-4">
          <StaticRouteMap 
            stops={filteredProperties
              .filter(p => p.latitude && p.longitude)
              .map((p, index) => ({
                latitude: p.latitude,
                longitude: p.longitude,
                name: p.name || p.address,
                address: `${p.address}, ${p.city}, ${p.state}`
              }))}
          />
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Properties ({filteredProperties.filter(p => p.latitude && p.longitude).length})</h3>
            <div className="space-y-2">
              {filteredProperties
                .filter(p => p.latitude && p.longitude)
                .map((property, index) => (
                  <div 
                    key={property.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => navigate(createPageUrl('PropertyDetail') + `?id=${property.id}`)}
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{property.name || property.address}</p>
                      <p className="text-sm text-slate-500">{property.city}, {property.state}</p>
                    </div>
                    <StatusBadge status={property.status} />
                  </div>
                ))}
            </div>
            {filteredProperties.filter(p => !p.latitude || !p.longitude).length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{filteredProperties.filter(p => !p.latitude || !p.longitude).length} properties</strong> are missing GPS coordinates and won't appear on the map. 
                  Use Settings → Admin → Geocode All to fix this.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Properties Grid / Empty State - Only show when map is hidden */}
      {!showMap && properties.length === 0 && !loading ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add your first property to start scheduling inspections."
            action={() => navigate(createPageUrl('PropertyForm'))}
            actionLabel="Add Property"
          />
        </Card>
      ) : !showMap && loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-slate-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : !showMap && filteredProperties.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No properties match your search
        </Card>
      ) : !showMap && viewMode === 'list' ? (
        <Card>
          <div className="divide-y">
            {/* Header Row */}
            <div className="p-4 flex items-center justify-between bg-slate-50 border-b border-slate-200">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Property</p>
              </div>
              <div className="w-32">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</p>
              </div>
              <div className="w-16">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</p>
              </div>
            </div>
            {/* Data Rows */}
            {filteredProperties.map((property) => (
              <div 
                key={property.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate(createPageUrl('PropertyDetail') + `?id=${property.id}`)}
              >
                <div className="flex-1">
                 <div className="flex items-center gap-2">
                   <h3 className="font-semibold text-slate-900">
                     {property.name || property.address}
                   </h3>
                   {!checklists.some(c => c.property_id === property.id) && (
                     <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-xs font-semibold">⚠ No Checklist</span>
                   )}
                 </div>
                 <p className="text-sm text-slate-500">
                   {property.city}, {property.state} • {getClientName(property.client_id)}
                 </p>
                </div>
                <div className="w-32">
                 <StatusBadge status={property.status} />
                </div>
                <div className="w-16">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(createPageUrl('PropertyForm') + `?id=${property.id}`);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : !showMap ? (
        <div className={`grid gap-6 ${
          viewMode === 'large-tiles' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}>
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} compact={viewMode === 'small-tiles'} />
          ))}
        </div>
      ) : null}

      {/* Deactivate Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Deactivate Property?</h2>
              <p className="text-sm text-slate-600 mb-6">
                This property will be hidden from active views. All data and history will be preserved.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteProperty(deleteConfirm)}
                  disabled={deleting}
                >
                  {deleting ? 'Deactivating...' : 'Deactivate'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}