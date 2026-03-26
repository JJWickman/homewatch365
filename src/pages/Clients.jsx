import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Users, Search, Plus, Building2, Mail, Phone, 
  MoreVertical, Edit, Trash2, Eye, Filter
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import DataTable from '@/components/shared/DataTable';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const user = await base44.auth.me();
      if (!user?.primary_tenant_id) {
        setLoading(false);
        return;
      }
      
      setCompanyId(user.primary_tenant_id);
      const [clientsData, propertiesData] = await Promise.all([
        base44.entities.Client.filter({ tenant_id: user.primary_tenant_id }, '-created_date'),
        base44.entities.Property.filter({ tenant_id: user.primary_tenant_id })
      ]);
        
      setClients(clientsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPropertyCount = (clientId) => {
    return properties.filter(p => p.client_id === clientId).length;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && client.is_active) ||
      (statusFilter === 'inactive' && !client.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteDialog.client) return;
    
    await base44.entities.Client.update(deleteDialog.client.id, { is_active: false });
    setDeleteDialog({ open: false, client: null });
    loadClients();
  };

  const columns = [
    {
      header: 'Client',
      cell: (client) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-slate-900 text-white text-sm">
              {getInitials(client.first_name, client.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate">
              {client.first_name} {client.last_name}
            </p>
            <p className="text-sm text-slate-500 truncate">{client.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Billing Address',
      cell: (client) => (
        <div className="text-sm text-slate-600">
          {client.address ? (
            <span>{client.address}{client.city ? `, ${client.city}` : ''}{client.state ? `, ${client.state}` : ''} {client.zip || ''}</span>
          ) : (
            <span className="text-slate-400 italic">—</span>
          )}
        </div>
      ),
      className: 'hidden lg:table-cell'
    },
    {
      header: 'Properties',
      cell: (client) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span>{getPropertyCount(client.id)}</span>
        </div>
      ),
      className: 'hidden md:table-cell'
    },
    {
      header: 'Service Tier',
      cell: (client) => (
        <span className="capitalize text-slate-600">{client.service_tier || 'Standard'}</span>
      ),
      className: 'hidden lg:table-cell'
    },
    {
      header: 'Billing',
      cell: (client) => (
        <StatusBadge status={client.billing_status || 'active'} />
      ),
      className: 'hidden lg:table-cell'
    },
    {
      header: 'Status',
      cell: (client) => (
        <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      header: '',
      cell: (client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(createPageUrl('ClientDetail') + `?id=${client.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(createPageUrl('ClientForm') + `?id=${client.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => setDeleteDialog({ open: true, client })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12'
    }
  ];

  return (
    <div className="pb-6">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} total clients`}
        action={() => navigate(createPageUrl('ClientForm'))}
        actionLabel="Add Client"
      />

      {/* Filters */}
      <Card className="mb-6 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table / Empty State */}
      {clients.length === 0 && !loading ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Start by adding your first client to manage their properties and inspections."
            action={() => navigate(createPageUrl('ClientForm'))}
            actionLabel="Add Client"
          />
        </Card>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <DataTable
              columns={columns}
              data={filteredClients}
              loading={loading}
              onRowClick={(client) => navigate(createPageUrl('ClientDetail') + `?id=${client.id}`)}
              emptyMessage="No clients match your search"
            />
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, client: null })}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Deactivate Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {deleteDialog.client?.first_name} {deleteDialog.client?.last_name}? 
              Their properties and history will be preserved but they will be hidden from active views.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, client: null })} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}