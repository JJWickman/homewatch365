import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Building2, Search, Plus, MapPin, User, 
  MoreVertical, Edit, Trash2, Eye, Calendar
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

export default function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [propertiesData, clientsData] = await Promise.all([
          base44.entities.Property.filter({ company_id: cId, is_active: true }, '-created_date'),
          base44.entities.Client.filter({ company_id: cId })
        ]);
        
        setProperties(propertiesData);
        setClients(clientsData);
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

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const PropertyCard = ({ property }) => (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(createPageUrl('PropertyDetail') + `?id=${property.id}`)}
    >
      <div className="aspect-video bg-slate-100 relative">
        {property.primary_photo_url ? (
          <img 
            src={property.primary_photo_url} 
            alt={property.name || property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={property.status} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 truncate">
          {property.name || property.address}
        </h3>
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
      </div>
    </Card>
  );

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
        <div className="flex flex-col sm:flex-row gap-4">
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
        </div>
      </Card>

      {/* Properties Grid / Empty State */}
      {properties.length === 0 && !loading ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add your first property to start scheduling inspections."
            action={() => navigate(createPageUrl('PropertyForm'))}
            actionLabel="Add Property"
          />
        </Card>
      ) : loading ? (
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
      ) : filteredProperties.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No properties match your search
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}