# Proposal: Add Optional Attachments to PPS Form

## Intent

Allow users to optionally attach PDF or DOC files when creating a Convenio Particular de Práctica Supervisada (PPS). This fulfills user requests for direct documentation attachment while bypassing Vercel's limits by uploading directly to Google Drive, seamlessly integrating into the new folderized storage model.

## Scope

### In Scope
- Add an optional file attachment UI control to the PPS form within the "Detalles de la práctica" section (lower part).
- Implement direct client-to-Drive file upload bypassing the Vercel server.
- Persist file metadata/references in the database.
- Integrate the upload flow so attachments land in the newly created convenio folder.
- Ensure basic edit compatibility (viewing/replacing existing attachments if applicable).

### Out of Scope
- Broad attachment support for all other convenio types.
- Server-proxied uploads (all bytes must flow directly from client to Drive).
- Mass cleanup of abandoned or orphaned uploads.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `secretary-convenio-management`: Update PPS creation requirement to support optional file attachments, persisting references and ensuring files land in the corresponding Drive folder using direct client-side upload.

## Approach

Extend the `ConvenioParticularForm` component to include a file upload field in the "Detalles de la práctica" section. We will reuse the `uploadFileToDriveInChunks` pattern already used elsewhere in the application to ensure bytes go directly from the client to Google Drive. The backend `app/api/convenios/route.ts` will be updated to handle `type_id === 1` (PPS) in the same way it handles `isConvenioMarcoConAnexos`, reusing `uploadConvenioEspecificoOAuth` to move the pending `driveFileId` items into the final Convenio folder.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/components/forms/convenio-particular/ConvenioParticularForm.tsx` | Modified | Add attachment control in "Detalles de la práctica" |
| `app/api/convenios/route.ts` | Modified | Expand conditions to handle `type_id === 1` for moving pending drive files |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vercel timeout on large uploads | Low | Bypassed completely by enforcing direct client-to-Drive upload chunks |
| Orphaned files in Drive if form submission fails | Medium | Out of scope for mass cleanup, but mitigated by existing pending files cleanup mechanisms if they exist |

## Rollback Plan

Revert changes to `ConvenioParticularForm.tsx` and `app/api/convenios/route.ts`. Remove the attachment reference column from the database if added.

## Dependencies

- Existing Google Drive OAuth setup and `uploadFileToDriveInChunks` direct upload flow.
- Existing folderized storage backend logic in `app/api/convenios/route.ts`.

## Success Criteria

- [ ] Users can optionally attach a file (PDF/DOC) in the PPS form under "Detalles de la práctica".
- [ ] Uploaded file bytes go directly from client to Drive, bypassing Vercel server.
- [ ] Submitted attachment is successfully moved into the specific Convenio folder in Google Drive.
