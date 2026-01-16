import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export default function StatsDetailModal({ isOpen, onClose, title, description, items = [] }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="space-y-3 max-h-[60vh] overflow-y-auto py-4">
          {items.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No items to display</p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-medium text-slate-900">{item.label}</p>
                {item.value && <p className="text-sm text-slate-600 mt-1">{item.value}</p>}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}