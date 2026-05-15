## Exploration: secretary-dashboard-bug-triage

### Current State
The app is a Next.js 14 App Router system with Supabase-backed convenios, role/profile approval, scoped classification, DOCX templates under `templates/`, and Vitest/Playwright tests. Convenio creation is split between `ConvenioFormLayout` and per-type forms; persistence runs through `POST/PATCH /api/convenios`; admin review actions use `/api/admin/convenios/[id]/actions` and a TanStack `DataTable`.

Several secretary requests are real code issues, but they touch different risk zones: form validation, admin edit/delete controls, global layout search, document templates, and database/admin data correction. This should not be one PR.

### Affected Areas
- `app/components/dashboard/ConvenioTypeCard.tsx`, `app/lib/dashboard/get-convenio-types.ts`, `app/api/convenio-types/route.ts`, `app/components/convenios/convenio-configs.tsx`, `app/api/convenios/route.ts`, `templates/` — item 1, Adenda needs a new convenio type, route mapping, form/config, API type/template mapping, and DOCX model(s).
- `app/actions.ts`, `app/sign-up/SignUpForm.tsx`, `app/pending-approval/page.tsx`, Supabase Auth settings — item 2 is likely product/config: local sign-up accepts any email, then `is_approved=false`; if non-Gmail cannot register, verify Supabase provider/email-confirmation settings manually.
- `app/protected/admin/AdminPanelClient.tsx`, `app/protected/admin/ReclassifyConveniosPanel.tsx`, `app/api/admin/convenios/[id]/classification/route.ts`, `app/lib/admin/convenio-year-filters.ts`, `supabase/migrations/*agreement_year*` — item 3 overlaps existing `admin-reclasificar-convenios`; admin year edit already appears designed via Reclasificar/classification, but loaded legacy data may need admin correction or data migration.
- `app/components/convenios/ConvenioFormLayout.tsx`, `app/api/org-scope/route.ts`, `supabase/migrations/20260320193000_practice_career_optional_secretario.sql` — item 4 comes from the generic placeholder `Carrera (obligatoria)` when Practice + SA requires `career_id`; may be expected, but copy can be improved if secretary expects no career for Marco PPS.
- `app/components/forms/convenio-practica-marco/ConvenioPracticaMarcoForm.tsx`, `app/components/forms/convenio-particular/ConvenioParticularForm.tsx`, `app/components/forms/convenio-marco/MultiInstitutionManager.tsx`, `app/components/forms/acuerdo-colaboracion/AcuerdoColaboracionForm.tsx` — item 5: DNI/CUIT schemas currently enforce numeric/min/max in multiple forms; foreign IDs/no-CUIT require relaxed optional/string validation and template-safe fallbacks.
- `app/components/convenios/convenio-info-display.tsx`, `app/protected/convenio-detalle/[id]/page.tsx`, `stores/convenioMarcoStore.ts`, `app/api/convenios/[id]/route.ts` — item 6: UI only exposes edit for `borrador`; API allows owner/admin PATCH broadly. Admin edit after approval needs explicit UI and safe status/document-regeneration rules.
- `app/components/convenios/convenio-info-display.tsx`, `app/components/forms/convenio-particular/ConvenioParticularForm.tsx`, `templates/convenio-particular-de-practica-supervisada.docx` — item 7: `facultad_docente_tutor_nombre`/`practica_tutor_docente` is captured in form data but detail view displays only `data.alumno_tutor`; display/template mapping likely hides “responsable por parte de facultad”.
- `app/components/forms/convenio-particular/ConvenioParticularForm.tsx`, `app/api/convenios/route.ts`, `app/api/convenios/[id]/route.ts`, `app/lib/google-drive.ts`, `app/lib/client-drive-upload.ts` — item 8: attachments exist for Marco and Específico, not Particular PPS; reuse resumable upload/Drive folder strategy.
- `app/api/convenios/[id]/route.ts`, `app/protected/admin/columns.tsx`, `supabase/migrations/20260319193000_refactor_convenios_org_architecture.sql` — item 9: DELETE endpoint and RLS owner/admin delete policy already exist, but admin UI does not expose delete; product decision required for hard delete vs soft archive.
- `app/protected/layout.tsx`, possibly `app/protected/convenios-lista/ConveniosListaClient.tsx` and `app/protected/admin/data-table.tsx` — item 10: top header search input is purely visual with no state/handler; admin table search works locally.
- `app/components/forms/convenio-particular/ConvenioParticularForm.tsx`, `app/components/convenios/ConvenioFormLayout.tsx`, `app/api/org-scope/route.ts` — item 11: `alumno_carrera` is a free text input despite `scopeCareerId` being selected in the classification block; should select from the same career catalog and persist both `career_id` and label.
- `templates/*.docx`, `app/components/convenios/documento-preview-content.tsx`, `conveniotexto.md`, possibly DB `convenio_types.template_content` — item 12: template-only/document work: update decano name/header phrase and add Adenda models; DOCX content needs manual review/export.

### Requirement Classification and Test Fit
1. Adenda with Word + multiple modifications — enhancement + template/document work. Test: unit for type/slug mapping; Playwright for form payload; manual DOCX visual review.
2. Non-Gmail accounts active for registration — product/config/admin workflow. Test: manual Supabase Auth/config reproduction first; integration only if code changes profile approval.
3. Admin edit agreement year / loaded records 2025 — data/admin migration + existing admin enhancement. Test: integration for classification route/year; manual DB/admin verification for existing data.
4. Marco PPS career `(obligatoria)` — bug/copy/product-rule clarification. Test: Playwright if UI requirement changes; unit/integration if scope validation changes.
5. DNI/CUIT flexible/no CUIT — enhancement with validation risk. Test: unit for Zod schema helpers once extracted; Playwright for foreign-ID/no-CUIT flows; manual DOCX output.
6. Admin can edit approved convenio data — enhancement/risk decision. Test: integration for PATCH auth/status; Playwright for admin edit path; manual Drive document regeneration behavior.
7. GUALOK PPS missing Facultad responsible — bug. Test: unit/display mapping if extracted, Playwright/detail render with fixture, manual template output.
8. PPS optional attachments — enhancement. Test: Playwright mocked upload/payload, unit for payload mapper, manual Drive folder behavior.
9. Delete convenio button — product decision + UI/API enhancement. Test: integration/RLS for delete policy if changed; Playwright for admin action and confirmation; manual audit/rollback check.
10. Top search not working — bug. Test: Playwright for search navigation/filter behavior; small component/unit only if search logic is extracted.
11. PPS student career should be selected — enhancement/bug. Test: Playwright for career select and payload; unit for career label mapping.
12. Decano/header/templates/Adenda models — template/document work. Test: manual DOCX generated files; optional snapshot/text extraction if reliable.

### Approaches
1. **Bug-first triage slice** — Fix confirmed UI/data bugs only: top search behavior, PPS Facultad responsible display, and flexible DNI/CUIT validation copy/schema.
   - Pros: Low risk, immediately useful, reviewable under 400 lines if scoped tightly.
   - Cons: Leaves product decisions (delete, approved edit, Adenda) for later.
   - Effort: Medium.

2. **Admin-management slice** — Focus on year correction, approved admin edits, and delete/archive controls.
   - Pros: Solves secretary/admin operational pain.
   - Cons: Higher data integrity risk; needs explicit hard-delete vs soft-delete and document regeneration decisions.
   - Effort: High.

3. **Document-template slice** — Add Adenda type/templates and decano/header changes.
   - Pros: Separates DOCX/manual review from code behavior.
   - Cons: Requires Word-provided models and manual acceptance; likely crosses API/form/template mappings.
   - Effort: High.

### Recommendation
Start with a small bug-first proposal: (a) make the top search either functional for convenios or remove/route it intentionally, (b) show the Facultad responsible/docente tutor for Convenio Particular PPS detail, and (c) relax DNI/CUIT validation for foreign/no-CUIT cases behind clear optional labels. This is the lowest-risk slice with clear reproductions, limited data migration risk, and good Playwright coverage.

After that, split separate proposals for: admin data management (year/edit/delete), PPS attachments + career select, and Adenda/template work. The current list is too broad for a safe single PR.

### Risks
- Existing active OpenSpec changes already target admin filters/year/classification; avoid duplicating `admin-reclasificar-convenios` work.
- Relaxing CUIT/DNI validation can break templates if placeholders assume numeric values; templates need fallback text like “No informa / documento extranjero”.
- Approved convenio edits may need Drive document regeneration and audit logging, not just DB PATCH.
- Hard deletion can remove audit/history and Drive files; soft archive is safer unless users explicitly accept hard delete.
- DOCX templates are binary and need manual verification; code search cannot inspect actual Word placeholders reliably.
- Supabase Auth/non-Gmail behavior may be configuration, not repo code.

### Ready for Proposal
Yes, for the bug-first slice. Tell the user that Adenda, delete/edit-approved, year migration, PPS attachments, and template mass updates should be separate reviewable changes because they cross different risk boundaries.
