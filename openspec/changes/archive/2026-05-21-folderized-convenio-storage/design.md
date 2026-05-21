# Design: Folderized Convenio Storage

All new convenio documents will be stored as a Google Drive folder, with the generated `.docx`, signed PDF, and future related assets colocated there. Legacy single-file records will stay valid until an edit, regeneration, or signed-PDF flow lazily migrates them; strict TDD is active for implementation in the next phase.

## Technical Approach

Centralize Drive asset detection and folder migration behind shared helpers, then update the admin and secretary routes to call those helpers instead of branching on `convenio_type_id === 4`. The DB remains unchanged: `convenios.document_path` continues storing either a file URL (`/d/`) or folder URL (`/folders/`), and runtime parsing decides behavior.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Detect storage type | Parse `document_path` URL structure, not DB flags | Matches spec, avoids schema changes, and works for legacy plus new records. |
| Migration trigger | Lazy migration on edit/regeneration/signed-PDF flows only | Minimizes Drive churn and preserves untouched legacy links. |
| Shared logic location | Add a convenio-focused helper module instead of duplicating route logic | Current duplication exists in `app/api/convenios/[id]/route.ts`, `app/api/admin/convenios/[id]/actions/route.ts`, and signed-PDF routes. |

## Data Flow

New create/regenerate:

`route -> generate buffer -> ensure/create convenio folder -> upload main doc -> save folder webViewLink in document_path`

Lazy migration for legacy records:

`route -> parse legacy file URL -> create folder in current target parent -> move old doc into folder -> upload/replace new asset -> update document_path to folder URL`

Status move:

`route -> parse document_path -> folder => moveFolderToFolderOAuth | file => moveFileToFolderOAuth`

## File Changes

| File | Action | Description |
|---|---|---|
| `app/lib/convenio-drive.ts` | Create | Shared parsing/migration helpers for convenio Drive assets. |
| `app/lib/google-drive.ts` | Modify | Expose any missing primitives for folder migration/reuse, keeping OAuth-based uploads as the low-level boundary. |
| `app/api/convenios/route.ts` | Modify | Make all new convenio creation flows create folder storage by default, regardless of type/anexos. |
| `app/api/convenios/[id]/route.ts` | Modify | Regenerate into folders, lazily migrate legacy records, and remove `type_id === 4` storage assumptions. |
| `app/api/admin/convenios/[id]/signed-pdf/route.ts` | Modify | Upload signed PDFs into existing convenio folder or migrate legacy file first. |
| `app/api/admin/convenios/[id]/signed-pdf/resumable-session/route.ts` | Modify | Resolve destination folder with the same shared logic before creating resumable sessions. |
| `app/api/admin/convenios/[id]/actions/route.ts` | Modify | Move file vs folder based on parsed URL instead of convenio type. |
| `tests/integration/*convenio*.test.ts` | Modify | Expand coverage for folder-default creation and legacy lazy migration. |

## Interfaces / Contracts

```ts
type DriveAssetKind = "file" | "folder";

type ConvenioDriveAsset = {
  kind: DriveAssetKind;
  itemId: string;
  webViewLink: string;
};

async function resolveConvenioDriveAsset(documentPath: string): Promise<ConvenioDriveAsset | null>;
async function ensureConvenioFolder(args: {
  convenioTitle: string;
  parentFolderId: string;
  currentDocumentPath?: string | null;
}): Promise<{ folderId: string; folderWebViewLink: string; migratedFromFile: boolean }>;
```

Contract: routes own authorization, DB writes, and status rules; `app/lib/convenio-drive.ts` owns URL parsing, folder creation, legacy file-to-folder migration, and choosing the correct low-level Drive operation.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | URL parsing and folder/file detection | Vitest cases for `/folders/`, `/file/d/`, invalid URLs, and unchanged null paths. |
| Integration | New create/edit/signed-PDF/status flows | Mock Drive helpers in route tests, following existing `tests/integration/api-convenio-admin-edit.test.ts` style. |
| E2E | Not required in this change’s first slice | Defer unless route integration gaps appear during strict TDD. |

## Migration / Rollout

No DB migration required. Rollout is code-only: newly created convenios become folderized immediately, and legacy records migrate opportunistically when touched by edit/regeneration/signed-PDF flows.

## Open Questions

- [ ] When migrating a legacy approved convenio during signed-PDF upload, should the new folder always be created under `DRIVE_FOLDERS.APPROVED` even if the original file is misplaced elsewhere?
