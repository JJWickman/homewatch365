import React from 'react';
import ChecklistTemplatesSection from './ChecklistTemplatesSection';
import InspectionTemplates from './InspectionTemplates';

export default function AllTemplates({ companyId, isAdmin, templates, onRefresh }) {
  return (
    <div className="space-y-6">
      <ChecklistTemplatesSection companyId={companyId} isAdmin={isAdmin} />
      <InspectionTemplates 
        companyId={companyId} 
        templates={templates} 
        onRefresh={onRefresh}
      />
    </div>
  );
}