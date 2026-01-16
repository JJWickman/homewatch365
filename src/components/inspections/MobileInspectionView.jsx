import React, { useState } from 'react';
import { Camera, CheckCircle2, Loader2, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INSPECTION_CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing', description: 'Sinks, showers, leaks' },
  { id: 'electrical', name: 'Electrical', description: 'Breakers, outlets, issues' },
  { id: 'hvac', name: 'HVAC', description: 'Filters, drains, temperature' },
  { id: 'roof', name: 'Roof', description: 'Wear, tears, leaks' },
  { id: 'appliances', name: 'Appliances', description: 'Working, temperature, spoilage' },
  { id: 'landscape', name: 'Landscape', description: 'Weeds, overgrowth, disease' },
  { id: 'lawn', name: 'Lawn', description: 'Growth, watering, weeds' }
];

export default function MobileInspectionView({
  inspection,
  categories,
  setCategories,
  handlePhotoUpload,
  uploading,
  saving,
  saveProgress
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [customItems, setCustomItems] = useState([]);
  const [newCustomName, setNewCustomName] = useState('');

  const updateCategory = (categoryId, field, value) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    );
  };

  const addPhoto = (categoryId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handlePhotoUpload(categoryId, e);
    input.click();
  };

  const addCustomItem = () => {
    if (newCustomName.trim()) {
      setCustomItems([...customItems, { id: Date.now(), name: newCustomName, notes: '', photos: [] }]);
      setNewCustomName('');
    }
  };

  const removeCustomItem = (itemId) => {
    setCustomItems(customItems.filter(item => item.id !== itemId));
  };

  const updateCustomItem = (itemId, field, value) => {
    setCustomItems(prev =>
      prev.map(item => item.id === itemId ? { ...item, [field]: value } : item)
    );
  };

  const addPhotoToCustom = (itemId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e?.target?.files?.[0];
      if (file) handlePhotoUpload(`custom-${itemId}`, null, e);
    };
    input.click();
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-lg">
        <p className="text-sm opacity-90">Progress</p>
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{categories.filter(c => c.notes || c.photos.length > 0).length + (customItems.length > 0 ? 1 : 0)}/{INSPECTION_CATEGORIES.length + 1}</span>
            <span className="text-xs opacity-75">sections reviewed</span>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(categories.filter(c => c.notes || c.photos.length > 0).length / INSPECTION_CATEGORIES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {/* Standard Categories */}
        {categories.map((category) => {
          const hasContent = category.notes || category.photos.length > 0;
          const isExpanded = expandedCategory === category.id;
          
          return (
            <Card key={category.id} className={hasContent ? 'border-emerald-300 bg-emerald-50' : ''}>
              <CardContent className="p-0">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{category.name}</h3>
                      <p className="text-xs text-slate-500">{category.description}</p>
                      {hasContent && (
                        <div className="mt-2 flex gap-2 text-xs">
                          {category.notes && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Notes</span>}
                          {category.photos.length > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{category.photos.length} photo{category.photos.length !== 1 ? 's' : ''}</span>}
                        </div>
                      )}
                    </div>
                    <div className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <span className="text-slate-400">▼</span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4 bg-white">
                    {/* Notes */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Notes & Observations</Label>
                      <Textarea
                        placeholder="What did you observe?"
                        value={category.notes}
                        onChange={(e) => updateCategory(category.id, 'notes', e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    {/* Photos */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Photos</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {category.photos.map((url, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden bg-slate-100 aspect-square">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                        <button
                          onClick={() => addPhoto(category.id)}
                          disabled={uploading}
                          className="rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center aspect-square hover:border-slate-400 bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                          ) : (
                            <div className="text-center">
                              <Camera className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs text-slate-500">Add</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            );
            })}

            {/* Other/Custom Items Section */}
            <Card>
            <CardContent className="p-0">
            <button
              onClick={() => setExpandedCategory(expandedCategory === 'other' ? null : 'other')}
              className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Other</h3>
                  <p className="text-xs text-slate-500">Add custom inspection items</p>
                  {customItems.length > 0 && (
                    <div className="mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded inline-block">{customItems.length} item{customItems.length !== 1 ? 's' : ''}</div>
                  )}
                </div>
                <div className={`transition-transform ${expandedCategory === 'other' ? 'rotate-180' : ''}`}>
                  <span className="text-slate-400">▼</span>
                </div>
              </div>
            </button>

            {expandedCategory === 'other' && (
              <div className="border-t p-4 space-y-4 bg-white">
                {/* Add New Custom Item */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Add Custom Item</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter item name..."
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                      className="text-sm"
                    />
                    <Button 
                      onClick={addCustomItem}
                      size="icon"
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Custom Items List */}
                {customItems.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    {customItems.map(item => (
                      <div key={item.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{item.name}</h4>
                          <button
                            onClick={() => removeCustomItem(item.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Notes */}
                        <div className="mb-3">
                          <Label className="text-xs font-medium mb-1 block">Notes</Label>
                          <Textarea
                            placeholder="Add observations..."
                            value={item.notes}
                            onChange={(e) => updateCustomItem(item.id, 'notes', e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        </div>

                        {/* Photos */}
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Photos</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.photos.map((url, idx) => (
                              <div key={idx} className="rounded-lg overflow-hidden bg-slate-100 aspect-square">
                                <img src={url} alt="" className="h-full w-full object-cover" />
                              </div>
                            ))}
                            <button
                              onClick={() => addPhotoToCustom(item.id)}
                              disabled={uploading}
                              className="rounded-lg border-2 border-dashed border-amber-300 flex items-center justify-center aspect-square hover:border-amber-400 bg-amber-50 transition-colors disabled:opacity-50"
                            >
                              {uploading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                              ) : (
                                <div className="text-center">
                                  <Camera className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                                  <span className="text-xs text-amber-600">Add</span>
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </CardContent>
            </Card>
            </div>

            {/* Complete Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:left-64">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={saveProgress}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Report...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete & Generate Report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}