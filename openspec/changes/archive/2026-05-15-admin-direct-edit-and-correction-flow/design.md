# Design: Admin direct edit and correction flow

Admins will reuse the existing correction wizard, but the system will mark the session as an explicit **admin direct edit** so backend regeneration, archival, and audit behavior diverge from the applicant correction flow without removing legacy reclassification.

## Technical Approach

- Add `Editar convenio` in `app/protected/admin/columns.tsx` next to `Solicitar corrección`.
- Navigate to the same detail route with correction mode, plus an additive origin flag: `/protected/convenio-detalle/[id]?mode=correccion&origin=admin-edit`.
- Gate approved convenios in `app/protected/convenio-detalle/[id]/page.tsx` with a destructive confirmation before rendering `ConvenioFormLayout`.
- Extend `PATCH app/api/convenios/[id]/route.ts` to distinguish:
  1. applicant resubmission (`revision -> enviado`),
  2. admin direct edit on non-approved convenios,
  3. admin direct edit on approved convenios.

Strict TDD is active later (`openspec/config.yaml`), so implementation should begin with failing unit/integration tests.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Edit intent detection | Add optional PATCH payload `edit_context` instead of inferring from status/role alone | Existing `revision -> enviado` already means applicant correction; explicit intent avoids breaking that flow. |
| Approved edit handling | Archive prior approved Drive artifact, clear signed approval metadata, regenerate to `PENDING`, set status to `enviado` | Prevents stale approved artifacts/PDF links after admin changes. |
| Audit model | Keep existing status log and add explicit admin regeneration event with metadata | Preserves current timeline semantics while making admin intervention searchable/auditable. |

## Data Flow

`admin columns` → `convenio-detalle?mode=correccion&origin=admin-edit` → approved warning gate (if needed) → `ConvenioFormLayout` submits PATCH with `edit_context` → `/api/convenios/[id]` updates DB + Drive + `activity_log`.

Approved edit branch:
1. Validate admin role and `edit_context.source === "admin_direct"`.
2. Move existing `document_path` artifact to `DRIVE_FOLDERS.ARCHIVED` (folder for type 4, file otherwise).
3. Clear `signed_pdf_path`, `signed_pdf_uploaded_at`, `signed_pdf_uploaded_by`, and reset status to `enviado`.
4. Regenerate document directly in `DRIVE_FOLDERS.PENDING`.
5. Insert explicit audit event with previous/new document references and reset metadata.

Non-approved admin edit branch keeps current regeneration logic, but treats it as direct edit instead of applicant resubmission and always lands in `enviado`.

## File Changes

| File | Action | Description |
|---|---|---|
| `app/protected/admin/columns.tsx` | Modify | Add `Editar convenio` action without removing `Solicitar corrección`. |
| `app/protected/convenio-detalle/[id]/page.tsx` | Modify | Detect `origin=admin-edit`, fetch status from store/API state, and block approved edits behind confirmation. |
| `app/components/convenios/ConvenioFormLayout.tsx` | Modify | Preserve origin flag and send `edit_context` in PATCH payload. |
| `app/api/convenios/[id]/route.ts` | Modify | Add admin direct edit branch, approved archival/reset logic, and explicit audit metadata. |
| `app/api/activity/route.ts` | Modify | Render friendly timeline copy for the new admin edit action. |
| `lib/types/activity.ts` | Modify | Extend `ActivityAction` union for admin direct edit events. |
| `tests/unit/admin-columns-actions.test.tsx` | Create | Verify action visibility and approved/non-approved menu behavior. |
| `tests/integration/api-convenio-admin-edit.test.ts` | Create | Verify PATCH branching, archival/reset behavior, and audit inserts with Drive mocks. |
| `tests/e2e/admin-direct-edit-flow.spec.ts` | Create | Cover admin edit navigation, approved confirmation, and preserved correction request flow. |

## Interfaces / Contracts

```ts
type EditContext = {
  source: "admin_direct";
  approved_reset_confirmed?: boolean;
};

type UpdateConvenioDTO = ExistingUpdateConvenioDTO & {
  edit_context?: EditContext;
};
```

`activity_log.metadata` for the new event should include at least:
`origin`, `previous_status`, `previous_document_path`, `archived_document_path` or archived item id, `new_document_path`, `status_reset_to`, `signed_pdf_cleared`.

Suggested new action key: `admin_direct_edit_regenerated`.

## Testing Strategy

| Layer | What to test | Approach |
|---|---|---|
| Unit | Admin menu/link + approved warning gate | React tests with router/search-param mocks. |
| Integration | PATCH intent branching, Drive archive vs delete, status reset, metadata insert | Vitest route tests mocking Supabase, Drive helpers, and notifications. |
| E2E | Admin edits non-approved and approved convenios; `Solicitar corrección` still works | Playwright admin flow with role fixtures. |

## Migration / Rollout

No DB migration required. External dependency: Google Drive folder IDs/helpers in `app/lib/google-drive.ts` must support archive move for both files and convenio específico folders.

## Open Questions

- [ ] Whether old signed PDFs should also be physically archived in Drive or only detached from the convenio record; this design clears the record to avoid stale approvals and leaves file cleanup as follow-up if needed.
