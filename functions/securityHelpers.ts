// Shared security validation helpers

export async function validateCompanyAccess(base44, user, companyId) {
  const members = await base44.entities.CompanyMember.filter({ 
    user_email: user.email,
    company_id: companyId 
  });
  
  if (!members || members.length === 0) {
    throw new Error('User does not have access to this company');
  }
  
  return members[0];
}

export async function validateAdminAccess(base44, user, companyId) {
  const member = await validateCompanyAccess(base44, user, companyId);
  
  if (member.access_level !== 'admin' && !member.is_owner) {
    throw new Error('Admin access required for this operation');
  }
  
  return member;
}

export function validateInput(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}