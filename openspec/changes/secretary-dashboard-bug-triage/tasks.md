# Tasks: Secretary Dashboard Bug Triage

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450-650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 list/search → PR2 PPS/identity → PR3 E2E/manual polish |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Bounded secretary list search/pagination and remove top search | PR 1 | Include route/page tests and list E2E. |
| 2 | PPS careers, DNI/CUIT helpers, Facultad display | PR 2 | Depends on shared helper tests first. |
| 3 | Cross-flow E2E/manual DOCX validation | PR 3 | Keep review diff small if tests are large. |

## Phase 1: RED tests for list behavior

- [x] 1.1 Add failing Vitest coverage for `app/protected/convenios-lista/page.tsx` query params: `q`, `page`, count, invalid page, limit 10.
- [x] 1.2 Add failing API tests for `app/api/convenios/route.ts`: bounded `q` results and `full=true` compatibility.
- [x] 1.3 Add failing Playwright checks: no protected top search, list search resets to page 1, max 10 cards.

## Phase 2: GREEN list implementation

- [x] 2.1 Modify `app/protected/layout.tsx` to remove navbar/top search and unused imports only.
- [x] 2.2 Modify `app/protected/convenios-lista/page.tsx` to parse URL params and use Supabase `select(..., { count: "exact" }).range()`.
- [x] 2.3 Modify `app/protected/convenios-lista/ConveniosListaClient.tsx` to update URL search/page params and render server pagination.
- [x] 2.4 Modify `app/api/convenios/route.ts` to support bounded `q`/count while preserving existing filters and `full=true`.

## Phase 3: RED tests for PPS/forms

- [x] 3.1 Add failing unit tests for `app/lib/forms/identity-validation.ts`: DNI numeric 1-20, CUIT optional numeric, empty string normalization.
- [x] 3.2 Add failing unit tests for `app/lib/forms/pps-careers.ts`: stable options, no DB dependency, usable labels/values.
- [x] 3.3 Add failing component/integration tests for PPS career select and Facultad responsible display fallback in `convenio-info-display.tsx`.

## Phase 4: GREEN PPS/forms implementation

- [x] 4.1 Create `app/lib/forms/identity-validation.ts` and replace duplicated DNI/CUIT rules in the four convenio form files.
- [x] 4.2 Create `app/lib/forms/pps-careers.ts` and wire selector in `ConvenioParticularForm.tsx`.
- [x] 4.3 Update `ConvenioParticularForm.tsx` to persist CUIT as `""` and keep PPS responsible keys.
- [x] 4.4 Update `app/components/convenios/convenio-info-display.tsx` to show `facultad_docente_tutor_nombre` or `practica_tutor_docente` safely.

## Phase 5: Verification and cleanup

- [ ] 5.1 Run unit/integration/E2E suites for changed scenarios; fix regressions with tests first.
- [ ] 5.2 Manually generate/view PPS DOCX with empty CUIT and record result in verify report.
