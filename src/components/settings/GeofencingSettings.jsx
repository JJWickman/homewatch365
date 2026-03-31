import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function GeofencingSettings({ company, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [radius, setRadius] = useState(company?.geofencing_radius_meters || 150);

  const handleToggle = async (enabled) => {
    // Before enabling, check for properties missing coordinates
    if (enabled) {
      const properties = await base44.entities.Property.filter({ tenant_id: company.id, is_active: true });
      const missing = properties.filter(p => !p.latitude || !p.longitude);
      if (missing.length > 0) {
        toast.error(
          `${missing.length} propert${missing.length === 1 ? 'y is' : 'ies are'} missing GPS coordinates. Use "Geocode All" below before enabling geofencing.`,
          { duration: 6000 }
        );
        return;
      }
    }

    setSaving(true);
    try {
      await base44.entities.Tenant.update(company.id, { geofencing_enabled: enabled });
      onUpdate({ ...company, geofencing_enabled: enabled });
      toast.success(enabled ? 'Geofencing enabled' : 'Geofencing disabled');
    } catch (e) {
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleRadiusSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Tenant.update(company.id, { geofencing_radius_meters: Number(radius) });
      onUpdate({ ...company, geofencing_radius_meters: Number(radius) });
      toast.success('Radius updated');
    } catch (e) {
      toast.error('Failed to update radius');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          GPS Geofencing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-slate-800">Require GPS check-in at property</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Field inspectors must be physically at the property to record a visit
            </p>
          </div>
          <Switch
            checked={!!company?.geofencing_enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>

        {company?.geofencing_enabled && (
          <div className="pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Allowed radius (meters)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={1000}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={handleRadiusSave}
                disabled={saving}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Default is 150m. Typical property perimeter fits within 50–200m.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}