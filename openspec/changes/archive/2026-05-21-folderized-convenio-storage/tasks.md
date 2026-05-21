# Tasks: Folderized Convenio Storage

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-400 lines |
| 400-line budget risk | High |
| Chained PRs recommended | No (user overrode) |
| Suggested split | single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full implementation of folderized storage | PR 1 | Allowed as size:exception single PR |

## Phase 1: Foundation (Drive Helper & URL Parsing)

- [x] 1.1 `tests/unit/convenio-drive.test.ts`: Write test for `resolveConvenioDriveAsset` recognizing `/d/` and `/folders/` URLs.
- [x] 1.2 `tests/unit/convenio-drive.test.ts`: Write test for `ensureConvenioFolder` covering new folder creation, legacy migration, and targeting `DRIVE_FOLDERS.APPROVED` for approved items.
- [x] 1.3 `app/lib/convenio-drive.ts`: Implement `resolveConvenioDriveAsset` and `ensureConvenioFolder` to pass the tests.
- [x] 1.4 `app/lib/google-drive.ts`: Expose or verify primitives required by `convenio-drive.ts` (e.g., `moveFileToFolderOAuth`).

## Phase 2: Core Implementation (Admin & Secretary Document Generation)

- [x] 2.1 `tests/integration/api-convenios.test.ts`: Update create tests to assert folder generation instead of file generation.
- [x] 2.2 `app/api/convenios/route.ts`: Modify `POST` to generate a folder, place the `.docx` inside, and store the folder URL.
- [x] 2.3 `tests/integration/api-convenio-admin-edit.test.ts`: Update regeneration tests to assert new folder creation in `PENDING` and status reset to `enviado`.
- [x] 2.4 `app/api/convenios/[id]/route.ts`: Modify `PUT` to use `ensureConvenioFolder` for regeneration and lazily migrate legacy files.

## Phase 3: Integration (Signed PDF & Status Move)

- [x] 3.1 `tests/integration/api-admin-convenios-actions.test.ts`: Write tests for status moves handling both legacy files and folderized convenios.
- [x] 3.2 `app/api/admin/convenios/[id]/actions/route.ts`: Modify status move logic to use `resolveConvenioDriveAsset` and move file vs folder.
- [x] 3.3 `tests/integration/api-admin-convenios-signed-pdf.test.ts`: Write tests asserting signed PDF upload to a legacy approved record creates a folder in `APPROVED`.
- [x] 3.4 `app/api/admin/convenios/[id]/signed-pdf/route.ts`: Refactor to use `ensureConvenioFolder` before uploading.
- [x] 3.5 `app/api/admin/convenios/[id]/signed-pdf/resumable-session/route.ts`: Refactor to use `ensureConvenioFolder` before session creation.

## Phase 4: Cleanup & Polish

- [x] 4.1 `app/api/*`: Remove old `convenio_type_id === 4` storage branching from routes where applicable.
