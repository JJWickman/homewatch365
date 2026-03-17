import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Home, Building, Building2, Save, Globe, Plus, Trash2,
  ChevronDown, ChevronRight, Loader2, ArrowLeft, MessageSquare, Camera, GripVertical
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SFH_SECTIONS, CONDO_SECTIONS, HIGHRISE_SECTIONS } from '@/components/checklist/checklistDefaults';

const TEMPLATES = [
  { key: 'sfh', title: 'Single Family Home', subtitle: 'Home Watch Visit Checklist', icon: Home, color: 'bg-blue-500', defaultSections: SFH_SECTIONS },
  { key: 'condo', title: 'Condo / Villa', subtitle: 'Home Watch Visit Checklist', icon: Building, color: 'bg-purple-500', defaultSections: CONDO_SECTIONS },
  { key: 'highrise', title: 'High Rise', subtitle: 'Home Watch Visit Checklist', icon: Building2, color: 'bg-emerald-500', defaultSections: HIGHRISE_SECTIONS },
];

export default function ChecklistEditor() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const templateKey = urlParams.get('type') || 'sfh';
  const checklistId = urlParams.get('checklistId'); // Property-specific checklist
  const propertyId = urlParams.get('propertyId');

  const [company, setCompany] = useState(null);
  const [propertyChecklist, setPropertyChecklist] = useState(null);
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const template = TEMPLATES.find(t => t.key === templateKey) || TEMPLATES[0];
  const Icon = template.icon;

  useEffect(() => {
    loadData();
  }, [templateKey, checklistId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      if (!members.length) return;
      const companies = await base44.entities.Company.filter({ id: members[0].company_id });
      const c = companies[0];
      setCompany(c);

      let raw;
      
      // If editing a property-specific checklist
      if (checklistId) {
        const checklists = await base44.entities.PropertyChecklist.filter({ id: checklistId });
        if (checklists.length > 0) {
          const pChecklist = checklists[0];
          setPropertyChecklist(pChecklist);
          
          // Load property and client info
          const properties = await base44.entities.Property.filter({ id: pChecklist.property_id });
          if (properties.length > 0) {
            setProperty(properties[0]);
            const clients = await base44.entities.Client.filter({ id: properties[0].client_id });
            if (clients.length > 0) {
              setClient(clients[0]);
            }
          }
          
          raw = pChecklist.customized_sections?.length > 0
            ? JSON.parse(JSON.stringify(pChecklist.customized_sections))
            : JSON.parse(JSON.stringify(template.defaultSections));
        }
      } else {
        // Editing company template
        const saved = c?.settings?.checklists?.[templateKey];
        raw = (saved?.sections?.length > 0)
          ? JSON.parse(JSON.stringify(saved.sections))
          : JSON.parse(JSON.stringify(template.defaultSections));
      }
      
      raw.forEach(s => s.items.forEach(item => {
        if (item.instructions === undefined) item.instructions = '';
      }));
      setSections(raw);
      setExpandedSections(Object.fromEntries(raw.map((_, i) => [i, true])));
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (published) => {
    setSaving(true);
    try {
      if (checklistId && propertyChecklist) {
        // Save to PropertyChecklist
        await base44.entities.PropertyChecklist.update(checklistId, {
          customized_sections: sections
        });
        setSavedMsg('Saved!');
        setTimeout(() => setSavedMsg(''), 2500);
        // Return to property detail after editing property checklist
        if (published && propertyId) {
          navigate(createPageUrl('PropertyDetail') + `?id=${propertyId}`);
        }
      } else {
        // Save to Company template
        const checklists = company?.settings?.checklists || {};
        const updatedChecklists = {
          ...checklists,
          [templateKey]: { sections, published, updatedAt: new Date().toISOString() }
        };
        const updatedSettings = { ...(company.settings || {}), checklists: updatedChecklists };
        await base44.entities.Company.update(company.id, { settings: updatedSettings });
        setCompany(prev => ({ ...prev, settings: updatedSettings }));
        setSavedMsg(published ? 'Published!' : 'Draft saved!');
        setTimeout(() => setSavedMsg(''), 2500);
        if (published) navigate(createPageUrl('Settings') + '?tab=templates');
      }
    } finally {
      setSaving(false);
    }
  };

  const updateSectionTitle = (sIdx, title) =>
    setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, title } : s));

  const removeSection = (sIdx) =>
    setSections(prev => prev.filter((_, i) => i !== sIdx));

  const addSection = () => {
    setSections(prev => [...prev, { title: 'New Section', items: [{ label: 'New item', responseType: 'ok_issue_na', instructions: '' }] }]);
    setSections(prev => {
      setExpandedSections(es => ({ ...es, [prev.length - 1]: true }));
      return prev;
    });
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    setSections(prev => {
      const reordered = [...prev];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      return reordered;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap rounded-2xl px-5 py-4" style={{background: 'linear-gradient(to bottom, rgba(30,58,95,1), rgba(20,40,68,1))'}}>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (checklistId && propertyId) {
                navigate(createPageUrl('PropertyDetail') + `?id=${propertyId}`);
              } else {
                navigate(createPageUrl('Settings') + '?tab=templates');
              }
            }}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className={`${template.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {propertyChecklist ? `${propertyChecklist.name}` : `${template.title} Checklist`}
            </h1>
            <p className="text-sm text-blue-200">
              {propertyChecklist ? 'Property-specific checklist' : template.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-sm font-semibold text-green-300">{savedMsg}</span>}
          {!propertyChecklist && (
            <Button
              variant="outline"
              onClick={() => saveTemplate(false)}
              disabled={saving}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save Draft
            </Button>
          )}
          <Button
            onClick={() => saveTemplate(true)}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Globe className="w-4 h-4 mr-1.5" />}
            {propertyChecklist ? 'Save Changes' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Property Context Banner */}
      {propertyChecklist && property && client ? (
        <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 mb-6 shadow-sm text-center">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            {client.first_name} {client.last_name}
          </p>
          <p className="text-base font-bold text-blue-950 mb-2">
            {property.name || property.address}
          </p>
          <p className="text-xs text-blue-700">
            {property.address}, {property.city}, {property.state} {property.zip}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl px-6 py-5 mb-6 shadow-sm text-center">
          <img
            src="https://media.base44.com/images/public/696806e88e744d6cc803e3bb/b9e08eb9c_image.png"
            alt="Home Watch Academy"
            className="h-16 w-auto object-contain mb-3"
          />
          <p className="text-sm font-semibold text-slate-600 tracking-wide uppercase">
            Registered by Home Watch Academy
          </p>
        </div>
      )}

      {/* Template selector or type display */}
      {propertyChecklist ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-slate-600 mb-2">Property Type</p>
          <div className="flex items-center gap-2">
            <div className={`${template.color} w-8 h-8 rounded-lg flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-base font-semibold text-slate-900">{template.title}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-6 flex-wrap">
          {TEMPLATES.map(t => (
            <button
              key={t.key}
              onClick={() => navigate(createPageUrl('ChecklistEditor') + `?type=${t.key}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                t.key === templateKey
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.title}
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
        <div className="space-y-3" {...provided.droppableProps} ref={provided.innerRef}>
        {sections.map((section, sIdx) => (
          <Draggable key={`section-${sIdx}`} draggableId={`section-${sIdx}`} index={sIdx}>
            {(dragProvided, dragSnapshot) => (
          <Card ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={`overflow-hidden ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}`}>
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200" style={{background: 'linear-gradient(to right, rgba(30,58,95,0.08), rgba(30,58,95,0.03))'}}>
              <div {...dragProvided.dragHandleProps} className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical className="w-4 h-4" />
              </div>
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

            {/* Items */}
            {expandedSections[sIdx] && (
              <CardContent className="p-4 space-y-2 bg-white">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-start gap-3 border border-slate-100 rounded-lg p-3 bg-slate-50/60 hover:bg-slate-50">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={item.label}
                        onChange={(e) => updateItem(sIdx, iIdx, 'label', e.target.value)}
                        placeholder="Item label"
                        className="text-sm h-10 font-medium"
                      />

                      {/* Response options preview — always OK / Issue / N/A */}
                      <div className="flex gap-2">
                        {['OK', 'Issue', 'N/A'].map(opt => (
                          <div key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium flex-1 justify-center ${
                            opt === 'Issue' ? 'border-red-200 bg-red-50 text-red-600' :
                            opt === 'OK' ? 'border-green-200 bg-green-50 text-green-700' :
                            'border-slate-200 bg-slate-50 text-slate-500'
                          }`}>
                            <span className="w-4 h-4 rounded border-2 border-current flex items-center justify-center shrink-0" />
                            {opt}
                          </div>
                        ))}
                      </div>

                      {/* If "Issue" — require note and/or photo */}
                      <div className="flex gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => updateItem(sIdx, iIdx, 'require_note', !item.require_note)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                            item.require_note
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Require Note if Issue
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItem(sIdx, iIdx, 'require_photo', !item.require_photo)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                            item.require_photo
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          <Camera className="w-4 h-4" />
                          Require Photo if Issue
                        </button>
                      </div>

                      <Input
                        value={item.instructions || ''}
                        onChange={(e) => updateItem(sIdx, iIdx, 'instructions', e.target.value)}
                        placeholder="Instructions / notes for field user (optional)"
                        className="text-xs h-9 text-slate-500"
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
                  className="w-full h-9 text-sm border-dashed border-slate-300 text-slate-500"
                >
                  <Plus className="w-4 h-4 mr-1" />Add Item
                </Button>
              </CardContent>
            )}
          </Card>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
        <Button
          variant="outline"
          onClick={addSection}
          className="w-full border-dashed border-slate-300 text-slate-600 h-11"
        >
          <Plus className="w-4 h-4 mr-2" />Add Section
        </Button>
      </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}