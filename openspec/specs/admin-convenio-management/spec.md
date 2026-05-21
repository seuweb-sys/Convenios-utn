# Admin Convenio Management Specification

## Purpose

Defines the capabilities for administrators to review, correct, and directly edit submitted convenios. It enables direct interventions to unblock trivially incorrect documents while preserving the asynchronous applicant correction workflow.

## Requirements

### Requirement: Admin Action Menu

The system MUST display an "Editar convenio" action in the admin list alongside the existing "Solicitar corrección" action.

#### Scenario: Admin views available actions for a convenio
- GIVEN an admin is viewing the convenio list
- WHEN they open the row actions menu
- THEN the system MUST show both "Solicitar corrección" and "Editar convenio" options

### Requirement: Edit Mode Navigation

The system MUST reuse the existing recovery/correction flow for admin direct edits.

#### Scenario: Admin initiates an edit
- GIVEN an admin selects "Editar convenio"
- WHEN the action executes
- THEN the system MUST navigate to `/protected/convenio-detalle/[id]?mode=correccion`
- AND the applicant correction UI MUST be presented

### Requirement: Destructive Edit Warning for Approved Convenios

The system MUST warn admins before allowing edits to `aprobado` convenios, because editing will archive the approved document and reset the status.

#### Scenario: Admin attempts to edit an approved convenio
- GIVEN a convenio is in `aprobado` status
- WHEN an admin navigates to the edit mode for that convenio
- THEN the system MUST display a destructive warning indicating that the document will be regenerated and status reset to `enviado`
- AND the system MUST require explicit confirmation before allowing the edit

### Requirement: Document Regeneration and Status Reset

The system MUST fully regenerate the document inside a new Drive folder and set the status to `enviado` when an admin edits a convenio, regardless of its previous status.

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

### Requirement: Preserved Applicant Correction Flow

The system MUST NOT modify the existing asynchronous applicant correction flow.

#### Scenario: Admin requests a correction
- GIVEN an admin selects "Solicitar corrección"
- WHEN they fill out the correction message and send
- THEN the system MUST execute the existing behavior (send email to applicant and move status to `correccion_solicitada`)

### Requirement: Audit Logging of Admin Edits

The system MUST record explicit audit events when an admin performs a direct edit and document regeneration.

#### Scenario: Admin direct edit is saved
- GIVEN an admin has successfully saved an edited convenio
- WHEN the backend processes the update
- THEN the system MUST record an entry in `activity_log` documenting that the admin directly edited the convenio and triggered document regeneration

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