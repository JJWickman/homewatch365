import React from 'react';
import ChecklistTemplatesManager from './ChecklistTemplatesManager';

export default function AllTemplates({ companyId, isAdmin }) {
  return <ChecklistTemplatesManager companyId={companyId} isAdmin={isAdmin} />;
}