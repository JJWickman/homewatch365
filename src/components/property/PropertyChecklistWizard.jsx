import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Building, Home, Building2, X, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PROPERTY_TYPE_MAP = {
  'single_family': { key: 'sfh', title: 'Single Family Home', icon: Home, color: 'bg-blue-500' },
  'condo': { key: 'condo', title: 'Condo / Villa', icon: Building, color: 'bg-purple-500' },
  'townhouse': { key: 'condo', title: 'Townhouse', icon: Building, color: 'bg-purple-500' },
  'estate': { key: 'sfh', title: 'Estate', icon: Home, color: 'bg-blue-500' },
  'commercial': { key: 'highrise', title: 'Commercial', icon: Building2, color: 'bg-emerald-500' },
};

export default function PropertyChecklistWizard({ property, onClose, onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [checklistName, setChecklistName] = useState('');
  const [customSections, setCustomSections] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Three standard templates
  const STANDARD_TEMPLATES = [
    { id: 'sfh-template', name: 'Single Family Home', description: 'Standard checklist for single family homes and estates', propertyTypes: ['single_family', 'estate'] },
    { id: 'condo-template', name: 'Condo / Villa', description: 'Checklist for condos, villas, and townhouses', propertyTypes: ['condo', 'townhouse'] },
    { id: 'highrise-template', name: 'Commercial / Multi-Family', description: 'Checklist for commercial properties and high-rise buildings', propertyTypes: ['commercial'] },
  ];

  useEffect(() => {
    // Auto-select template based on property type
    const autoSelected = STANDARD_TEMPLATES.find(t => 
      t.propertyTypes.includes(property.property_type)
    );
    setTemplates(STANDARD_TEMPLATES);
    if (autoSelected) {
      setSelectedTemplate(autoSelected);
    } else {
      setSelectedTemplate(STANDARD_TEMPLATES[0]);
    }
    setLoadingTemplates(false);
  }, []);

  const propertyTypeInfo = PROPERTY_TYPE_MAP[property.property_type] || PROPERTY_TYPE_MAP['single_family'];
  const TypeIcon = propertyTypeInfo.icon;

  const handleCreateChecklist = async () => {
    if (!checklistName.trim() || !selectedTemplate) return;
    
    setCreating(true);
    try {
      // Create property-specific checklist with selected standard template
      const newChecklist = await base44.entities.PropertyChecklist.create({
        company_id: property.company_id,
        property_id: property.id,
        template_id: selectedTemplate.id,
        name: checklistName,
        description: `Custom checklist for ${property.name || property.address}`,
        customized_sections: [],
        is_active: true
      });

      setStep(3);
    } catch (error) {
      console.error('Error saving checklist:', error);
      setCreating(false);
    }
  };

  const handleCompleteWizard = () => {
    onComplete?.();
    onClose?.();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Custom Checklist</DialogTitle>
          <DialogDescription>
            Select a template to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Property Type</p>
            <div className={`${propertyTypeInfo.color} rounded-lg p-4 flex items-center gap-3`}>
              <TypeIcon className="w-6 h-6 text-white" />
              <div>
                <p className="font-semibold text-white">{propertyTypeInfo.title}</p>
                <p className="text-sm text-white/90">{property.name || property.address}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Choose a Standard Template</p>
            <div className="grid grid-cols-1 gap-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{template.name}</p>
                      <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <Check className="w-5 h-5 text-blue-600 shrink-0 ml-3" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Checklist Name
            </label>
            <Input
              placeholder={`${property.name || property.address} Checklist`}
              value={checklistName}
              onChange={(e) => setChecklistName(e.target.value)}
              className="h-10"
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">
              Give this checklist a name to help you identify it later
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndActivate}
              disabled={!checklistName.trim() || !selectedTemplate || creating}
              className="flex-1 text-slate-900"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create & Open Editor <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}