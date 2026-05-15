# Tasks: Admin direct edit and correction flow

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 |
| Suggested split | Single PR (size:exception accepted) |
| Delivery strategy | exception-ok |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full implementation (single branch) | PR 1 | Tests, backend logic, frontend wiring |

## Phase 1: Foundation & Types

- [x] 1.1 GREEN: Add `admin_direct_edit_regenerated` to `ActivityAction` union in `lib/types/activity.ts`.
- [x] 1.2 GREEN: Update `app/api/activity/route.ts` to render timeline copy for `admin_direct_edit_regenerated`.

## Phase 2: Backend Implementation (TDD)

- [x] 2.1 RED: Create `tests/integration/api-convenio-admin-edit.test.ts` for PATCH branching, archive, and audit inserts.
- [x] 2.2 GREEN: Update `app/api/convenios/[id]/route.ts` PATCH to accept `edit_context`, process `admin_direct`, move existing `document_path` to `DRIVE_FOLDERS.ARCHIVED`, reset status/metadata, regenerate to `PENDING`, and insert audit log.

## Phase 3: Frontend Wiring (TDD)

- [x] 3.1 RED: Create `tests/unit/admin-columns-actions.test.tsx` for `Editar convenio` visibility and correct URL params.
- [x] 3.2 GREEN: Add `Editar convenio` link in `app/protected/admin/columns.tsx` routing to `?mode=correccion&origin=admin-edit`.
- [x] 3.3 GREEN: Update `app/protected/convenio-detalle/[id]/page.tsx` to detect `origin=admin-edit` and block approved convenios with a confirmation modal.
- [x] 3.4 GREEN: Update `app/components/convenios/ConvenioFormLayout.tsx` to pass `edit_context: { source: "admin_direct", approved_reset_confirmed }` in the PATCH payload if origin is admin-edit.

## Phase 4: Verification

- [x] 4.1 RED: Create `tests/e2e/admin-direct-edit-flow.spec.ts` for full admin edit journey on approved and non-approved convenios.
- [x] 4.2 GREEN: Ensure e2e tests pass and current applicant correction flow remains intact.
