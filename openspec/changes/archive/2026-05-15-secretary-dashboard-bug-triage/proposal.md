# Proposal: Secretary Dashboard Bug Triage

## Intent

Fix secretary-facing convenio workflow bugs that block finding records, reviewing PPS details, and entering valid foreign/no-CUIT data. User impact: Secretaría users should list/search convenios predictably, create PPS data without unnecessary DB lookups, and see accepted PPS information correctly.

## Scope

### In Scope
- Remove the navbar/top search component from protected layout.
- Add working search and 10-item pagination to `/protected/convenios-lista` without fetching all convenios at once.
- Use a code-defined PPS student career source instead of querying DB for rarely changing career options.
- Investigate and fix missing Facultad responsible person in final/accepted PPS convenio view.
- Flexibilize DNI/CUIT fields for foreign people/entities and cases without CUIT.

### Out of Scope
- Adenda template/model, decano/header template updates, attachments, non-Gmail registration.
- Admin year editing, approved convenio editing, and delete/archive decisions.

## Capabilities

### New Capabilities
- `secretary-convenio-management`: Secretary convenio list search/pagination, PPS visible data, static PPS career options, and flexible identity/tax validation.

### Modified Capabilities
- None: no existing OpenSpec specs are present.

## Approach

Remove unused global search from `app/protected/layout.tsx`. Move search responsibility to `/protected/convenios-lista`, mirroring admin table behavior while making data access paginated server-side. Extract/define a stable PPS career option source in code and reuse it in the PPS student career selector. Trace PPS Facultad responsible fields from form payload/API/detail display/final view and map the correct value. Relax DNI/CUIT validation through shared helpers or localized schema changes with template-safe fallback labels.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/protected/layout.tsx` | Removed | Delete unused navbar search UI. |
| `app/protected/convenios-lista/*` | Modified | Search and 10-per-page pagination. |
| `app/protected/admin/data-table.tsx` | Reference | Existing search behavior to emulate. |
| `app/components/forms/convenio-particular/ConvenioParticularForm.tsx` | Modified | PPS career selector and DNI/CUIT flexibility. |
| `app/components/forms/**` | Modified | Flexible identity/tax validators where duplicated. |
| `app/components/convenios/convenio-info-display.tsx` | Modified | Show Facultad responsible in accepted/final PPS view. |
| `app/api/convenios/*` | Modified | Paginated list query and field mapping if needed. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Search/pagination changes alter visible records | Med | Cover with Playwright and integration checks. |
| Relaxed DNI/CUIT breaks templates | Med | Use explicit fallback text and manual document/view validation. |
| Facultad field source is ambiguous | Med | Trace persisted payload before changing display mapping. |

## Rollback Plan

Revert this change set: restore protected layout search markup, previous list loading behavior, previous career source, original validators, and prior PPS display mapping.

## Dependencies

- Strict TDD remains active for apply/verify; no external service changes required.

## Success Criteria

- [ ] `/protected/convenios-lista` searches like admin and paginates 10 convenios per page.
- [ ] The page does not fetch all convenios at once.
- [ ] Navbar/top search no longer appears.
- [ ] PPS career options come from code-defined source.
- [ ] Accepted/final PPS view shows Facultad responsible person.
- [ ] Foreign/no-CUIT DNI/CUIT cases validate and render safely.
- [ ] Test plan includes Playwright for list search/pagination and PPS visibility, unit/integration for validators/helpers, and manual final document/view validation where needed.
