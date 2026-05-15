## Exploration: admin-direct-edit-and-correction-flow

### Current State
1. **Admin Review Flow**: Admins manage convenios in `app/protected/admin/columns.tsx` using a dropdown menu. They can "Aprobar", "Rechazar", or "Solicitar corrección".
2. **Solicitar Corrección**: This action opens a dialog (`app/protected/admin/observaciones-dialog.tsx`), captures a message, sets the convenio status to `revision`, adds an observation, and notifies the owner by email via `/api/admin/convenios/[id]/actions`. The document in Google Drive is moved to `DRIVE_FOLDERS.ARCHIVED`.
3. **Recovery Flow**: When a user fixes a rejected/revision convenio, they navigate to `app/protected/convenio-detalle/[id]?mode=correccion`. This initializes `useConvenioMarcoStore`, fetches the current `form_data` from `/api/convenios/[id]`, populates the form, and allows the user to re-submit via a `PATCH /api/convenios/[id]` request.
4. **Document Regeneration**: The `PATCH /api/convenios/[id]` endpoint explicitly checks `const isResubmissionAfterCorrection = body.status === 'enviado' && convenio.status === 'revision';`. **Only if this is true** does it delete the old document from `ARCHIVED`, regenerate the DOCX/PDF, and upload the new one to `DRIVE_FOLDERS.PENDING`.
5. **Old Convenio Fate**: The database record is updated in-place (ID remains the same). The old document file in Google Drive is deleted, and a new one is uploaded.

### Affected Areas
- `app/protected/admin/columns.tsx` — Needs a new "Editar convenio" action in the admin dropdown menu.
- `app/api/convenios/[id]/route.ts` — The document regeneration logic must be expanded to trigger when an admin edits a convenio directly.

### Edge Cases Discovered
- **Admin edits an `enviado` convenio**: If an admin uses `mode=correccion` on an `enviado` convenio, `isResubmissionAfterCorrection` evaluates to `false`. The database `form_data` updates, but the document is **NOT** regenerated. This is a bug for direct edit. The `PATCH` endpoint must be modified to force regeneration on admin edits.
- **Admin edits an `aprobado` convenio**: If we allow editing `aprobado` convenios, the regeneration logic currently hardcodes `uploadConvenioEspecificoOAuth(..., DRIVE_FOLDERS.PENDING)`. The new file would end up in `PENDING` despite the status being `aprobado`.

### Approaches
1. **Approach A: Reuse `mode=correccion` + Fix Regeneration Logic**
   - Add an "Editar convenio" link in the admin actions menu targeting `/protected/convenio-detalle/${id}?mode=correccion`.
   - Restrict this button to convenios in `enviado` or `revision` state (hide it for `aprobado` to avoid the folder mismatch, or handle folder assignment dynamically).
   - Modify `PATCH /api/convenios/[id]` to trigger document regeneration when an admin makes an edit (`isAdminEditing`).
   - Pros: Reuses the entire UI state mapping. Requires minimal backend changes (just expanding the IF condition). Keeps "Solicitar corrección" as a distinct, intact flow.
   - Cons: Admin navigates away from the list to edit.
   - Effort: Low

### Recommendation
**Approach A** is highly recommended. The scope should be:
1. Add "Editar convenio" to the dropdown in `columns.tsx`, visible only for non-approved convenios.
2. Update `PATCH /api/convenios/[id]` so that document regeneration triggers on `isResubmissionAfterCorrection || isAdminDirectEdit`.
3. This ensures the old document is deleted and the new one is correctly placed in `PENDING` (since the status will remain/become `enviado`), completely preserving the current correction flow for users.

### Risks
- If we don't expand the regeneration condition, admin edits will desync the database from the generated document.

### Ready for Proposal
Yes. The orchestrator can proceed to the Proposal phase with this narrow, well-defined scope.