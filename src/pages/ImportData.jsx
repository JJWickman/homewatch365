import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Building2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from '@/components/shared/PageHeader';
import ImportWizard from '@/components/import/ImportWizard';

export default function ImportData() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setCompanyId(members[0].company_id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartImport = (entityType) => {
    setSelectedEntity(entityType);
    setShowImport(true);
  };

  const handleImportComplete = () => {
    setShowImport(false);
    setSelectedEntity(null);
    
    // Navigate to appropriate page
    if (selectedEntity === 'Client') {
      navigate(createPageUrl('Clients'));
    } else if (selectedEntity === 'Property') {
      navigate(createPageUrl('Properties'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Import Data"
        subtitle="Upload spreadsheets to bulk import clients and properties"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Import Clients */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Import Clients</CardTitle>
                <CardDescription className="text-xs">Upload client data from spreadsheet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-slate-700">Required Fields:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>First Name</li>
                <li>Last Name</li>
                <li>Email</li>
              </ul>
              <p className="font-medium text-slate-700 mt-3">Optional Fields:</p>
              <p className="text-slate-600">Phone, Address, City, State, ZIP, Notes, Tags</p>
              <p className="text-xs text-purple-600 mt-2">✨ Any unmapped columns will be saved as custom fields</p>
            </div>
            <Button 
              onClick={() => handleStartImport('Client')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Import Clients
            </Button>
          </CardContent>
        </Card>

        {/* Import Properties */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Import Properties</CardTitle>
                <CardDescription className="text-xs">Upload property data from spreadsheet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-slate-700">Required Fields:</p>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Address</li>
              </ul>
              <p className="font-medium text-slate-700 mt-3">Optional Fields:</p>
              <p className="text-slate-600">Name, City, State, ZIP, Property Type, Bedrooms, Bathrooms, Square Feet, Year Built, Notes</p>
              <p className="text-xs text-purple-600 mt-2">✨ Any unmapped columns will be saved as custom fields</p>
            </div>
            <Button 
              onClick={() => handleStartImport('Property')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Import Properties
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="mt-6 max-w-4xl bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Tips for Importing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>• <strong>CSV or Excel files</strong> are supported (.csv, .xlsx, .xls)</p>
          <p>• <strong>First row should contain column headers</strong></p>
          <p>• <strong>Custom fields:</strong> Any columns not mapped to standard fields will be stored as custom fields</p>
          <p>• <strong>Validation:</strong> Data will be validated before import - you'll see any errors before committing</p>
          <p>• <strong>Large imports:</strong> Can handle hundreds of records at once</p>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import {selectedEntity}s</DialogTitle>
          </DialogHeader>
          {selectedEntity && (
            <ImportWizard
              entityType={selectedEntity}
              companyId={companyId}
              onComplete={handleImportComplete}
              onCancel={() => setShowImport(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}