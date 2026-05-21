# Proposal: Folderized Convenio Storage

## Intent
Migrate from a single-file `.docx` storage model to a folder-based model for all convenios to support multiple related assets (e.g., signed PDFs) within a single unified location, improving organization and lifecycle management without requiring a database migration.

## Scope

### In Scope
- Creating a Drive folder by default for all new convenios (current and future types).
- Moving the generated `.docx` inside the new folder.
- Storing signed admin PDFs and other assets inside the corresponding folder.
- Modifying the regeneration flow: edited/regenerated legacy convenios automatically migrate to the new folder scheme.
- Migrating status move logic to handle both legacy single-file and new folder-based assets (distinguished by URL structure `/folders/` vs `/d/`).
- Cleaning up shared Drive helper functions as needed.

### Out of Scope
- Adding explicit asset-type metadata to the database schema.
- Retroactive mass migration of existing legacy convenios to folders.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `admin-convenio-management`: Document generation now produces a Drive folder instead of a single `.docx`. Adding/updating signed PDFs places them in the folder. Moving a convenio checks URL to handle folder vs file move. Regeneration of legacy convenios migrates them to a folder.
- `secretary-convenio-management`: Same storage changes for document generation, regeneration, and status moves.

## Approach
Implement a practical hybrid storage system. When a new convenio is created, a folder is provisioned in Google Drive and its ID is saved. The initial `.docx` and any subsequent files (signed PDFs, etc.) are placed inside this folder. Legacy convenios remain as direct files until they are regenerated. The system will differentiate between legacy files and new folders by examining the Drive URL (`/folders/` vs `/d/`). Operations like moving the asset upon status change will handle the asset appropriately based on its type.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/services/drive/` | Modified | Update helpers to support folder creation and contents management. |
| `src/services/convenio/` | Modified | Update generation, regeneration, and move logic to handle folders and URL detection. |
| `src/controllers/` | Modified | Update relevant endpoints handling convenio creation and asset uploads. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Status move logic fails on unhandled URL format | Low | Add robust URL parsing/validation and tests for both `/folders/` and `/d/`. |
| Drive API quota limits on multi-file operations | Low | Batch operations or handle retries appropriately. |

## Rollback Plan
Revert code changes. Any folders created during the new deployment will remain (no automatic deletion to prevent data loss) but will be inaccessible via the UI if reverted. Manual mapping might be required to restore single-file links if a critical rollback is needed.

## Dependencies
- Google Drive API integration

## Success Criteria
- [ ] New convenios successfully create a Drive folder containing the `.docx`.
- [ ] Uploading a signed PDF saves it in the correct folder.
- [ ] Regenerating an old convenio migrates it to a folder.
- [ ] Status changes move the folder (or file for legacy) correctly.