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

The system MUST fully regenerate the document and set the status to `enviado` when an admin edits a convenio, regardless of its previous status.

#### Scenario: Admin saves edits for an approved convenio
- GIVEN an admin is editing an `aprobado` convenio
- WHEN they save the form
- THEN the system MUST archive the previously approved document
- AND regenerate a new document in the `PENDING` folder
- AND set the convenio status back to `enviado`

#### Scenario: Admin saves edits for a non-approved convenio
- GIVEN an admin is editing a non-approved convenio (e.g., `revision` or `enviado`)
- WHEN they save the form
- THEN the system MUST delete the old document from Google Drive
- AND regenerate a new document in the `PENDING` folder
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