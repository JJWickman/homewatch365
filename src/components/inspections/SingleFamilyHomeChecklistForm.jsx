import React, { useState } from 'react';
import { Camera, Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TEMPLATE_DATA = {
  name: 'Single Family Home Checklist',
  description: 'Home Watch standard visit checklist for single family homes',
  type: 'standard',
  estimated_duration_minutes: 90,
  sections: [
    {
      name: 'Equipment Locations',
      order: 1,
      items: [
        { name: 'Water valve location', description: 'Note the location of water valve', order: 1, check_type: 'text', requires_note: true },
        { name: 'Breaker Box Location', description: 'Note the location of breaker box', order: 2, check_type: 'text', requires_note: true },
        { name: 'Water Heater Location', description: 'Note the location of water heater', order: 3, check_type: 'text', requires_note: true },
        { name: 'Air Handler Location', description: 'Note the location of air handler', order: 4, check_type: 'text', requires_note: true },
      ]
    },
    {
      name: 'Upon Arrival - Exterior Check',
      order: 2,
      items: [
        { name: 'Mailbox', description: 'Check mailbox, remove newspapers, forward mail if requested', order: 1, check_type: 'pass_fail' },
        { name: 'Landscape', description: 'Exterior check of landscape for brown spots or dead plants', order: 2, check_type: 'pass_fail' },
        { name: 'Rodents/Insects', description: 'Check for signs of rodents, insects or other critters', order: 3, check_type: 'pass_fail' },
        { name: 'Water Supply', description: 'Turn the water ON at the main supply valve, slowly and gingerly', order: 4, check_type: 'pass_fail' },
        { name: 'Exterior Visual', description: 'Visual exterior check including windows, roof, screens, AC unit, pavers and pool cage', order: 5, check_type: 'pass_fail', requires_photo: true },
        { name: 'Pool water level', description: 'Pool water level checked', order: 6, check_type: 'pass_fail' },
        { name: 'Pool equipment', description: 'Pool equipment checked', order: 7, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Upon Arrival - Interior Check',
      order: 3,
      items: [
        { name: 'Security system', description: 'Disarm security system', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Phone line', description: 'Test the phone line', order: 2, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Water Zone Home Watch Method',
      order: 4,
      items: [
        { name: 'Dishwasher', description: 'Short cycle on the dishwasher, check for visible leaks', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Garbage disposal', description: 'Operate the garbage disposal, check for proper operation and leaks', order: 2, check_type: 'pass_fail' },
        { name: 'Washing machine', description: 'Short cycle on the washing machine, check for visible leaks', order: 3, check_type: 'pass_fail' },
        { name: 'Clothes dryer', description: 'Operate clothes dryer', order: 4, check_type: 'pass_fail' },
        { name: 'Sinks', description: 'Run water in sinks, check for visible leaks', order: 5, check_type: 'pass_fail' },
        { name: 'Refrigerator/Freezer', description: 'Check the refrigerator and freezer temp and for proper operation', order: 6, check_type: 'pass_fail' },
        { name: 'Ice maker', description: 'Ice maker emptied and OFF', order: 7, check_type: 'pass_fail' },
        { name: 'Perishable foods', description: 'Perishable and frozen foods removed from fridge and freezer', order: 8, check_type: 'pass_fail' },
        { name: 'Wine cooler', description: 'Check wine cooler or wine room for proper temp and operation', order: 9, check_type: 'pass_fail' },
        { name: 'Showers/Tubs', description: 'Run water in showers and tubs, checking for visible leaks', order: 10, check_type: 'pass_fail', requires_photo: true },
        { name: 'Toilets', description: 'Brush and flush toilets, check for visible leaks and water damage', order: 11, check_type: 'pass_fail' },
        { name: 'Water heater', description: 'Check the water heater for signs of leaks and rust (should be OFF or Vacation Mode)', order: 12, check_type: 'pass_fail', requires_photo: true },
      ]
    },
    {
      name: 'AC System',
      order: 5,
      items: [
        { name: 'Temperature and humidity', description: 'Record temperature and humidity in main room', order: 1, check_type: 'text', requires_note: true },
        { name: 'Thermostat', description: 'Lower the thermostat by a couple of degrees. AC system set to Auto-Cool?', order: 2, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'AC blowing cold', description: 'AC is blowing cold air', order: 3, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'AC filters', description: 'AC filters checked', order: 4, check_type: 'pass_fail' },
        { name: 'Secondary pan', description: 'Check for signs of visible leaks or water in the secondary pan', order: 5, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Observe and Report',
      order: 6,
      items: [
        { name: 'Home Watch Mode', description: 'Is the residence in Home Watch Mode? (doors/closets open for air circulation, etc)', order: 1, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Storm Protection',
      order: 7,
      items: [
        { name: 'Electric shutters', description: 'Exercise electric storm shutters and all OK?', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Shutter controls', description: 'Shutter wall switch in neutral position or shutter remote control tested', order: 2, check_type: 'pass_fail' },
      ]
    },
    {
      name: 'Garage',
      order: 8,
      items: [
        { name: 'Ceiling/Walls', description: 'Check visible ceiling, walls, baseboards for signs of damage', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Garage door', description: 'Exercise the garage door', order: 2, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Breaker Box', description: 'Check Breaker Box', order: 3, check_type: 'pass_fail', requires_note: true, requires_photo: true },
      ]
    },
    {
      name: 'Departure',
      order: 9,
      items: [
        { name: 'Thermostat', description: 'Thermostat(s) returned to proper setting', order: 1, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Water OFF', description: 'Turn water OFF at the main supply valve - slowly and gingerly', order: 2, check_type: 'pass_fail', requires_note: true, requires_photo: true },
        { name: 'Water valve OFF photo', description: 'Photo of water valve in the OFF position', order: 3, check_type: 'photo' },
        { name: 'Security system', description: 'Security system set', order: 4, check_type: 'pass_fail' },
        { name: 'Doors locked', description: 'Doors locked', order: 5, check_type: 'pass_fail' },
      ]
    },
  ]
};

export default function SingleFamilyHomeChecklistForm({ onSubmit }) {
  const [formData, setFormData] = useState({});
  const [expandedSection, setExpandedSection] = useState(0);

  const handleStatusChange = (itemIndex, status) => {
    setFormData(prev => ({
      ...prev,
      [itemIndex]: { ...prev[itemIndex], status }
    }));
  };

  const handleNoteChange = (itemIndex, note) => {
    setFormData(prev => ({
      ...prev,
      [itemIndex]: { ...prev[itemIndex], note }
    }));
  };

  const handlePhotoAdd = (itemIndex) => {
    // Would integrate with photo upload in actual implementation
    setFormData(prev => ({
      ...prev,
      [itemIndex]: { ...prev[itemIndex], photo: 'photo-added' }
    }));
  };

  const getAllItems = () => {
    let index = 0;
    return TEMPLATE_DATA.sections.flatMap(section =>
      section.items.map(item => ({
        ...item,
        sectionName: section.name,
        itemIndex: index++
      }))
    );
  };

  const allItems = getAllItems();

  return (
    <div className="space-y-4 pb-6">
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <h2 className="text-xl font-bold text-slate-900">{TEMPLATE_DATA.name}</h2>
        <p className="text-sm text-slate-500 mt-1">{TEMPLATE_DATA.description}</p>
      </div>

      {TEMPLATE_DATA.sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="mx-0">
          <button
            onClick={() => setExpandedSection(expandedSection === sectionIndex ? -1 : sectionIndex)}
            className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
          >
            <CardTitle className="text-base text-slate-900">{section.name}</CardTitle>
          </button>

          {expandedSection === sectionIndex && (
            <CardContent className="space-y-4 pt-0">
              {section.items.map((item, itemIndex) => {
                const globalIndex = allItems.findIndex(i => i.sectionName === section.name && i.name === item.name);
                const itemState = formData[globalIndex] || {};

                return (
                  <div key={itemIndex} className="pb-4 border-b last:border-b-0">
                    <p className="font-medium text-slate-900 text-sm mb-2">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-600 mb-3">{item.description}</p>
                    )}

                    {/* Status Buttons */}
                    {item.check_type !== 'text' && item.check_type !== 'photo' && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <button
                          onClick={() => handleStatusChange(globalIndex, 'ok')}
                          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                            itemState.status === 'ok'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          ✓ OK
                        </button>
                        <button
                          onClick={() => handleStatusChange(globalIndex, 'issue')}
                          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                            itemState.status === 'issue'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          ! Issue
                        </button>
                        <button
                          onClick={() => handleStatusChange(globalIndex, 'na')}
                          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                            itemState.status === 'na'
                              ? 'bg-slate-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    )}

                    {/* Text Input for notes/text fields */}
                    {(item.requires_note || item.check_type === 'text') && (
                      <textarea
                        value={itemState.note || ''}
                        onChange={(e) => handleNoteChange(globalIndex, e.target.value)}
                        placeholder={item.check_type === 'text' ? 'Enter information...' : 'Add notes...'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-slate-900 mb-3 h-20"
                      />
                    )}

                    {/* Photo Upload */}
                    {(item.requires_photo || item.check_type === 'photo') && (
                      <div className="flex gap-2">
                        {itemState.photo ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                            <span className="text-emerald-700">✓ Photo added</span>
                            <button
                              onClick={() => handlePhotoAdd(globalIndex)}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePhotoAdd(globalIndex)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Camera className="h-4 w-4" />
                            Add Photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      ))}

      <div className="flex gap-2 px-4 pb-4">
        <Button variant="outline" className="flex-1">
          Save Draft
        </Button>
        <Button onClick={onSubmit} className="flex-1 bg-slate-900 hover:bg-slate-800">
          Complete Visit
        </Button>
      </div>
    </div>
  );
}