import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Settings, GripVertical } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function CustomFieldsManager({ companyId }) {
  const [customFields, setCustomFields] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showDialog, setShowDialog] = React.useState(false);
  const [editingField, setEditingField] = React.useState(null);
  const [selectedEntityType, setSelectedEntityType] = React.useState('client');
  const [fieldForm, setFieldForm] = React.useState({
    field_name: '',
    field_key: '',
    field_type: 'text',
    entity_type: 'client',
    options: [],
    required: false,
    default_value: '',
    placeholder: '',
    help_text: '',
    is_active: true
  });
  const [optionInput, setOptionInput] = React.useState('');

  React.useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      const fields = await base44.entities.CustomField.filter({ company_id: companyId }, 'order');
      setCustomFields(fields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFieldKey = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldForm({
      field_name: '',
      field_key: '',
      field_type: 'text',
      entity_type: selectedEntityType,
      options: [],
      required: false,
      default_value: '',
      placeholder: '',
      help_text: '',
      is_active: true
    });
    setOptionInput('');
    setShowDialog(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setFieldForm({
      field_name: field.field_name,
      field_key: field.field_key,
      field_type: field.field_type,
      entity_type: field.entity_type,
      options: field.options || [],
      required: field.required || false,
      default_value: field.default_value || '',
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      is_active: field.is_active !== false
    });
    setOptionInput('');
    setShowDialog(true);
  };

  const handleSaveField = async () => {
    if (!fieldForm.field_name) return;

    const fieldKey = fieldForm.field_key || generateFieldKey(fieldForm.field_name);
    
    try {
      if (editingField) {
        await base44.entities.CustomField.update(editingField.id, {
          ...fieldForm,
          field_key: fieldKey
        });
      } else {
        await base44.entities.CustomField.create({
          ...fieldForm,
          company_id: companyId,
          field_key: fieldKey,
          order: customFields.filter(f => f.entity_type === fieldForm.entity_type).length
        });
      }
      setShowDialog(false);
      loadCustomFields();
    } catch (error) {
      console.error('Error saving custom field:', error);
    }
  };

  const handleDeleteField = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      try {
        await base44.entities.CustomField.delete(id);
        loadCustomFields();
      } catch (error) {
        console.error('Error deleting custom field:', error);
      }
    }
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setFieldForm(prev => ({
        ...prev,
        options: [...(prev.options || []), optionInput.trim()]
      }));
      setOptionInput('');
    }
  };

  const removeOption = (index) => {
    setFieldForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const entityTypes = [
    { value: 'client', label: 'Clients' },
    { value: 'property', label: 'Properties' },
    { value: 'contractor', label: 'Contractors' },
    { value: 'inspection', label: 'Inspections' }
  ];

  const fieldTypes = [
    { value: 'text', label: 'Text (Single Line)' },
    { value: 'textarea', label: 'Text (Multi-Line)' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox (Yes/No)' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' }
  ];

  const filteredFields = customFields.filter(f => f.entity_type === selectedEntityType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Custom Fields
            </CardTitle>
            <CardDescription>Add custom fields to your entities</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Entity Type Selector */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Label className="text-sm font-medium">Entity:</Label>
            <div className="flex gap-2">
              {entityTypes.map(type => (
                <Button
                  key={type.value}
                  variant={selectedEntityType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedEntityType(type.value)}
                  className={selectedEntityType === type.value ? 'bg-slate-900' : ''}
                >
                  {type.label}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleAddField}
              size="sm"
              className="ml-auto bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          {/* Fields List */}
          {filteredFields.length > 0 ? (
            <div className="space-y-2">
              {filteredFields.map(field => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{field.field_name}</p>
                      {field.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                      {!field.is_active && (
                        <Badge variant="outline" className="text-xs bg-slate-100">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500">
                        Type: <span className="font-mono">{field.field_type}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Key: <code className="bg-slate-100 px-1 py-0.5 rounded">{field.field_key}</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditField(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No custom fields for {entityTypes.find(t => t.value === selectedEntityType)?.label.toLowerCase()} yet
            </div>
          )}
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Custom Field' : 'Add Custom Field'}</DialogTitle>
            <DialogDescription>
              Define a custom field for {entityTypes.find(t => t.value === fieldForm.entity_type)?.label.toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Field Name *</Label>
              <Input
                value={fieldForm.field_name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFieldForm(prev => ({
                    ...prev,
                    field_name: name,
                    field_key: !editingField ? generateFieldKey(name) : prev.field_key
                  }));
                }}
                placeholder="e.g., Emergency Contact"
              />
            </div>

            <div>
              <Label>Field Key (Internal) *</Label>
              <Input
                value={fieldForm.field_key}
                onChange={(e) => setFieldForm(prev => ({ ...prev, field_key: e.target.value }))}
                placeholder="e.g., emergency_contact"
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Used to store the value in the database</p>
            </div>

            <div>
              <Label>Field Type *</Label>
              <Select
                value={fieldForm.field_type}
                onValueChange={(value) => setFieldForm(prev => ({ ...prev, field_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fieldForm.field_type === 'dropdown' && (
              <div>
                <Label>Dropdown Options</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Add an option"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" onClick={addOption} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(fieldForm.options || []).map((option, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-2">
                      {option}
                      <button onClick={() => removeOption(idx)} className="hover:text-red-600">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Placeholder Text</Label>
              <Input
                value={fieldForm.placeholder}
                onChange={(e) => setFieldForm(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="e.g., Enter contact name"
              />
            </div>

            <div>
              <Label>Help Text</Label>
              <Textarea
                value={fieldForm.help_text}
                onChange={(e) => setFieldForm(prev => ({ ...prev, help_text: e.target.value }))}
                placeholder="Additional information about this field"
                rows={2}
              />
            </div>

            <div>
              <Label>Default Value</Label>
              <Input
                value={fieldForm.default_value}
                onChange={(e) => setFieldForm(prev => ({ ...prev, default_value: e.target.value }))}
                placeholder="Optional default value"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label className="mb-0">Required Field</Label>
                <p className="text-xs text-slate-500">Must be filled when creating/editing</p>
              </div>
              <Switch
                checked={fieldForm.required}
                onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, required: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label className="mb-0">Active</Label>
                <p className="text-xs text-slate-500">Show this field in forms</p>
              </div>
              <Switch
                checked={fieldForm.is_active}
                onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveField}
              disabled={!fieldForm.field_name || !fieldForm.field_key}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {editingField ? 'Update' : 'Create'} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}