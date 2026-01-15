import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle as AlertIcon } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

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

export default function AdminConsole() {
  const [companyId, setCompanyId] = useState(null);
  const [user, setUser] = useState(null);
  const [customTypes, setCustomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ name: '', slug: '', description: '', is_active: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is admin
      if (currentUser.role !== 'admin') {
        return;
      }

      const members = await base44.entities.CompanyMember.filter({ user_email: currentUser.email });
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);

        const customTypesData = await base44.entities.CustomContractorType.filter({ company_id: cId });
        setCustomTypes(customTypesData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = () => {
    setEditingTypeId(null);
    setTypeFormData({ name: '', slug: '', description: '', is_active: true });
    setShowNewTypeDialog(true);
  };

  const handleEditType = (type) => {
    setEditingTypeId(type.id);
    setTypeFormData(type);
    setShowNewTypeDialog(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  };

  const handleSaveType = async () => {
    if (!typeFormData.name.trim()) {
      return;
    }

    const slug = typeFormData.slug || generateSlug(typeFormData.name);

    try {
      if (editingTypeId) {
        await base44.entities.CustomContractorType.update(editingTypeId, {
          ...typeFormData,
          slug
        });
      } else {
        // Check for duplicates
        const exists = customTypes.some(t => t.slug === slug);
        if (exists) {
          alert('A contractor type with this name already exists');
          return;
        }

        await base44.entities.CustomContractorType.create({
          ...typeFormData,
          slug,
          company_id: companyId
        });
      }
      setShowNewTypeDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error saving contractor type:', error);
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm('Are you sure you want to delete this contractor type?')) {
      try {
        await base44.entities.CustomContractorType.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting contractor type:', error);
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

  // Only allow admins
  if (!user || user.role !== 'admin') {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Admin Console"
          subtitle="Administrative tools and settings"
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Access Denied</p>
                <p className="text-sm text-amber-800 mt-1">Only administrators can access this console.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Console"
        subtitle="Manage system-wide settings and customizations"
      />

      <Tabs defaultValue="contractor-types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contractor-types">Contractor Types</TabsTrigger>
        </TabsList>

        {/* Contractor Types Tab */}
        <TabsContent value="contractor-types" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contractor Types</CardTitle>
                  <CardDescription>Manage custom contractor types for your company</CardDescription>
                </div>
                <Button 
                  onClick={handleAddType}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Default Types Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Default Types Available</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CONTRACTOR_TYPES.map(type => (
                      <span key={type} className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Custom Types */}
                {customTypes.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Custom Types ({customTypes.length})</p>
                    <div className="grid gap-2">
                      {customTypes.map(type => (
                        <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{type.name}</p>
                            {type.description && (
                              <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">Slug: <code className="bg-slate-100 px-1 py-0.5 rounded">{type.slug}</code></p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs px-2 py-1 rounded ${type.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditType(type)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteType(type.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-6 text-sm">No custom contractor types added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New/Edit Contractor Type Dialog */}
      <Dialog open={showNewTypeDialog} onOpenChange={setShowNewTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTypeId ? 'Edit Contractor Type' : 'Add Contractor Type'}</DialogTitle>
            <DialogDescription>
              {editingTypeId ? 'Update the contractor type information' : 'Create a new custom contractor type'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type Name *</Label>
              <Input
                value={typeFormData.name}
                onChange={(e) => {
                  setTypeFormData({ 
                    ...typeFormData, 
                    name: e.target.value,
                    slug: !editingTypeId ? generateSlug(e.target.value) : typeFormData.slug
                  });
                }}
                placeholder="e.g., Roofing Specialist"
              />
            </div>

            <div>
              <Label>Slug (URL-friendly) *</Label>
              <Input
                value={typeFormData.slug}
                onChange={(e) => setTypeFormData({ ...typeFormData, slug: e.target.value })}
                placeholder="e.g., roofing_specialist"
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">Used internally to identify the type</p>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={typeFormData.description}
                onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                placeholder="What does this contractor type do?"
                className="min-h-20"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={typeFormData.is_active}
                onChange={(e) => setTypeFormData({ ...typeFormData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="mb-0 text-sm">Active (available for selection)</Label>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowNewTypeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveType}
                disabled={!typeFormData.name.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {editingTypeId ? 'Update' : 'Add'} Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}