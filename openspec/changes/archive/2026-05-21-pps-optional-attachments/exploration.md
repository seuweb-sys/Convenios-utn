## Exploration: pps-optional-attachments

### Current State
- The PPS form (`ConvenioParticularForm.tsx`) currently collects only text data and has no file upload fields.
- Direct uploads to Drive exist and are used by `ConvenioMarcoForm` and Signed PDFs (`signed-pdf-dialog.tsx`) via `uploadFileToDriveInChunks` and `/api/uploads/drive/resumable-session`.
- Convenios creation backend (`app/api/convenios/route.ts`) already supports folderized storage for all convenios.
- The backend delegates to `uploadConvenioEspecificoOAuth` to create a folder, upload the main doc, and move pre-uploaded `driveFileId` attachments into that folder. However, this is currently hardcoded to trigger only for Convenio Específico (`type_id = 4`) and Convenio Marco (`type_id = 2`).

### Affected Areas
- `app/components/forms/convenio-particular/ConvenioParticularForm.tsx` — Needs a new UI step (or section) to attach files, maintaining an `anexoFiles` state and calling the client-to-Drive upload logic before submission.
- `app/api/convenios/route.ts` — Needs to expand the condition that decides to process anexos (`isConvenioMarcoConAnexos`) to also include PPS (`convenioTypeId === 1`).

### Approaches
1. **Reuse Marco's Direct Upload Flow (Recommended)**
   - Add an attachment section in the "Detalles de la práctica" step or a new "Anexos" step in `ConvenioParticularForm.tsx`.
   - Use `uploadFileToDriveInChunks` (via `/api/uploads/drive/resumable-session`) to upload files to the `PENDING` Drive folder directly from the client.
   - Pass the resulting `driveFileId`s in the `body.anexos` array during form submission.
   - Update the backend condition in `app/api/convenios/route.ts` to allow PPS (`type_id === 1`) to trigger `uploadConvenioEspecificoOAuth`.
   - Pros: Zero bytes pass through Vercel. Fully leverages existing Drive folderized storage logic. Code reuse.
   - Cons: Slightly complex state management in the form for tracking upload progress.
   - Effort: Low

2. **Upload through Vercel (Not Recommended)**
   - Accept files as Base64/Buffer in the form submission payload.
   - Pros: Simpler form state.
   - Cons: Violates the critical requirement of not sending file bytes through Vercel. May hit Vercel body size limits.
   - Effort: Low

### Recommendation
**Approach 1 (Reuse Marco's Direct Upload Flow)**. It directly satisfies the critical requirement, heavily reuses existing code, and naturally aligns with the new folderized storage because the backend already has `uploadConvenioEspecificoOAuth` which handles moving direct-uploaded files into the final convenio folder.

### Risks
- **Orphaned Files in Drive**: If the user uploads attachments in the form but abandons the page without submitting, the files will remain in the `PENDING` Drive folder indefinitely. (This risk already exists for Convenio Marco).
- **Edit/Regeneration**: If the user later edits the PPS, the edit flow needs to ensure it doesn't accidentally overwrite or lose track of these anexos. Currently, `ConvenioParticularForm.tsx` handles `PATCH` to `/api/convenios/[id]`. The backend PATCH endpoint might need to support adding/removing anexos.
- **Upload Failures after Partial Success**: If one file uploads but another fails, the user might submit a partial list, or the form might block.

### Ready for Proposal
Yes. The orchestrator can proceed to the Proposal phase.