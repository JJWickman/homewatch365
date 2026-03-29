import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
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
      // Check geofencing if enabled for the company
      const companies = await base44.entities.Company.filter({ id: targetProperty.company_id });
      const company = companies[0];
      if (company?.geofencing_enabled && targetProperty.latitude && targetProperty.longitude) {
        const position = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        ).catch(() => null);

        if (!position) {
          toast.error('Location access is required to record a visit at this property. Please enable GPS and try again.');
          setCreating(false);
          return;
        }

        const result = await base44.functions.invoke('validateVisitLocation', {
          propertyId: targetProperty.id,
          userLat: position.coords.latitude,
          userLon: position.coords.longitude,
        });

        if (!result.data?.valid) {
          toast.error(result.data?.message || 'You must be at the property to record a visit.');
          setCreating(false);
          return;
        }
      }

      let propertyChecklist = checklists.find(c => c.property_id === targetProperty.id);
      
      // For check-in visits, ensure we have the saved checklist
      if (visitType === 'check-in' && !propertyChecklist) {
        const savedChecklists = await base44.entities.PropertyChecklist.filter({
          property_id: targetProperty.id,
          is_active: true
        });
        propertyChecklist = savedChecklists[0];
      }

      // Get template for the visit type
      const templates = await base44.entities.ChecklistTemplate.filter({
        code: visitType,
        active: true,
      });
      const template = templates[0];

      const visit = await base44.entities.Visit.create({
        company_id: targetProperty.company_id,
        tenant_id: targetProperty.tenant_id,
        property_id: targetProperty.id,
        client_id: targetProperty.client_id || null,
        visit_type: visitType,
        checkin_type: visitType === 'check-in' ? 'routine' : null,
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'in_progress',
        template_id: template?.id || null,
      });

      // Route based on visit type
      if (visitType === 'check-in' && propertyChecklist) {
        navigate(createPageUrl('VisitChecklistMobile') + `?visit_id=${visit.id}&property_id=${targetProperty.id}&checklist_id=${propertyChecklist?.id}`);
      } else if (template) {
        navigate(createPageUrl('VisitFormRenderer') + `?visit_id=${visit.id}&property_id=${targetProperty.id}&template_id=${template.id}&visit_type=${visitType}`);
      } else {
        toast.error(`No template found for ${visitType} visit type`);
        setCreating(false);
        return;
      }

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
      <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[85vh] rounded-2xl p-0 overflow-hidden border-0 shadow-lg" style={{padding: 0}}>
        <DialogTitle className="sr-only">
          {step === 'property' ? 'Select Property' : 'Select Visit Type'}
        </DialogTitle>
        <div className="bg-white border-b-4 border-green-500 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between rounded-t-2xl">
          {step === 'type' && !property && (
            <button
              onClick={() => {
                setStep('property');
                setSelectedProperty(null);
              }}
              disabled={creating}
              className="mr-2 p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-slate-900" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-slate-900 text-base sm:text-lg font-bold">
              {step === 'property' ? 'Select Property' : 'Select Visit Type'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              {step === 'property' ? 'Choose a property to record a visit for' : 'Choose what you\'re recording'}
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-4 max-h-[calc(90vh-180px)] sm:max-h-[calc(85vh-180px)] overflow-y-auto bg-slate-50">
          {step === 'property' ? (
            <div className="space-y-2">
              {properties.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">No properties available</p>
              ) : (
                properties.map(prop => (
                  <button
                    key={prop.id}
                    onClick={() => handleSelectProperty(prop)}
                    disabled={creating}
                    className="w-full text-left p-4 sm:p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-16 sm:min-h-auto"
                  >
                    <p className="font-medium text-slate-900">{prop.name || prop.address}</p>
                    <p className="text-sm text-slate-500">{prop.city}, {prop.state}</p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VISIT_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  disabled={creating}
                  onClick={() => handleSelectVisitType(value)}
                  className={`flex flex-col items-center justify-center p-5 sm:p-4 rounded-xl border-2 transition-colors font-medium text-sm min-h-24 sm:min-h-20 ${color} ${creating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                >
                  <Icon className="h-7 w-7 sm:h-6 sm:w-6 mb-2" />
                  <span className="text-center text-xs sm:text-sm leading-tight">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}