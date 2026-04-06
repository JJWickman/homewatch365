import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Edit3, Eye, ClipboardList, FileText } from 'lucide-react';

export default function Checklists() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all | custom | template

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const tenantId = user?.primary_tenant_id;

      const [customs, templates] = await Promise.all([
        base44.entities.PropertyChecklist.filter({ tenant_id: tenantId }),
        base44.entities.ChecklistTemplate.filter({ active: true }),
      ]);

      const customItems = customs.map(c => ({
        id: c.id,
        name: c.name || 'Unnamed Checklist',
        type: 'custom',
        description: c.description || '',
        sectionCount: (c.customized_sections || []).length,
        raw: c,
      }));

      const templateItems = templates.map(t => ({
        id: t.id,
        name: t.name || 'Unnamed Template',
        type: 'template',
        description: t.description || '',
        sectionCount: (t.sections || []).length,
        raw: t,
      }));

      setItems([...customItems, ...templateItems]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    if (item.type === 'custom') {
      navigate(createPageUrl('ChecklistEditor') + `?checklist_id=${item.id}`);
    } else {
      navigate(createPageUrl('ChecklistEditor') + `?template_id=${item.id}`);
    }
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Checklists</h1>
        <p className="text-slate-500 text-sm mt-1">View and edit all property checklists and templates</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search checklists..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'custom', 'template'].map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No checklists found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="shrink-0">
                  {item.type === 'custom'
                    ? <ClipboardList className="h-5 w-5 text-blue-500" />
                    : <FileText className="h-5 w-5 text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 truncate">{item.name}</span>
                    <Badge variant="outline" className={item.type === 'custom' ? 'border-blue-300 text-blue-700' : 'border-purple-300 text-purple-700'}>
                      {item.type === 'custom' ? 'Custom' : 'Template'}
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{item.sectionCount} section{item.sectionCount !== 1 ? 's' : ''}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(item)}
                  className="shrink-0 gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}