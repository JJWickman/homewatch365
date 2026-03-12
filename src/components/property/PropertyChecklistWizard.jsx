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

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Load all company templates regardless of active status
      const allTemplates = await base44.entities.ChecklistTemplate.filter({ 
        company_id: property.company_id
      });
      
      // Filter by property type—match exact type or fallback mappings
      const relevantTemplates = allTemplates.filter(t => 
        t.property_type === property.property_type || 
        (property.property_type === 'townhouse' && t.property_type === 'condo_villa') ||
        (property.property_type === 'estate' && t.property_type === 'single_family')
      );
      
      setTemplates(relevantTemplates);
      if (relevantTemplates.length > 0) {
        setSelectedTemplate(relevantTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const propertyTypeInfo = PROPERTY_TYPE_MAP[property.property_type] || PROPERTY_TYPE_MAP['single_family'];
  const TypeIcon = propertyTypeInfo.icon;

  const handleSaveAndActivate = async () => {
    if (!checklistName.trim() || !selectedTemplate) return;
    
    setCreating(true);
    try {
      // Load template sections and items
      const sections = await base44.entities.ChecklistTemplateSection.filter({ 
        template_id: selectedTemplate.id 
      }, 'sort_order');

      const sectionData = await Promise.all(
        sections.map(async (section) => {
          const items = await base44.entities.ChecklistTemplateItem.filter({ 
            template_id: selectedTemplate.id,
            section_id: section.id 
          }, 'sort_order');
          
          return {
            ...section,
            items: items
          };
        })
      );

      // Create property-specific checklist
      const newChecklist = await base44.entities.PropertyChecklist.create({
        company_id: property.company_id,
        property_id: property.id,
        template_id: selectedTemplate.id,
        name: checklistName,
        description: `Custom checklist for ${property.name || property.address}`,
        customized_sections: sectionData,
        is_active: true
      });

      onComplete?.();
      onClose?.();
      
      // Navigate to editor with the property context
      navigate(
        createPageUrl('ChecklistEditor') + 
        `?checklistId=${newChecklist.id}&propertyId=${property.id}`
      );
    } catch (error) {
      console.error('Error saving checklist:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Custom Checklist</DialogTitle>
          <DialogDescription>
            Step {step} of 3
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: Select Template
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
              <p className="text-sm font-medium text-slate-700 mb-3">Select a Template</p>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No templates available for this property type</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{template.name}</p>
                          {template.description && (
                            <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                          )}
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <Check className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
                onClick={() => setStep(2)}
                disabled={!selectedTemplate}
                className="flex-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          // Step 2: Customize Template
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-900">Selected Template</p>
              <p className="text-sm text-slate-600 mt-1">{selectedTemplate?.name}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Step 2 allows you to customize sections and items from the template to match this property's specific needs. This will open in the full editor after you name your checklist.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          // Step 3: Save and Activate
          <div className="space-y-4 py-4">
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

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-slate-900">Summary</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Property: {property.name || property.address}</li>
                <li>• Type: {propertyTypeInfo.title}</li>
                <li>• Template: {selectedTemplate?.name}</li>
                <li>• Name: <span className="font-medium">{checklistName || '(Not set)'}</span></li>
                <li>• Status: <span className="font-medium text-emerald-600">Will be active</span></li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
                disabled={creating}
              >
                Back
              </Button>
              <Button
                onClick={handleSaveAndActivate}
                disabled={!checklistName.trim() || creating}
                className="flex-1"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Activate <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}