# Design: PPS Optional Attachments

Add PPS attachments by reusing the existing direct-to-Drive resumable flow in the form, then persist only lightweight attachment references in `form_data` and `body.anexos`. On create/edit/regeneration, the backend keeps folder-based storage and moves only referenced Drive files into the convenio folder.

## Technical Approach

`app/components/forms/convenio-particular/ConvenioParticularForm.tsx` will gain an optional attachments block at the bottom of **Detalles de la Práctica** and a review summary. The form will reuse `uploadFileToDriveInChunks()` from `app/lib/client-drive-upload.ts` against `/api/uploads/drive/resumable-session`, so bytes never pass through `/api/convenios`.

For persistence, PPS will store attachment refs inside both:
- `requestData.anexos` for Drive folder processing
- `requestData.content_data.anexos` / `form_data.anexos` for safe reload/edit preservation

Strict TDD is active later (`openspec/config.yaml`), so implementation must go RED → GREEN → REFACTOR.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Upload path | Reuse `uploadFileToDriveInChunks()` and existing resumable session route | Matches current Marco flow, avoids duplicate chunk logic, keeps Vercel out of the file path. |
| Attachment persistence | Persist refs in `form_data.anexos` plus `body.anexos` | `body.anexos` alone is transient; `form_data.anexos` is what reload/edit already uses. |
| Edit preservation | Hydrate UI state from saved refs and only upload `pending` files | Prevents losing attachments on edit and avoids re-uploading unchanged files. |
| Backend branch | Treat PPS as folderized-with-anexos when mapped `convenioTypeId === 1` and attachments exist | The API maps PPS slug to type 1; design must follow the real mapping, not the stale `convenio_type_id: 2` sent by the form. |

## Data Flow

`ConvenioParticularForm`
→ selects files (`.pdf`, `.docx`)
→ uploads pending files to `PENDING` via `/api/uploads/drive/resumable-session`
→ receives `{ id, webViewLink, webContentLink }`
→ submits `anexos[]` refs + `form_data.anexos[]`
→ `app/api/convenios/route.ts` or `app/api/convenios/[id]/route.ts`
→ `uploadConvenioEspecificoOAuth(...)`
→ creates/moves into final convenio folder.

## File Changes

| File | Action | Description |
|---|---|---|
| `app/components/forms/convenio-particular/ConvenioParticularForm.tsx` | Modify | Add attachments UI, local attachment state, hydration from saved refs, upload-on-submit, and review display. |
| `stores/convenioMarcoStore.ts` | Modify | Preserve `anexos` when loading PPS `form_data` so edit mode can hydrate the form. |
| `app/api/convenios/route.ts` | Modify | Recognize PPS (`convenioTypeId === 1`) with attachments, persist refs inside `form_data`, and move pending files into the convenio folder. |
| `app/api/convenios/[id]/route.ts` | Modify | Preserve/round-trip `form_data.anexos` on PATCH and regeneration so unchanged attachments remain linked. |
| `tests/integration/api-convenios.test.ts` | Modify | Cover PPS create with attachment refs and folder-based storage. |
| `tests/integration/api-convenio-admin-edit.test.ts` | Modify | Cover PPS/admin regeneration preserving existing refs unless changed. |
| `tests/e2e/helpers/convenio-submission.ts` | Modify | Add PPS helper branch for optional attachments payload assertions. |
| `tests/e2e/convenio-submission-*.spec.ts` | Modify | Verify PPS submit works with and without attachments. |

## Interfaces / Contracts

```ts
type PPSAttachmentRef = {
  id: string; // client-only row id for UI
  name: string;
  mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  size?: number;
  file?: File; // present only before upload
  driveFileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  uploadStatus: "pending" | "uploading" | "uploaded" | "error";
  uploadError?: string;
  existing?: boolean;
};
```

Request contract:

```ts
anexos: Array<Pick<PPSAttachmentRef,
  "name" | "mimeType" | "size" | "driveFileId" | "webViewLink" | "webContentLink"
>>
form_data.anexos: same array
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Attachment state mapping/hydration helpers if extracted | Vitest: existing refs become `uploaded/existing`, pending files keep `File`. |
| Integration | POST/PATCH persist `form_data.anexos`; PPS create/edit hits folderized Drive path | Extend current API route tests with mocked `uploadConvenioEspecificoOAuth`. |
| E2E | PPS submit with no attachments, new attachment, and preserved attachment on edit | Playwright intercepts `/api/convenios` payload and asserts refs-only metadata. |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] Confirm whether PPS should allow multiple attachments like Marco, or a single optional attachment despite the spec wording using plural references.
