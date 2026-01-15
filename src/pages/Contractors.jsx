import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Plus, Search, Filter, Phone, Mail, MapPin, Badge, 
  Edit, Trash2, MoreVertical, ChevronDown, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import ContractorSearchDialog from '@/components/contractors/ContractorSearchDialog';

const DEFAULT_CONTRACTOR_TYPES = [
  'electrician',
  'hvac',
  'roofer',
  'plumber',
  'pool_service',
  'landscaping',
  'painter',
  'carpenter',
  'general_contractor',
  'pest_control',
  'cleaning',
  'security',
  'other'
];

export default function Contractors() {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [filteredContractors, setFilteredContractors] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [customTypes, setCustomTypes] = useState([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    contractor_type: 'general_contractor',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    license_number: '',
    insurance_info: '',
    hourly_rate: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContractors();
  }, [contractors, searchQuery, typeFilter, statusFilter]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [contractorsData, customTypesData, propertiesData] = await Promise.all([
          base44.entities.Contractor.filter({ company_id: cId }),
          base44.entities.CustomContractorType.filter({ company_id: cId }),
          base44.entities.Property.filter({ company_id: cId })
        ]);
        setContractors(contractorsData);
        setCustomTypes(customTypesData);
        setProperties(propertiesData);
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContractorTypeOptions = () => {
    return [
      ...DEFAULT_CONTRACTOR_TYPES,
      ...customTypes.filter(t => t.is_active).map(t => t.slug)
    ];
  };

  const filterContractors = () => {
    let filtered = contractors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.business_name.toLowerCase().includes(query) ||
        c.contact_name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.contractor_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c =>
        statusFilter === 'active' ? c.is_active : !c.is_active
      );
    }

    setFilteredContractors(filtered);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      business_name: '',
      contact_name: '',
      contractor_type: 'general_contractor',
      email: '',
      phone: '',
      secondary_phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      license_number: '',
      insurance_info: '',
      hourly_rate: '',
      notes: '',
      is_active: true
    });
    setShowNewDialog(true);
  };

  const handleSearchResult = (contractor) => {
    setFormData(contractor);
    setShowSearchDialog(false);
    setShowNewDialog(true);
  };

  const handleEdit = (contractor) => {
    setEditingId(contractor.id);
    setFormData(contractor);
    setShowNewDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await base44.entities.Contractor.update(editingId, formData);
      } else {
        await base44.entities.Contractor.create({
          ...formData,
          company_id: companyId,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
        });
      }
      setShowNewDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error saving contractor:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contractor?')) {
      try {
        await base44.entities.Contractor.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting contractor:', error);
      }
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
        title="Contractors"
        subtitle="Manage your contractor network"
        action={handleAddNew}
        actionLabel="Add Contractor"
      >
        <Button 
          variant="outline"
          onClick={() => setShowSearchDialog(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          Search External
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getContractorTypeOptions().map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contractors Grid */}
      {filteredContractors.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title={contractors.length === 0 ? "No contractors yet" : "No contractors match your search"}
          description={contractors.length === 0 ? "Add your first contractor to get started" : "Try adjusting your filters"}
          action={contractors.length === 0 ? handleAddNew : undefined}
          actionLabel={contractors.length === 0 ? "Add Contractor" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContractors.map((contractor) => (
            <Card key={contractor.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{contractor.business_name}</CardTitle>
                    <p className="text-sm text-slate-500 truncate">{contractor.contact_name}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(contractor)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(contractor.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <BadgeComponent variant="outline" className="capitalize">
                    {contractor.contractor_type.replace(/_/g, ' ')}
                  </BadgeComponent>
                  {contractor.is_active ? (
                    <BadgeComponent className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </BadgeComponent>
                  ) : (
                    <BadgeComponent className="bg-slate-50 text-slate-600 border-slate-200">
                      Inactive
                    </BadgeComponent>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contractor.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a href={`tel:${contractor.phone}`} className="hover:text-blue-600">
                      {contractor.phone}
                    </a>
                  </div>
                )}
                {contractor.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${contractor.email}`} className="hover:text-blue-600">
                      {contractor.email}
                    </a>
                  </div>
                )}
                {contractor.address && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{contractor.address}, {contractor.city}, {contractor.state} {contractor.zip}</span>
                  </div>
                )}
                {contractor.hourly_rate && (
                  <div className="text-slate-600 pt-2">
                    <span className="font-medium">${contractor.hourly_rate}/hr</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New/Edit Contractor Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Contractor' : 'Add New Contractor'}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'Update contractor information' : 'Add a new contractor to your network'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Business Name *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Primary contact"
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select 
                  value={formData.contractor_type} 
                  onValueChange={(value) => setFormData({ ...formData, contractor_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getContractorTypeOptions().map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hourly Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Secondary Phone</Label>
                <Input
                  value={formData.secondary_phone}
                  onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                  placeholder="(555) 123-4568"
                />
              </div>
              <div>
                <Label>License Number</Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="License #"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  maxLength="2"
                />
              </div>
              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  placeholder="12345"
                />
              </div>
            </div>

            <div>
              <Label>Insurance Info</Label>
              <Input
                value={formData.insurance_info}
                onChange={(e) => setFormData({ ...formData, insurance_info: e.target.value })}
                placeholder="Insurance details"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                className="min-h-20"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="mb-0">Active contractor</Label>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.business_name || !formData.contractor_type}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {editingId ? 'Update' : 'Add'} Contractor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Contractors Dialog */}
      <ContractorSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSelect={handleSearchResult}
        properties={properties}
        companyId={companyId}
      />
    </div>
  );
}