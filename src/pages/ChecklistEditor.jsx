import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Copy, Settings2, Camera, FileText, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const SECTION_RESPONSE_OPTIONS = [
  { label: 'No Visible Issue', color: 'bg-green-100 text-green-700 border-green-200' },
  { label: 'Visible Issue', color: 'bg-red-100 text-red-700 border-red-200', triggers_popup: true },
  { label: 'N/A', color: 'bg-slate-100 text-slate-500 border-slate-200' },
];

function ItemEditor({ item, onUpdate, onDelete, onDuplicate, dragHandleProps, isDragging }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border border-slate-200 rounded-lg overflow-hidden mb-2 bg-white ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}>
      {/* Item Header Row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 shrink-0">
          <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-600" />
        </div>

        <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <Input
          value={item.label}
          onChange={e => onUpdate('label', e.target.value)}
          className="flex-1 text-sm border-0 shadow-none px-0 focus-visible:ring-0 font-medium"
          placeholder="Item label..."
        />

        <div className="flex gap-1 shrink-0">
          {item.require_photo && <Camera className="h-3.5 w-3.5 text-blue-500" title="Photo required" />}
          {item.require_note && <FileText className="h-3.5 w-3.5 text-amber-500" title="Note required" />}
        </div>

        <button onClick={onDuplicate} className="p-1 text-slate-400 hover:text-slate-600 shrink-0" title="Duplicate item">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 shrink-0" title="Delete item">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded Editor */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
          {/* Instructions */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              <AlignLeft className="h-3 w-3 inline mr-1" />
              Inspector Instructions
            </label>
            <textarea
              value={item.instructions || ''}
              onChange={e => onUpdate('instructions', e.target.value)}
              placeholder="Optional guidance for the field inspector..."
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-400 bg-white resize-none"
              rows="2"
            />
          </div>

          {/* Toggles Row */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!item.require_photo}
                onChange={e => onUpdate('require_photo', e.target.checked)}
                className="rounded border-slate-300"
              />
              <Camera className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-slate-700">Require Photo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!item.require_note}
                onChange={e => onUpdate('require_note', e.target.checked)}
                className="rounded border-slate-300"
              />
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-slate-700">Require Note</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChecklistEditor() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const templateId = searchParams.get('template_id');
  const checklistId = searchParams.get('checklist_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [checklist_instructions, setChecklistInstructions] = useState('');
  const [sections, setSections] = useState([]);
  const [target, setTarget] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      if (templateId) {
        const templates = await base44.entities.ChecklistTemplate.filter({ id: templateId });
        if (templates[0]) {
          const t = templates[0];
          setTarget({ type: 'template', record: t });
          setName(t.name || '');
          setDescription(t.description || '');
          setChecklistInstructions(t.checklist_instructions || '');
          setSections(t.sections || []);
        }
      } else if (checklistId) {
        const checklists = await base44.entities.PropertyChecklist.filter({ id: checklistId });
        if (checklists[0]) {
          const c = checklists[0];
          setTarget({ type: 'checklist', record: c });
          setName(c.name || '');
          setChecklistInstructions(c.checklist_instructions || '');
          if (c.customized_sections?.length > 0) {
            setSections(c.customized_sections);
          } else if (c.template_id) {
            const templates = await base44.entities.ChecklistTemplate.filter({ id: c.template_id });
            setSections(templates[0]?.sections || []);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (target?.type === 'template') {
        await base44.entities.ChecklistTemplate.update(target.record.id, { name, description, checklist_instructions, sections });
      } else if (target?.type === 'checklist') {
        await base44.entities.PropertyChecklist.update(target.record.id, { name, checklist_instructions, customized_sections: sections });
      }
      toast.success('Saved successfully');
      navigate(-1);
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setSections(prev => [...prev, { title: 'New Section', items: [], instructions: '' }]);
  };

  const updateSection = (sIdx, field, value) => {
    setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, [field]: value } : s));
  };

  const duplicateSection = (sIdx) => {
    setSections(prev => {
      const copy = { ...prev[sIdx], title: prev[sIdx].title + ' (Copy)', items: [...(prev[sIdx].items || [])] };
      const next = [...prev];
      next.splice(sIdx + 1, 0, copy);
      return next;
    });
  };

  const deleteSection = (sIdx) => {
    if (!confirm('Delete this section and all its items?')) return;
    setSections(prev => prev.filter((_, i) => i !== sIdx));
  };

  const addItem = (sIdx) => {
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, items: [...(s.items || []), { label: 'New Item', instructions: '', require_photo: false, require_note: false }] }
      : s
    ));
  };

  const updateItem = (sIdx, iIdx, field, value) => {
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, items: s.items.map((item, j) => j === iIdx ? { ...item, [field]: value } : item) }
      : s
    ));
  };

  const duplicateItem = (sIdx, iIdx) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== sIdx) return s;
      const copy = { ...s.items[iIdx], label: s.items[iIdx].label + ' (Copy)' };
      const items = [...s.items];
      items.splice(iIdx + 1, 0, copy);
      return { ...s, items };
    }));
  };

  const deleteItem = (sIdx, iIdx) => {
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, items: s.items.filter((_, j) => j !== iIdx) }
      : s
    ));
  };

  const toggleSection = (sIdx) => {
    setCollapsedSections(prev => ({ ...prev, [sIdx]: !prev[sIdx] }));
  };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'SECTION') {
      const newSections = Array.from(sections);
      const [moved] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, moved);
      setSections(newSections);
    } else if (type === 'ITEM') {
      const sIdx = parseInt(source.droppableId.split('-')[1]);
      const dIdx = parseInt(destination.droppableId.split('-')[1]);
      setSections(prev => {
        const next = prev.map(s => ({ ...s, items: [...(s.items || [])] }));
        const [moved] = next[sIdx].items.splice(source.index, 1);
        next[dIdx].items.splice(destination.index, 0, moved);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-4xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white/90 backdrop-blur z-10 py-3 -mx-4 px-4 border-b border-slate-100">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-lg font-bold border-0 shadow-none px-0 focus-visible:ring-0"
              placeholder="Template name..."
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
            <span>{sections.length} sections</span>
            <span>·</span>
            <span>{sections.reduce((a, s) => a + (s.items?.length || 0), 0)} items</span>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Template Meta */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <Settings2 className="h-4 w-4" /> Template Settings
          </div>

          {/* Standard Response Options */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">Standard Response Options (applied to every section)</label>
            <div className="flex flex-wrap gap-2">
              {SECTION_RESPONSE_OPTIONS.map(opt => (
                <span key={opt.label} className={`px-3 py-1 rounded-full text-xs font-medium border ${opt.color}`}>
                  {opt.label}{opt.triggers_popup ? ' — triggers note & photo popup' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Checklist Instructions */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Checklist Instructions (shown to inspector at top)</label>
            <textarea
              value={checklist_instructions}
              onChange={e => setChecklistInstructions(e.target.value)}
              placeholder="Instructions shown to field inspector when starting this checklist..."
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-400 resize-none"
              rows="2"
            />
          </div>
        </div>

        {/* Sections */}
        <Droppable droppableId="sections" type="SECTION">
          {(provided) => (
            <div className="space-y-3" {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, sIdx) => (
                <Draggable key={`section-${sIdx}`} draggableId={`section-${sIdx}`} index={sIdx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white rounded-xl border overflow-hidden ${
                        snapshot.isDragging ? 'shadow-xl border-blue-300 ring-2 ring-blue-400' : 'border-slate-200'
                      }`}
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 shrink-0">
                          <GripVertical className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                        </div>

                        <button onClick={() => toggleSection(sIdx)} className="shrink-0 text-slate-500 hover:text-slate-700">
                          {collapsedSections[sIdx] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        <Input
                          value={section.title}
                          onChange={e => updateSection(sIdx, 'title', e.target.value)}
                          className="flex-1 font-semibold text-sm border-0 shadow-none px-0 bg-transparent focus-visible:ring-0 text-blue-900"
                          placeholder="Section title..."
                        />

                        <Badge variant="outline" className="text-xs shrink-0">
                          {(section.items || []).length} items
                        </Badge>

                        <button onClick={() => duplicateSection(sIdx)} className="p-1.5 text-slate-400 hover:text-slate-700 shrink-0" title="Duplicate section">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteSection(sIdx)} className="p-1.5 text-red-400 hover:text-red-600 shrink-0" title="Delete section">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {!collapsedSections[sIdx] && (
                        <>
                          {/* Section Instructions */}
                          <div className="px-4 pt-3 pb-2">
                            <Input
                              value={section.instructions || ''}
                              onChange={e => updateSection(sIdx, 'instructions', e.target.value)}
                              placeholder="Section instructions for inspector (optional)..."
                              className="text-xs text-slate-500 border-dashed"
                            />
                          </div>

                          {/* Items */}
                          <Droppable droppableId={`section-${sIdx}`} type="ITEM">
                            {(provided) => (
                              <div className="px-4 pb-2" {...provided.droppableProps} ref={provided.innerRef}>
                                {(section.items || []).map((item, iIdx) => (
                                  <Draggable key={`item-${sIdx}-${iIdx}`} draggableId={`item-${sIdx}-${iIdx}`} index={iIdx}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps}>
                                        <ItemEditor
                                          item={item}
                                          onUpdate={(field, value) => updateItem(sIdx, iIdx, field, value)}
                                          onDelete={() => deleteItem(sIdx, iIdx)}
                                          onDuplicate={() => duplicateItem(sIdx, iIdx)}
                                          dragHandleProps={provided.dragHandleProps}
                                          isDragging={snapshot.isDragging}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addItem(sIdx)}
                                  className="w-full mt-1 text-blue-600 border border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 gap-2 text-xs"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Add Item
                                </Button>
                              </div>
                            )}
                          </Droppable>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Add Section */}
        <Button
          variant="outline"
          onClick={addSection}
          className="mt-4 w-full gap-2 border-dashed border-2 border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 py-6 text-sm font-semibold"
        >
          <Plus className="h-5 w-5" /> Add Section
        </Button>
      </div>
    </DragDropContext>
  );
}