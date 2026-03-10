import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import InspectionTemplates from '@/components/settings/InspectionTemplates';

export default function TemplatesTab({ companyId, templates = [], onRefresh, isAdmin }) {
  const [seeding, setSeeding] = useState(false);

  const handleAddStandardTemplate = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedStandardTemplates', {});
      onRefresh?.();
    } catch (error) {
      console.error('Error seeding templates:', error);
    } finally {
      setSeeding(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-500">Only administrators can manage templates.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 mb-4">No templates yet. Would you like to add the standard Single Family Home Checklist?</p>
            <Button 
              onClick={handleAddStandardTemplate}
              disabled={seeding}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              {seeding ? 'Adding...' : 'Add Standard Template'}
            </Button>
          </CardContent>
        </Card>
      )}
      <InspectionTemplates 
        companyId={companyId} 
        templates={templates} 
        onRefresh={onRefresh}
      />
    </div>
  );
}