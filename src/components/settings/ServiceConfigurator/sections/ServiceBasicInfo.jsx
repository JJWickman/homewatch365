import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVICE_TYPES = [
  { value: 'subscription', label: 'Subscription Plan' },
  { value: 'addon', label: 'Add-On Service' }
];

export default function ServiceBasicInfo({ service, onUpdate }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Name & Type</CardTitle>
          <CardDescription>Basic information about your service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={service.name || ''}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="e.g., Premium Weekly Watch, Emergency Response"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={service.type || 'subscription'} onValueChange={(value) => onUpdate({ type: value })}>
              <SelectTrigger id="type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={service.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe what's included in this service..."
              className="mt-1 min-h-24"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}