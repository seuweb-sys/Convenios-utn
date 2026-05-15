# Proposal: Admin Direct Edit and Correction Flow

## Intent

Allow administrators to directly edit a convenio and its generated document without requiring the applicant to resubmit, while fully preserving the existing "Solicitar corrección" asynchronous loop. This resolves the bottleneck of admins having to return documents for trivial corrections.

## Scope

### In Scope
- Add `Editar convenio` to the admin actions dropdown menu (`app/protected/admin/columns.tsx`).
- Reuse the existing recovery flow (`/protected/convenio-detalle/[id]?mode=correccion`) for admin direct edits.
- Add destructive warning when entering edit mode for `aprobado` convenios.
- Modify `PATCH /api/convenios/[id]` to force document regeneration, move the convenio back to `enviado`, and archive the previous approved document.
- Record explicit auditability in `activity_log` for admin direct edits/regenerations.

### Out of Scope
- Removing the legacy reclassification UI.
- Creating a new specialized admin field editor outside the existing wizard.
- Modifying the non-admin correction UX except where reuse requires it.

## Capabilities

### New Capabilities
- `admin-convenio-management`: Defines admin review and direct edit actions, regeneration rules, and audit logging for convenios.

### Modified Capabilities
- None

## Approach

We will implement **Approach A** from exploration:
1. Expose `Editar convenio` in the admin list that links to the existing `mode=correccion` route.
2. Intercept the route for `aprobado` convenios to show a destructive warning (explaining the document will be regenerated and status reset).
3. Update the `PATCH /api/convenios/[id]` endpoint condition (`isResubmissionAfterCorrection`) to also include `isAdminDirectEdit`.
4. When `isAdminDirectEdit` is true, the backend will delete the old document from Drive, regenerate the new one to `PENDING`, set the status to `enviado`, and log the action in `activity_log`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/protected/admin/columns.tsx` | Modified | Add `Editar convenio` action in the menu. |
| `app/protected/convenio-detalle/[id]/page.tsx` | Modified | Add destructive warning for `aprobado` edits. |
| `app/api/convenios/[id]/route.ts` | Modified | Expand document regeneration to trigger on admin edit, reset status, and log activity. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Admin accidentally resets an `aprobado` convenio | Low | Add explicit destructive warning before edit mode loads for approved items. |
| Generated document desync | Low | Ensure the `PATCH` logic accurately clears the old Google Drive file and uploads the new one. |

## Rollback Plan

Revert the UI additions in `columns.tsx` and rollback the `PATCH` endpoint condition in `app/api/convenios/[id]/route.ts` to only use `isResubmissionAfterCorrection`.

## Dependencies

- Existing Google Drive integration for document generation/archiving.
- Existing `activity_log` schema.

## Success Criteria

- [ ] Admins can click "Editar convenio" and correct data via the existing wizard.
- [ ] Saving an admin edit regenerates the Drive document, replacing the old one.
- [ ] Approved convenios require confirmation to edit and return to `enviado` status.
- [ ] The "Solicitar corrección" feature remains fully functional for standard user recovery.
- [ ] Admin edits are auditable via `activity_log`.