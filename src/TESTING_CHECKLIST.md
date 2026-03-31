# Multi-Tenant Data Isolation Testing Checklist

⚠️ **Brand Note**: This app is called **HomeWatch365**, but you may see references to **EstateWatch365** throughout the UI and code. These are legacy references that haven't been migrated yet and will be updated to the new URL over time. Both refer to the same application.

---

## Setup: 3 Separate Test Tenants
Before testing, ensure you have 3 separate tenant accounts:
- **Tenant A**: User A1 (admin)
- **Tenant B**: User B1 (admin)  
- **Tenant C**: User C1 (admin)

Each should have created their own tenant during onboarding with distinct sample data.

---

## Critical Data Isolation Tests

### 1. **Clients Page** ✓
**Test**: User A should only see Tenant A's clients
- [ ] Log in as User A1 → Navigate to Clients
- [ ] Verify only 6 clients from Tenant A appear
- [ ] Switch to User B1 → Navigate to Clients
- [ ] Verify different 6 clients from Tenant B appear (NOT A's clients)
- [ ] Switch to User C1 → Navigate to Clients
- [ ] Verify different 6 clients from Tenant C appear (NOT A's or B's clients)

**Expected**: Each tenant sees only their own clients. Cross-tenant data is invisible.

---

### 2. **Properties Page** ✓
**Test**: User A should only see Tenant A's properties
- [ ] Log in as User A1 → Navigate to Properties
- [ ] Verify only properties from Tenant A appear (6 Boca Grande properties)
- [ ] Switch to User B1 → Navigate to Properties
- [ ] Verify different properties from Tenant B appear
- [ ] Verify no Tenant A properties are visible
- [ ] Switch to User C1 → Navigate to Properties
- [ ] Verify different properties from Tenant C appear
- [ ] Verify no Tenant A or B properties are visible

**Expected**: Strict property isolation by tenant_id.

---

### 3. **Visits Page** ✓
**Test**: User A should only see Tenant A's visits
- [ ] Log in as User A1 → Navigate to Visits
- [ ] Verify only visits linked to Tenant A's properties appear
- [ ] Switch to User B1 → Navigate to Visits
- [ ] Verify only visits linked to Tenant B's properties appear
- [ ] Verify no Tenant A visits are visible
- [ ] Switch to User C1 → Navigate to Visits
- [ ] Verify different visits from Tenant C (no cross-contamination)

**Expected**: Visits filtered strictly by tenant_id.

---

### 4. **Client Detail Page** ✓
**Test**: User A cannot access Tenant B's client detail via URL manipulation
- [ ] Log in as User A1
- [ ] Open Clients, click on a Tenant A client (note the client ID)
- [ ] Copy the URL: `/ClientDetail?id=<CLIENT_ID>`
- [ ] Log out and log in as User B1
- [ ] Try to access Tenant A's client detail via URL directly
  - Paste: `/ClientDetail?id=<TENANT_A_CLIENT_ID>`
  - Press Enter

**Expected**: User B1 should get "Client not found" or redirect. The RLS should prevent loading.

---

### 5. **Property Detail Page** ✓
**Test**: User A cannot access Tenant B's property detail via URL
- [ ] Log in as User A1
- [ ] Open Properties, click on a Tenant A property (note the property ID)
- [ ] Log out and log in as User B1
- [ ] Try to access Tenant A's property detail via URL:
  - `/PropertyDetail?id=<TENANT_A_PROPERTY_ID>`

**Expected**: User B1 cannot view Tenant A's property. RLS enforcement blocks access.

---

### 6. **Visits Page - Visit Detail** ✓
**Test**: User A cannot access Tenant B's visit detail via URL
- [ ] Log in as User A1
- [ ] Navigate to Visits, click a visit to see the URL pattern
- [ ] Log out and log in as User B1
- [ ] Try to access Tenant A's visit via URL:
  - `/VisitDetail?id=<TENANT_A_VISIT_ID>`

**Expected**: User B1 cannot view Tenant A's visit. RLS blocks access.

---

## Backend Verification (Optional)

### Critical Entities with RLS:
Verify these entities enforce `tenant_id` in their RLS rules:
- [ ] **Client** - RLS reads: `data.tenant_id: {{user.data.primary_tenant_id}}`
- [ ] **Property** - RLS reads: `data.tenant_id: {{user.data.primary_tenant_id}}`
- [ ] **Visit** - RLS reads: `data.tenant_id: {{user.data.primary_tenant_id}}`
- [ ] **ProductService** - RLS reads: `$or` with `data.tenant_id` check
- [ ] **VisitTemplate** - RLS reads: `data.tenant_id: {{user.data.primary_tenant_id}}`
- [ ] **PropertyChecklist** - RLS reads: `data.tenant_id: {{user.data.primary_tenant_id}}`

### Code Audit Points:
- [ ] All `.filter()` calls on multi-tenant entities include `tenant_id`
- [ ] No hardcoded `company_id` filters remain (should use `tenant_id`)
- [ ] User's `primary_tenant_id` is set during onboarding
- [ ] TenantUser records link users to tenants correctly

---

## Success Criteria

✅ **All tests pass if:**
1. Each tenant sees only their own data across all pages
2. URL-based access attempts are blocked (RLS enforcement)
3. No cross-tenant data leakage in any view
4. Role-based access works within the same tenant

⚠️ **Red Flags** (Stop and fix before test users sign up):
- User A can see User B's clients/properties/visits
- URL manipulation grants unauthorized access
- Shared data across tenants in any page
- Missing `tenant_id` filters in backend queries

---

## Testing Notes
- Test in **incognito/private windows** to avoid session caching issues
- Clear browser cache between user switches if needed
- Check browser Network tab to verify no extra data is being fetched
- Monitor browser console for errors during data load