# Delta for Admin Convenio Management

## ADDED Requirements

### Requirement: Folder-based Document Generation

The system MUST create a dedicated Drive folder by default for all new convenios and place the generated `.docx` inside it.

#### Scenario: Admin generates a new document
- GIVEN a new convenio is being processed
- WHEN the document generation is triggered
- THEN the system MUST create a new Drive folder
- AND place the generated `.docx` inside this folder

### Requirement: Asset Storage within Folders

The system MUST store signed admin PDFs and future related assets inside the same folder as the main convenio.

#### Scenario: Admin uploads a signed PDF to a folderized convenio
- GIVEN a convenio uses the folderized structure
- WHEN an admin uploads a signed PDF
- THEN the system MUST upload the PDF into the existing Drive folder

### Requirement: Legacy Convenio Automatic Migration

The system MUST migrate an old single-file convenio into a new folder automatically when it receives signed-PDF handling or is regenerated, while leaving untouched legacy files valid.

#### Scenario: Admin uploads a signed PDF to a legacy single-file convenio
- GIVEN a convenio uses the legacy single-file structure
- WHEN an admin uploads a signed PDF
- THEN the system MUST create a new folder
- AND move the legacy `.docx` into the folder
- AND upload the signed PDF into the folder
- AND update the DB link to point to the new folder

#### Scenario: Untouched legacy convenios remain valid
- GIVEN a legacy single-file convenio exists
- WHEN no edits or new assets are added
- THEN the system MUST NOT migrate the storage structure

### Requirement: Status-Move URL Detection

The system MUST correctly detect whether a Drive link points to a single file (`/d/`) or a folder (`/folders/`) to apply the correct move logic during status transitions.

#### Scenario: Status changes for folderized convenio
- GIVEN a convenio's Drive URL contains `/folders/`
- WHEN its status changes (e.g., to archive)
- THEN the system MUST move the entire folder to the target directory

#### Scenario: Status changes for legacy file convenio
- GIVEN a convenio's Drive URL contains `/d/`
- WHEN its status changes
- THEN the system MUST move the single file to the target directory

## MODIFIED Requirements

### Requirement: Document Regeneration and Status Reset

The system MUST fully regenerate the document inside a new Drive folder and set the status to `enviado` when an admin edits a convenio, regardless of its previous status.
(Previously: The system fully regenerated the document as a single file and set the status to `enviado`)

#### Scenario: Admin saves edits for an approved convenio
- GIVEN an admin is editing an `aprobado` convenio
- WHEN they save the form
- THEN the system MUST archive the previously approved document
- AND regenerate a new document inside a new folder in the `PENDING` directory
- AND set the convenio status back to `enviado`

#### Scenario: Admin saves edits for a non-approved convenio
- GIVEN an admin is editing a non-approved convenio (e.g., `revision` or `enviado`)
- WHEN they save the form
- THEN the system MUST delete the old asset (file or folder) from Google Drive
- AND regenerate a new document inside a new folder in the `PENDING` directory
- AND set the convenio status to `enviado`