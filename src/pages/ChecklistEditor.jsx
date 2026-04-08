import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function ChecklistEditor() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const templateId = searchParams.get('template_id');
  const checklistId = searchParams.get('checklist_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [sections, setSections] = useState([]);
  const [target, setTarget] = useState(null); // { type: 'template'|'checklist', record }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (templateId) {
        const templates = await base44.entities.ChecklistTemplate.filter({ id: templateId });
        if (templates[0]) {
          const t = templates[0];
          setTarget({ type: 'template', record: t });
          setName(t.name || '');
          setSections(t.sections || []);
        }
      } else if (checklistId) {
        const checklists = await base44.entities.PropertyChecklist.filter({ id: checklistId });
        if (checklists[0]) {
          const c = checklists[0];
          setTarget({ type: 'checklist', record: c });
          setName(c.name || '');
          // Try customized_sections first, then load from template
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
        await base44.entities.ChecklistTemplate.update(target.record.id, { name, sections });
      } else if (target?.type === 'checklist') {
        await base44.entities.PropertyChecklist.update(target.record.id, { name, customized_sections: sections });
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
    setSections(prev => [...prev, { title: 'New Section', items: [] }]);
  };

  const updateSectionTitle = (sIdx, title) => {
    setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, title } : s));
  };

  const updateSectionField = (sIdx, field, value) => {
    setSections(prev => prev.map((s, i) => i === sIdx ? { ...s, [field]: value } : s));
  };

  const deleteSection = (sIdx) => {
    setSections(prev => prev.filter((_, i) => i !== sIdx));
  };

  const addItem = (sIdx) => {
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, items: [...(s.items || []), { label: 'New Item', responseType: 'ok_issue_na', instructions: '' }] }
      : s
    ));
  };

  const updateItem = (sIdx, iIdx, field, value) => {
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, items: s.items.map((item, j) => j === iIdx ? { ...item, [field]: value } : item) }
      : s
    ));
  };

  const deleteItem = (sIdx, iIdx) => {
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, items: s.items.filter((_, j) => j !== iIdx) }
      : s
    ));
  };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'SECTION') {
      const newSections = Array.from(sections);
      const [movedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, movedSection);
      setSections(newSections);
    } else if (type === 'ITEM') {
      const sIdx = parseInt(source.droppableId.split('-')[1]);
      const dIdx = parseInt(destination.droppableId.split('-')[1]);
      setSections(prev => {
        const newSections = prev.map(s => ({ ...s, items: [...(s.items || [])] }));
        const [movedItem] = newSections[sIdx].items.splice(source.index, 1);
        newSections[dIdx].items.splice(destination.index, 0, movedItem);
        return newSections;
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
    <div className="max-w-3xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-lg font-semibold border-0 shadow-none px-0 focus-visible:ring-0"
            placeholder="Checklist name..."
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Sections */}
      <Droppable droppableId="sections" type="SECTION">
        {(provided) => (
      <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
        {sections.map((section, sIdx) => (
          <Draggable key={`section-${sIdx}`} draggableId={`section-${sIdx}`} index={sIdx}>
            {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${
              snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200" {...provided.dragHandleProps}>
              <GripVertical className="h-4 w-4 text-slate-400" />
              <Input
                value={section.title}
                onChange={e => updateSectionTitle(sIdx, e.target.value)}
                className="font-medium border-0 shadow-none px-0 bg-transparent focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" onClick={() => deleteSection(sIdx)} className="text-red-500 hover:text-red-700 shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Droppable droppableId={`section-${sIdx}`} type="ITEM">
              {(provided) => (
            <>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                <label className="text-xs font-medium text-slate-600 block mb-2">Section Instructions</label>
                <textarea
                  value={section.instructions || ''}
                  onChange={e => updateSectionField(sIdx, 'instructions', e.target.value)}
                  placeholder="Instructions for field staff..."
                  className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus-visible:ring-1 focus-visible:ring-blue-500"
                  rows="2"
                />
              </div>
              <div className="divide-y divide-slate-100" {...provided.droppableProps} ref={provided.innerRef}>
                {(section.items || []).map((item, iIdx) => (
                <Draggable key={`item-${sIdx}-${iIdx}`} draggableId={`item-${sIdx}-${iIdx}`} index={iIdx}>
                  {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={`flex items-center gap-2 px-4 py-2.5 ${
                    snapshot.isDragging ? 'bg-blue-50' : ''
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-slate-300 shrink-0" {...provided.dragHandleProps} />
                  <Input
                    value={item.label}
                    onChange={e => updateItem(sIdx, iIdx, 'label', e.target.value)}
                    className="flex-1 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
                    placeholder="Item label..."
                  />
                  <span className="text-xs text-slate-500 shrink-0">OK / Issue / N/A</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem(sIdx, iIdx)} className="text-red-400 hover:text-red-600 h-7 w-7 shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              </div>

              <div className="px-4 py-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => addItem(sIdx)} className="text-blue-600 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.allow_notes || false}
                  onChange={e => updateSectionField(sIdx, 'allow_notes', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Allow Notes
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.allow_photo || false}
                  onChange={e => updateSectionField(sIdx, 'allow_photo', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Allow Photo
              </label>
            </div>
            </>
            )}
            </Droppable>
          </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
        )}
      </Droppable>

      <Button variant="outline" onClick={addSection} className="mt-4 w-full gap-2">
        <Plus className="h-4 w-4" /> Add Section
      </Button>
    </div>
    </DragDropContext>
  );
}