# E2E Test Plan

This folder contains Playwright end-to-end coverage for the Convenios product.

## Goals

- Validate real user flows across roles.
- Catch regressions in form flows, admin actions, and state transitions.
- Prefer browser-observable behavior over implementation details.
- Keep fixture assumptions explicit.

## Role Domains

### 1. Public Auth
- sign in
- sign up
- forgot password

**Suggested files**
- `auth-smoke.spec.ts`
- `auth-password-recovery.spec.ts`

### 2. Secretary / Standard User Submission
- convenio creation
- classification-aware submission
- PPS flows
- optional attachments

**Suggested files**
- `submission-secretary.spec.ts`
- `pps-attachments-user.spec.ts`

### 3. Profesor Scope Flows
- scoped classification
- visibility restrictions
- PPS submission/edit flows

**Current files**
- `convenio-submission-profesor.spec.ts`
- `convenios-scope.spec.ts`
- `convenio-visibility.spec.ts` (shared role visibility)

### 4. Admin Review Flows
- approve / reject / request correction
- direct edit
- signed PDF handling
- state resets after destructive admin edits

**Current files**
- `convenio-submission-admin.spec.ts`
- `admin-direct-edit-flow.spec.ts`

### 5. Cross-Cutting Regression
- detail rendering
- type resolution
- navigation and list search
- folderized document flows

**Current files**
- `secretary-convenios-lista.spec.ts`
- `convenio-submission-scoped.spec.ts`

## Naming Convention

- `auth-*.spec.ts` → public auth flows
- `submission-*.spec.ts` → user/profesor creation flows
- `admin-*.spec.ts` → admin review/edit flows
- `regression-*.spec.ts` → cross-domain smoke/regression coverage

## Recommended Future Foldering

If this suite grows, move files to:

```text
tests/e2e/
  auth/
  user/
  profesor/
  admin/
  regression/
  helpers/
```

For now, existing root-level spec names remain valid and stable.

## Current/Planned Domain Matrix

| Domain | Actor | Existing | Planned focus |
|--------|-------|----------|---------------|
| Auth | public user | partial | sign-up/sign-in/password reset smoke |
| PPS submission | profesor/user | partial | no attachments, multi-attachments, edit preservation |
| Admin direct edit | admin | partial | non-approved edit, approved warning/reset |
| Correction flow | admin + owner | partial | coexistence with direct edit |
| Folderized storage | profesor/admin | partial | submit/regenerate flows remain stable |

## Recommended Fixture Inputs

Environment variables already used by current helpers:

- `E2E_PROFESOR_EMAIL`
- `E2E_PROFESOR_PASSWORD`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_DIRECTOR_EMAIL`
- `E2E_DIRECTOR_PASSWORD`
- `E2E_MIEMBRO_EMAIL`
- `E2E_MIEMBRO_PASSWORD`
- `E2E_DECANO_EMAIL`
- `E2E_DECANO_PASSWORD`

Recommended extra fixture variables for richer admin/edit coverage:

- `E2E_ADMIN_DIRECT_EDIT_REVISION_ID`
- `E2E_ADMIN_DIRECT_EDIT_APPROVED_ID`
- `E2E_PPS_EXISTING_WITH_ATTACHMENTS_ID`

## File Upload Testing Rules

- Prefer `page.route()` mocks for direct-upload contracts when the goal is payload verification.
- Use real browser file selection to validate UX.
- Never assert on Drive internals from Playwright alone; confirm user-visible outcomes and request payloads.

## What Playwright Should Prove

Playwright is responsible for proving:

- forms can be completed by real roles
- navigation and action menus work
- destructive confirmations appear when required
- requests send the expected payload shape
- optional flows remain optional in the UI

Playwright is NOT the only source of truth for:

- Drive file placement
- server-side folder migration details
- low-level regeneration internals

Those stay covered by integration tests and occasional manual QA.

## Manual QA Still Required

- final `.docx` visual review for sensitive templates
- occasional Drive folder spot-checks
- signed PDF replacement sanity checks

## Next Additions

When adding a new E2E file, include at the top:

1. actor(s)
2. required env vars
3. whether requests are mocked or real
4. what business behavior the spec protects
