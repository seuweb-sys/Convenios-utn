# Delta for secretary-convenio-management

## ADDED Requirements

### Requirement: Optional PPS attachments

The PPS form MUST provide an optional UI control in the "Detalles de la práctica" section to attach PDF or DOC files. The uploaded files MUST be sent directly from the client to Google Drive. The form submission MUST only send file metadata/references to the backend, not the raw file bytes. The backend MUST move these uploaded files into the main folder created for the convenio.

#### Scenario: Optional attachment is successfully uploaded
- GIVEN the secretary fills out the PPS form
- AND selects a valid PDF or DOC file in the attachments field
- WHEN the file is selected
- THEN the file MUST upload directly from the client to Google Drive
- AND the form submission MUST send the returned drive file reference to the server.

#### Scenario: Attachment is placed in the final convenio folder
- GIVEN the secretary submitted a PPS form with an attachment reference
- WHEN the backend processes the submission
- THEN the backend MUST move the referenced attachment from the pending location to the newly created convenio folder
- AND persist the attachment reference in the database alongside the new convenio.

#### Scenario: PPS form is submitted without attachments
- GIVEN the secretary fills out the PPS form
- AND does not select any file in the attachments field
- WHEN the form is submitted
- THEN the submission MUST succeed
- AND the backend MUST create the folder and document normally without attempting to move pending files.

#### Scenario: Editing PPS preserves existing attachments
- GIVEN a secretary edits a PPS convenio that already has an attachment
- WHEN the form loads
- THEN the existing attachment reference MUST be preserved
- AND saving the form without modifying attachments MUST keep the existing attachment safely linked.