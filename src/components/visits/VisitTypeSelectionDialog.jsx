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
import {
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

export default function VisitTypeSelectionDialog({ open, onOpenChange, property, propertyChecklist }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleSelectVisitType = async (visitType) => {
    if (!property) return;
    setCreating(true);

    try {
      const visit = await base44.entities.Visit.create({
        company_id: property.company_id,
        property_id: property.id,
        client_id: property.client_id || null,
        visit_type: visitType,
        checkin_type: visitType === 'check-in' ? 'routine' : null,
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'in_progress',
        template_id: (visitType === 'check-in' && propertyChecklist) ? propertyChecklist.template_id : null,
      });

      navigate(createPageUrl('VisitChecklistMobile') + `?visit_id=${visit.id}&property_id=${property.id}&checklist_id=${propertyChecklist?.id}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error('Failed to start visit');
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6">
          <DialogTitle className="text-white text-lg font-semibold">Select Visit Type</DialogTitle>
          <p className="text-slate-300 text-xs mt-1">Choose what you're recording</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {VISIT_TYPES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              disabled={creating}
              onClick={() => handleSelectVisitType(value)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors font-medium text-sm ${color} ${creating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}