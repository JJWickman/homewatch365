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
      const propertyTypeInfo = PROPERTY_TYPE_MAP[property.property_type] || PROPERTY_TYPE_MAP['single_family'];
      const allTemplates = await base44.entities.ChecklistTemplate.filter({ 
        company_id: property.company_id,
        active: true
      });
      // Filter templates by property type
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

  const handleCreate = async () => {
    if (!checklistName.trim()) return;
    
    setCreating(true);
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ 
        company_id: property.company_id,
        user_email: user.email 
      });
      
      const newChecklist = await base44.entities.PropertyChecklist.create({
        company_id: property.company_id,
        property_id: property.id,
        template_id: `${propertyTypeInfo.key}-template`,
        name: checklistName,
        description: `Custom checklist for ${property.name || property.address}`,
        customized_sections: [],
        is_active: true
      });

      onComplete?.();
      onClose?.();
      
      // Navigate to editor with the property context
      navigate(
        createPageUrl('ChecklistEditor') + 
        `?checklistId=${newChecklist.id}&propertyId=${property.id}&type=${propertyTypeInfo.key}`
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Checklist</DialogTitle>
          <DialogDescription>
            Step {step} of 2
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                This checklist will be customized for <strong>{propertyTypeInfo.title}</strong> properties. You can modify sections and items to match this property's specific needs.
              </p>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
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

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-sm font-medium text-slate-900 mb-2">Summary</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Property: {property.name || property.address}</li>
                <li>• Type: {propertyTypeInfo.title}</li>
                <li>• Name: {checklistName || '(Not set)'}</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={creating}
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!checklistName.trim() || creating}
                className="flex-1"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create <ArrowRight className="w-4 h-4 ml-2" />
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