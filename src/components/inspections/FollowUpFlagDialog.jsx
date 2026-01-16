import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FOLLOW_UP_TYPES = [
  { value: 'issue', label: 'Issue Found' },
  { value: 'contractor_appointment', label: 'Contractor Needed' },
  { value: 'maintenance', label: 'Maintenance Required' },
  { value: 'repair', label: 'Repair Needed' },
  { value: 'inspection_followup', label: 'Follow-up Inspection' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const TIMEFRAMES = [
  { value: 'asap', label: 'ASAP' },
  { value: 'within_week', label: 'Within the Week' },
  { value: 'when_convenient', label: 'When Convenient' },
];

export default function FollowUpFlagDialog({
  isOpen,
  onOpenChange,
  itemName,
  onConfirm,
}) {
  const [followUpType, setFollowUpType] = useState('issue');
  const [priority, setPriority] = useState('medium');
  const [timeframe, setTimeframe] = useState('within_week');

  const handleConfirm = () => {
    onConfirm({
      type: followUpType,
      priority: priority,
      timeframe: timeframe,
    });
    onOpenChange(false);
    setFollowUpType('issue');
    setPriority('medium');
    setTimeframe('within_week');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag for Follow-up</DialogTitle>
          <DialogDescription>
            {itemName && <span className="font-medium text-slate-900">{itemName}</span>}
            {itemName && <br />}
            Select the type and priority for this follow-up
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Follow-up Type</Label>
            <Select value={followUpType} onValueChange={setFollowUpType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger id="timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
            Create Follow-up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}