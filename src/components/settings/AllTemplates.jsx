import React from 'react';
import TemplatesTab from './TemplatesTab';

export default function AllTemplates({ companyId, isAdmin, templates, onRefresh }) {
  return <TemplatesTab companyId={companyId} isAdmin={isAdmin} onRefresh={onRefresh} />;
}