import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ChevronLeft,
  Home, Users, Wrench, AlertTriangle, Building2, Car, Wind, Package, CalendarCheck
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const VISIT_TYPES = [
  { value: 'check-in', label: 'Check-In Visit', icon: Home, color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { value: 'arrival_departure', label: 'Arrival/Departure', icon: Users, color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { value: 'access_visit', label: 'Access Visit', icon: Wrench, color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { value: 'emergency_visit', label: 'Emergency Visit', icon: AlertTriangle, color: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { value: 'damage_recovery', label: 'Damage Recovery', icon: Building2, color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { value: 'auto_care', label: 'Auto Care', icon: Car, color: 'bg-slate-50 border-slate-200 hover:bg-slate-100' },
  { value: 'pre_storm', label: 'Pre-Storm Check', icon: Wind, color: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { value: 'post_storm', label: 'Post-Storm Visit', icon: Wind, color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100' },
  { value: 'client_service', label: 'Client Service', icon: Users, color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { value: 'concierge', label: 'Concierge Service', icon: Package, color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { value: 'followup', label: 'Follow-Up', icon: CalendarCheck, color: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
];

export default function VisitTypeSelectionDialog({ open, onOpenChange, property, propertyChecklist, properties = [], checklists = [] }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [step, setStep] = useState(property ? 'type' : 'property');

  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
    setStep('type');
  };

  const handleSelectVisitType = async (visitType) => {
    const targetProperty = property || selectedProperty;
    if (!targetProperty) return;
    setCreating(true);

    try {
      const propertyChecklist = checklists.find(c => c.property_id === targetProperty.id);
      const visit = await base44.entities.Visit.create({
        company_id: targetProperty.company_id,
        property_id: targetProperty.id,
        client_id: targetProperty.client_id || null,
        visit_type: visitType,
        checkin_type: visitType === 'check-in' ? 'routine' : null,
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'in_progress',
        template_id: (visitType === 'check-in' && propertyChecklist) ? propertyChecklist.template_id : null,
      });

      navigate(createPageUrl('VisitChecklistMobile') + `?visit_id=${visit.id}&property_id=${targetProperty.id}&checklist_id=${propertyChecklist?.id}`);
      onOpenChange(false);
      setStep(property ? 'type' : 'property');
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error('Failed to start visit');
      setCreating(false);
    }
  };

  const handleDialogChange = (newOpen) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setStep(property ? 'type' : 'property');
      setSelectedProperty(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-800 px-6 py-6 flex items-center justify-between">
          {step === 'type' && !property && (
            <button
              onClick={() => {
                setStep('property');
                setSelectedProperty(null);
              }}
              disabled={creating}
              className="mr-2 p-1 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-white text-lg font-bold">
              {step === 'property' ? 'Select Property' : 'Select Visit Type'}
            </h2>
            <p className="text-white text-sm mt-1 opacity-90">
              {step === 'property' ? 'Choose a property to record a visit for' : 'Choose what you\'re recording'}
            </p>
          </div>
        </div>
  );
}