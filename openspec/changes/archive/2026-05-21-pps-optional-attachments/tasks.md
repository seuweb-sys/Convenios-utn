# Tasks: pps-optional-attachments

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-400 lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception accepted) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Core Form Infrastructure

- [x] 1.1 Create RED test in `tests/integration/api-convenios.test.ts` for POST `/api/convenios` with `anexos` and `convenioTypeId=1`.
- [x] 1.2 Update `app/api/convenios/route.ts` (GREEN) to process `anexos` into folderized storage for PPS, storing refs in `form_data`.
- [x] 1.3 Refactor `/api/convenios` if needed.
- [x] 1.4 Create RED test in `tests/integration/api-convenio-admin-edit.test.ts` for PATCH preserving `form_data.anexos`.
- [x] 1.5 Update `app/api/convenios/[id]/route.ts` (GREEN) to persist `form_data.anexos` on updates.
- [x] 1.6 Update `stores/convenioMarcoStore.ts` to preserve `form_data.anexos` to state during edit mode.

## Phase 2: Client Form Implementation

- [x] 2.1 Update `app/components/forms/convenio-particular/ConvenioParticularForm.tsx` to add `PPSAttachmentRef` state and UI control in `Detalles de la Práctica`.
- [x] 2.2 In `ConvenioParticularForm.tsx`, add chunked upload logic reusing `uploadFileToDriveInChunks`.
- [x] 2.3 In `ConvenioParticularForm.tsx`, hydrate attachment UI from `form_data.anexos` in edit mode.
- [x] 2.4 In `ConvenioParticularForm.tsx`, include `anexos` metadata in the POST/PATCH payload payload and `form_data`.

## Phase 3: Testing & Verification

- [x] 3.1 In `tests/e2e/helpers/convenio-submission.ts`, add helper options for appending `anexos` to PPS payloads.
- [x] 3.2 Update `tests/e2e/convenio-submission-*.spec.ts` with scenarios for PPS without attachments.
- [x] 3.3 Add E2E test verifying PPS submission succeeds with attachment refs.
- [x] 3.4 Add E2E test verifying PPS edit mode preserves existing attachments.
