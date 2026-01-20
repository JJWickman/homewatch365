import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign, Save, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VISIT_TYPES = [
  { id: 'inspection', label: 'Inspections', subtypes: ['routine', 'customer_called_in', 'drop_in', 'other'] },
  { id: 'followup', label: 'Follow-ups', subtypes: [] },
  { id: 'pre_storm', label: 'Pre-Storm Visits', subtypes: [] },
  { id: 'post_storm', label: 'Post-Storm Visits', subtypes: [] }
];

export default function PlanBillingConfiguration({ companyId }) {
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setFalse] = useState(false);
  const [changes, setChanges] = useState({});

  useEffect(() => {
    loadConfigurations();
  }, [companyId]);

  const loadConfigurations = async () => {
    try {
      const data = await base44.entities.ClientBillingPlans.filter({
        company_id: companyId
      });
      setConfigurations(data);
      // Initialize any missing configurations
      ensureAllConfigurationsExist(data);
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureAllConfigurationsExist = async (existingConfigs) => {
    const configMap = new Map(existingConfigs.map(c => 
      [`${c.visit_type}_${c.inspection_subtype || ''}`, c]
    ));

    for (const visitType of VISIT_TYPES) {
      if (visitType.subtypes.length === 0) {
        const key = `${visitType.id}_`;
        if (!configMap.has(key)) {
          try {
            const config = await base44.entities.ClientBillingPlans.create({
              company_id: companyId,
              visit_type: visitType.id,
              included_in_plan: visitType.id === 'inspection' || visitType.id === 'pre_storm' || visitType.id === 'post_storm',
              extra_charge: visitType.id === 'followup' ? 50 : 0,
              is_active: true
            });
            existingConfigs.push(config);
          } catch (error) {
            console.error('Error creating default configuration:', error);
          }
        }
      } else {
        for (const subtype of visitType.subtypes) {
          const key = `${visitType.id}_${subtype}`;
          if (!configMap.has(key)) {
            try {
              const config = await base44.entities.ClientBillingPlans.create({
                company_id: companyId,
                visit_type: visitType.id,
                inspection_subtype: subtype,
                included_in_plan: true,
                extra_charge: 0,
                is_active: true
              });
              existingConfigs.push(config);
            } catch (error) {
              console.error('Error creating default configuration:', error);
            }
          }
        }
      }
    }
    setConfigurations(existingConfigs);
  };

  const handleChange = (configId, field, value) => {
    setChanges(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setFalse(true);
    try {
      for (const [configId, updates] of Object.entries(changes)) {
        await base44.entities.ClientBillingPlans.update(configId, updates);
      }
      setChanges({});
      await loadConfigurations();
    } catch (error) {
      console.error('Error saving configurations:', error);
      alert('Failed to save billing configuration');
    } finally {
      setFalse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Configure which visit types are included in your service plan and which require additional charges. These settings determine what appears on client invoices.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Visit Type Billing Rules
          </CardTitle>
          <CardDescription>Define what's included in your plan vs what costs extra</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {VISIT_TYPES.map(visitType => {
            if (visitType.subtypes.length === 0) {
              // Simple visit types (no subtypes)
              const config = configurations.find(c => 
                c.visit_type === visitType.id && !c.inspection_subtype
              );
              if (!config) return null;

              const changes_data = changes[config.id] || {};
              const included = changes_data.included_in_plan !== undefined ? changes_data.included_in_plan : config.included_in_plan;
              const charge = changes_data.extra_charge !== undefined ? changes_data.extra_charge : config.extra_charge;

              return (
                <div key={config.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{visitType.label}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {visitType.id === 'followup' && 'Follow-up tasks and maintenance visits'}
                        {visitType.id === 'pre_storm' && 'Pre-storm property preparation visits'}
                        {visitType.id === 'post_storm' && 'Post-storm damage assessment visits'}
                      </p>
                    </div>
                    <Badge variant={included ? 'default' : 'outline'}>
                      {included ? 'Included' : 'Extra Charge'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`included_${config.id}`}
                          checked={included}
                          onChange={(e) => handleChange(config.id, 'included_in_plan', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor={`included_${config.id}`} className="mb-0 text-sm">
                          Included in subscription plan
                        </Label>
                      </div>
                    </div>

                    {!included && (
                      <div>
                        <Label htmlFor={`charge_${config.id}`} className="text-sm">Extra Charge per Visit</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-600">$</span>
                          <Input
                            id={`charge_${config.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={charge}
                            onChange={(e) => handleChange(config.id, 'extra_charge', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              // Inspection with subtypes
              return (
                <div key={visitType.id} className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold">{visitType.label}</h3>
                  
                  <div className="space-y-3 ml-2">
                    {visitType.subtypes.map(subtype => {
                      const config = configurations.find(c => 
                        c.visit_type === visitType.id && c.inspection_subtype === subtype
                      );
                      if (!config) return null;

                      const changes_data = changes[config.id] || {};
                      const included = changes_data.included_in_plan !== undefined ? changes_data.included_in_plan : config.included_in_plan;
                      const charge = changes_data.extra_charge !== undefined ? changes_data.extra_charge : config.extra_charge;

                      const subtypeLabel = {
                        'routine': 'Routine Inspection',
                        'customer_called_in': 'Customer Called-In',
                        'drop_in': 'Drop-In Visit',
                        'other': 'Other'
                      }[subtype];

                      return (
                        <div key={config.id} className="p-3 bg-slate-50 rounded border">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{subtypeLabel}</p>
                            </div>
                            <Badge variant={included ? 'secondary' : 'outline'} className="text-xs">
                              {included ? 'Included' : 'Extra: $' + charge}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`included_${config.id}`}
                                checked={included}
                                onChange={(e) => handleChange(config.id, 'included_in_plan', e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor={`included_${config.id}`} className="mb-0 text-xs">
                                Included in plan
                              </Label>
                            </div>

                            {!included && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={charge}
                                  onChange={(e) => handleChange(config.id, 'extra_charge', parseFloat(e.target.value) || 0)}
                                  className="w-16 h-8 text-xs"
                                />
                                <span className="text-xs text-slate-600">per visit</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          })}

          {Object.keys(changes).length > 0 && (
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}