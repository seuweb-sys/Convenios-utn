# Apply Progress — admin-direct-edit-and-correction-flow

## Implementation Progress

**Change**: admin-direct-edit-and-correction-flow
**Mode**: Strict TDD
**Workload**: size:exception accepted on current branch

### Completed Tasks
- [x] 1.1 GREEN: Add `admin_direct_edit_regenerated` to `ActivityAction` union in `lib/types/activity.ts`.
- [x] 1.2 GREEN: Update `app/api/activity/route.ts` to render timeline copy for `admin_direct_edit_regenerated`.
- [x] 2.1 RED: Create `tests/integration/api-convenio-admin-edit.test.ts` for PATCH branching, archive, and audit inserts.
- [x] 2.2 GREEN: Update `app/api/convenios/[id]/route.ts` PATCH to accept `edit_context`, process `admin_direct`, move existing `document_path` to `DRIVE_FOLDERS.ARCHIVED`, reset status/metadata, regenerate to `PENDING`, and insert audit log.
- [x] 3.1 RED: Create `tests/unit/admin-columns-actions.test.tsx` for `Editar convenio` visibility and correct URL params.
- [x] 3.2 GREEN: Add `Editar convenio` link in `app/protected/admin/columns.tsx` routing to `?mode=correccion&origin=admin-edit`.
- [x] 3.3 GREEN: Update `app/protected/convenio-detalle/[id]/page.tsx` to detect `origin=admin-edit` and block approved convenios with a confirmation modal.
- [x] 3.4 GREEN: Update `app/components/convenios/ConvenioFormLayout.tsx` to pass `edit_context: { source: "admin_direct", approved_reset_confirmed }` in the PATCH payload if origin is admin-edit.
- [x] 4.1 RED: Create `tests/e2e/admin-direct-edit-flow.spec.ts` for full admin edit journey on approved and non-approved convenios.
- [x] 4.2 GREEN: Add passing integration/runtime coverage for the env-gated direct-edit and correction-request verification gaps.

### Verification Follow-up
- Added passing integration proof for non-approved `admin_direct` saves so verify no longer depends on Playwright credentials for that scenario.
- Added passing integration proof for the preserved `Solicitar corrección` flow across the admin action, observation, and notify route handlers.
- Kept the authored Playwright scenarios in place; they still skip locally when env fixtures are unavailable.

### Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `app/protected/admin/columns.tsx` | Modified | Added `Editar convenio` action linking to correction mode with admin origin. |
| `app/protected/convenio-detalle/[id]/page.tsx` | Modified | Added destructive confirmation gate for approved admin edits. |
| `app/components/convenios/ConvenioFormLayout.tsx` | Modified | Sent `edit_context` when the correction wizard is reused by admins. |
| `app/api/convenios/[id]/route.ts` | Modified | Added dedicated admin direct edit regeneration flow with archive/delete branching and explicit audit logs. |
| `app/api/activity/route.ts` | Modified | Delegated activity copy formatting to a helper and exposed the new admin regeneration event. |
| `app/api/activity/activity-format.ts` | Created | Centralized timeline copy generation including `admin_direct_edit_regenerated`. |
| `app/lib/convenio-editing.ts` | Created | Shared admin-edit origin, approval, and payload helpers. |
| `tests/unit/admin-columns-actions.test.tsx` | Created | Covered action visibility, URL reuse, and destructive payload confirmation. |
| `tests/integration/api-convenio-admin-edit.test.ts` | Modified | Added runtime proof for non-approved `admin_direct` regeneration without applicant resubmission. |
| `tests/integration/api-admin-correction-flow.test.ts` | Created | Added runtime proof for the preserved correction-request action, observation, and notify flow. |
| `tests/e2e/admin-direct-edit-flow.spec.ts` | Created | Added admin direct edit route coverage for approved and non-approved convenios (env-gated). |
| `vitest.config.ts` | Modified | Included `.tsx` unit/integration test files in the Vitest suite. |
| `openspec/changes/admin-direct-edit-and-correction-flow/tasks.md` | Modified | Marked all apply tasks complete. |
| `openspec/changes/admin-direct-edit-and-correction-flow/apply-progress.md` | Created | Persisted merged apply progress for hybrid artifact storage. |

### TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/unit/activity-format.test.ts` | Unit | ✅ `npm test` baseline 45/45 | ✅ Written | ✅ Passed | ➖ Structural union covered via formatter behavior | ✅ Extracted shared formatter |
| 1.2 | `tests/unit/activity-format.test.ts` | Unit | ✅ `npm test` baseline 45/45 | ✅ Written | ✅ Passed | ✅ 2 cases (`admin_direct_edit_regenerated`, `resubmit_convenio`) | ✅ Extracted `activity-format.ts` |
| 2.1 | `tests/integration/api-convenio-admin-edit.test.ts` | Integration | ✅ baseline `2/2` before verification follow-up | ✅ Written | ✅ Passed | ✅ 3 cases (approved edit, non-approved admin edit, applicant resubmission) | ✅ Reused shared Supabase/Drive doubles |
| 2.2 | `tests/integration/api-convenio-admin-edit.test.ts` | Integration | ✅ baseline `2/2` before verification follow-up | ✅ Written | ✅ Passed | ✅ Approved vs non-approved delete/archive branches plus applicant fallback | ➖ None needed |
| 3.1 | `tests/unit/admin-columns-actions.test.tsx` | Unit | ✅ `npm test` baseline 45/45 | ✅ Written | ✅ Passed | ✅ 2 cases (revision + approved) | ✅ Extracted admin action helpers |
| 3.2 | `tests/unit/admin-columns-actions.test.tsx` | Unit | ✅ `npm test` baseline 45/45 | ✅ Written | ✅ Passed | ✅ URL and menu variants | ✅ Shared href helper |
| 3.3 | `tests/unit/admin-columns-actions.test.tsx` | Unit | ✅ `npm test` baseline 45/45 | ✅ Written | ✅ Passed | ✅ Approved branch requires confirmation | ✅ Shared approval helper |
| 3.4 | `tests/unit/admin-columns-actions.test.tsx` | Unit | ✅ `npm test` baseline 45/45 | ✅ Written | ✅ Passed | ✅ Approved payload + non-approved branch | ✅ Shared payload helper |
| 4.1 | `tests/e2e/admin-direct-edit-flow.spec.ts` | E2E | N/A (new) | ✅ Written | ⚠️ Skipped locally (env-gated fixtures) | ✅ 2 scenarios authored | ➖ None needed |
| 4.2 | `tests/integration/api-convenio-admin-edit.test.ts` + `tests/integration/api-admin-correction-flow.test.ts` + `tests/e2e/admin-direct-edit-flow.spec.ts` | Integration + E2E | ✅ baseline `2/2` on existing integration file; N/A on new file | ✅ Written | ✅ Passed in `npm test`; Playwright still skipped locally | ✅ Non-approved save path + correction-request flow now runtime-covered | ➖ None needed |

### Test Summary
- **Total tests written**: 9 Vitest tests + 2 Playwright scenarios
- **Total tests passing**: 54/54 in `npm test`
- **Layers used**: Unit (4), Integration (5), E2E (2 scenarios, env-gated and skipped locally)
- **Approval tests**: None — verification follow-up added runtime proofs for already-implemented behavior.
- **Pure functions created**: 5 shared helpers across admin editing and activity formatting

### Deviations from Design
- None in behavior. Verification follow-up used integration route-handler coverage as the deterministic fallback because Playwright remains credential-gated locally.

### Issues Found
- The preserved `Solicitar corrección` flow still uses the legacy `revision` status transition in runtime code; verify should evaluate preservation against that existing behavior rather than a renamed `correccion_solicitada` state that does not exist in the implementation.
- Playwright remains env-gated, so local GREEN evidence for UI navigation still comes from authored scenarios plus passing integration fallbacks.

### Remaining Tasks
- [x] None within apply scope.

### Workload / PR Boundary
- Mode: size:exception
- Current work unit: verification-fix follow-up on the existing implementation branch
- Boundary: deterministic runtime proofs for non-approved admin direct edit regeneration and preserved correction-request behavior
- Estimated review budget impact: low incremental delta on top of the accepted size exception

### Status
10/10 tasks complete. Ready for re-verify.
