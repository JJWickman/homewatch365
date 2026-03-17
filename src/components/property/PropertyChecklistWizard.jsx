import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Building, Home, Building2, X, ArrowRight, Loader2, Check, ChevronDown, ChevronRight, Plus, Trash2, Save, Globe } from 'lucide-react';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';
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

const TEMPLATE_CONFIGS = {
  'sfh-template': { key: 'sfh', title: 'Single Family Home', icon: Home, color: 'bg-blue-500', defaultSections: SFH_SECTIONS },
  'condo-template': { key: 'condo', title: 'Condo / Villa', icon: Building, color: 'bg-purple-500', defaultSections: CONDO_SECTIONS },
  'highrise-template': { key: 'highrise', title: 'Commercial / Multi-Family', icon: Building2, color: 'bg-emerald-500', defaultSections: HIGHRISE_SECTIONS },
};

export default function PropertyChecklistWizard({ property, onClose, onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [checklistName, setChecklistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [newChecklistId, setNewChecklistId] = useState(null);
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Three standard templates
  const STANDARD_TEMPLATES = [
    { id: 'sfh-template', name: 'Single Family Home', description: 'Home Watch checklist for single family homes and estates', propertyTypes: ['single_family', 'estate'] },
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

      // Initialize sections for editor
      const templateConfig = TEMPLATE_CONFIGS[selectedTemplate.id];
      setSections(JSON.parse(JSON.stringify(templateConfig.defaultSections)));
      setExpandedSections(Object.fromEntries(
        templateConfig.defaultSections.map((_, i) => [i, true])
      ));
      setNewChecklistId(newChecklist.id);
      setStep(2);
    } catch (error) {
      console.error('Error saving checklist:', error);
      setCreating(false);
    }
  };

  const updateSectionTitle = (sIdx, title) =>
    setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, title } : s));

  const removeSection = (sIdx) =>
    setSections(prev => prev.filter((_, i) => i !== sIdx));

  const addSection = () => {
    setSections(prev => [...prev, { title: 'New Section', items: [{ label: 'New item', responseType: 'ok_issue_na', instructions: '' }] }]);
  };

  const updateItem = (sIdx, iIdx, field, value) =>
    setSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: s.items.map((item, ii) => ii !== iIdx ? item : { ...item, [field]: value })
    }));

  const removeItem = (sIdx, iIdx) =>
    setSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: s.items.filter((_, ii) => ii !== iIdx)
    }));

  const addItem = (sIdx) =>
    setSections(prev => prev.map((s, si) => si !== sIdx ? s : {
      ...s, items: [...s.items, { label: 'New item', responseType: 'ok_issue_na', instructions: '' }]
    }));

  const toggleSection = (sIdx) =>
    setExpandedSections(prev => ({ ...prev, [sIdx]: !prev[sIdx] }));

  const saveChecklist = async () => {
    setSaving(true);
    try {
      await base44.entities.PropertyChecklist.update(newChecklistId, {
        customized_sections: sections
      });
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2500);
      onComplete?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const templateConfig = selectedTemplate ? TEMPLATE_CONFIGS[selectedTemplate.id] : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`${step === 2 ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Create Custom Checklist' : 'Customize Your Checklist'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Select a template to get started' : 'Edit sections and items for this checklist'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: Template Selection
          <div className="space-y-6 py-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Property Type</p>
              <div className={`${propertyTypeInfo.color} rounded-lg p-4 flex items-center gap-3`}>
                {propertyTypeInfo.icon && <propertyTypeInfo.icon className="w-6 h-6 text-white" />}
                <div>
                  <p className="font-semibold text-white">{propertyTypeInfo.title}</p>
                  <p className="text-sm text-white/90">{property.name || property.address}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Choose a Template</p>
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
                onClick={handleCreateChecklist}
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
                    Next: Customize <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Step 2: Inline Editor
          <div className="space-y-4 py-4">
            {/* Header with save button */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{checklistName}</h2>
                <p className="text-sm text-slate-600">{property.name || property.address}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {savedMsg && <span className="text-sm font-semibold text-green-600">{savedMsg}</span>}
                <Button
                  onClick={saveChecklist}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Save Checklist
                </Button>
              </div>
            </div>

            {/* Sections editor */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {sections.map((section, sIdx) => (
                <Card key={sIdx} className="overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <button
                      onClick={() => toggleSection(sIdx)}
                      className="text-slate-400 hover:text-slate-700 shrink-0"
                    >
                      {expandedSections[sIdx]
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                      className="flex-1 bg-transparent border-0 shadow-none font-semibold text-slate-700 h-8 px-1 focus:bg-white focus:border focus:shadow-sm rounded text-base"
                    />
                    <span className="text-xs text-slate-400 shrink-0">{section.items.length} items</span>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => removeSection(sIdx)}
                      className="text-red-400 hover:text-red-600 h-8 w-8 p-0 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {expandedSections[sIdx] && (
                    <CardContent className="p-4 space-y-2 bg-white">
                      {section.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-3 border border-slate-100 rounded-lg p-3 bg-slate-50/60">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.label}
                              onChange={(e) => updateItem(sIdx, iIdx, 'label', e.target.value)}
                              placeholder="Item label"
                              className="text-sm h-9 font-medium"
                            />
                            <Input
                              value={item.instructions || ''}
                              onChange={(e) => updateItem(sIdx, iIdx, 'instructions', e.target.value)}
                              placeholder="Instructions (optional)"
                              className="text-xs h-8 text-slate-500"
                            />
                          </div>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => removeItem(sIdx, iIdx)}
                            className="text-red-400 hover:text-red-600 h-8 w-8 p-0 shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm" variant="outline"
                        onClick={() => addItem(sIdx)}
                        className="w-full h-8 text-xs border-dashed border-slate-300 text-slate-500"
                      >
                        <Plus className="w-3 h-3 mr-1" />Add Item
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={addSection}
                className="w-full border-dashed border-slate-300 text-slate-600 h-9"
              >
                <Plus className="w-4 h-4 mr-2" />Add Section
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}