import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DollarSign } from 'lucide-react';
import HomeWatchAcademyDisclaimer from './HomeWatchAcademyDisclaimer';
import ServiceConfiguratorRoot from './ServiceConfigurator/ServiceConfiguratorRoot';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const VISIT_TYPES = [
  { id: 'inspection', label: 'Inspections', subtypes: ['routine', 'customer_called_in', 'drop_in', 'other'] },
  { id: 'followup', label: 'Follow-ups', subtypes: [] },
  { id: 'pre_storm', label: 'Pre-Storm Visits', subtypes: [] },
  { id: 'post_storm', label: 'Post-Storm Visits', subtypes: [] }
];

const VisitTypesConfig = ({ visitTypes, onChange }) => {
  const handleToggle = (visitType, inspectionSubtype = null) => {
    const existing = visitTypes.find(
      vt => vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
    );

    if (existing) {
      onChange(visitTypes.map(vt =>
        vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
          ? { ...vt, included: !vt.included }
          : vt
      ));
    } else {
      onChange([
        ...visitTypes,
        {
          visit_type: visitType,
          inspection_subtype: inspectionSubtype,
          included: true,
          extra_charge: 0
        }
      ]);
    }
  };

  const handleChargeChange = (visitType, inspectionSubtype, charge) => {
    const existing = visitTypes.find(
      vt => vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
    );

    if (existing) {
      onChange(visitTypes.map(vt =>
        vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
          ? { ...vt, extra_charge: parseFloat(charge) || 0 }
          : vt
      ));
    }
  };

  const getVisitTypeState = (visitType, inspectionSubtype = null) => {
    return visitTypes.find(
      vt => vt.visit_type === visitType && vt.inspection_subtype === inspectionSubtype
    ) || { included: false, extra_charge: 0 };
  };

  return (
    <div className="space-y-3">
      {VISIT_TYPES.map(visitType => {
        if (visitType.subtypes.length === 0) {
          const state = getVisitTypeState(visitType.id);
          return (
            <div key={visitType.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.included}
                  onChange={() => handleToggle(visitType.id)}
                  className="rounded"
                />
                <Label className="mb-0 text-sm font-medium">{visitType.label}</Label>
              </div>
              {!state.included && (
                <div className="ml-6 flex items-center gap-2">
                  <Label className="text-xs text-slate-600">Extra Charge: $</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.extra_charge}
                    onChange={(e) => handleChargeChange(visitType.id, null, e.target.value)}
                    className="w-20 h-7 text-xs"
                  />
                </div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};

export default function FinancialManagement({ companyId, company }) {
  const handleConfiguratorSave = (newService) => {
    // After service is saved, you can reload or update local state
    console.log('Service saved:', newService);
  };

  return (
    <div className="space-y-6">
      <HomeWatchAcademyDisclaimer />
      <ServiceConfiguratorRoot 
        companyId={companyId}
        onSave={handleConfiguratorSave}
      />
    </div>
  );
}