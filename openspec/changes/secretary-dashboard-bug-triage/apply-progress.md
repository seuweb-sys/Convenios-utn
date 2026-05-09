## Apply Progress: secretary-dashboard-bug-triage

**Mode**: Strict TDD  
**Delivery**: maintainer-approved single-branch implementation with work-unit commits; no PR/push.

### Completed Tasks
- [x] 1.1 Added Vitest coverage for convenio list URL query helpers: `q`, `page`, invalid page, page size 10.
- [x] 1.2 Added Vitest coverage for convenio API pagination helpers: bounded `q` results and `full=true` compatibility.
- [x] 1.3 Replaced the synthetic secretary convenio list Playwright harness with browser coverage that renders production components through a Next route: protected header component, real `ConveniosListaClient`, URL-backed search, and page-size-10 pagination.
- [x] 2.1 Removed protected navbar/top search and unused search icon import; extracted the protected header to a reusable production component for route/component browser proof.
- [x] 2.2 Added server-side URL parsing, Supabase exact count, search filters, and `.range()` pagination for `/protected/convenios-lista`.
- [x] 2.3 Added URL-driven search/filter/page controls and server pagination rendering in `ConveniosListaClient`; extracted URL construction to `buildConveniosListaHref` for deterministic testing; reset the loading state when URL-backed props update.
- [x] 2.4 Added bounded API pagination/search helpers, exact count headers, and preserved `full=true` array compatibility.
- [x] 3.1 Added unit tests for DNI numeric 1–20 and optional numeric CUIT empty-string behavior.
- [x] 3.2 Added unit tests proving PPS career options are code-defined stable labels/values.
- [x] 3.3 Added display helper tests for Facultad responsible fallback.
- [x] 4.1 Added shared identity validation and applied DNI/CUIT rules across the four convenio form files.
- [x] 4.2 Added `PPS_CAREER_OPTIONS` and wired the PPS student career field as a selector.
- [x] 4.3 Normalized PPS CUIT persistence to `""` while preserving responsible keys.
- [x] 4.4 Displayed Facultad responsible using `facultad_docente_tutor_nombre` with `practica_tutor_docente` fallback.
- [x] 5.1 Ran relevant unit/E2E suites plus full Vitest/typecheck; deterministic E2E now renders production component code instead of static HTML.
- [x] 5.2 Added automated DOCX template-data coverage proving empty CUIT is preserved as a safe empty string; full visual/manual template review can still record final document evidence during verify if desired.

### TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1/2.2/2.3 | `tests/unit/convenios-lista-query.test.ts` | Unit | N/A (new helper) | ✅ Import failed before helper existed | ✅ `npm test -- tests/unit/convenios-lista-query.test.ts` 3/3 | ✅ empty q, invalid page, page 2, search filter | ✅ URL parsing extracted to pure helper |
| 1.2/2.4 | `tests/integration/api-convenios-query.test.ts` | Integration-helper | N/A (new helper) | ✅ Import failed before helper existed | ✅ `npm test -- tests/integration/api-convenios-query.test.ts` 3/3 | ✅ q default, explicit limit/offset, full=true | ✅ API parsing extracted to pure helper |
| 1.3/2.1/2.3/5.1 | `tests/e2e/secretary-convenios-lista.spec.ts` | E2E / production-component route | ⚠️ Previous synthetic harness passed but verify rejected it as non-production coverage | ✅ Replaced harness with tests for a real Next page route that did not exist; RED failed because no production component route/search/pagination rendered | ✅ `npm run test:e2e -- tests/e2e/secretary-convenios-lista.spec.ts` 2/2 | ✅ Header search absence + first page 10 cards; page 2 has 2 cards; search from page 2 resets to `page=1&q=Otro` and renders one bounded result with disabled pagination | ✅ Extracted `ProtectedHeader`; added non-production Playwright route rendering real components; fixed `ConveniosListaClient` loading reset after URL-backed prop updates |
| 3.1/4.1 | `tests/unit/identity-validation.test.ts` | Unit | N/A (new helper) | ✅ Import failed before helper existed | ✅ 4/4 passed | ✅ DNI min/max/non-numeric and CUIT empty/numeric/non-numeric | ✅ Shared Zod helpers extracted |
| 3.2/4.2 | `tests/unit/pps-careers.test.ts` | Unit | N/A (new helper) | ✅ Import failed before helper existed | ✅ 2/2 passed | ✅ stable Sistemas option and non-DB-shaped values | ✅ Static options isolated in helper |
| 3.3/4.4 | `tests/unit/convenio-info-display.test.ts` | Unit | N/A (new helper) | ✅ Import failed before helper existed | ✅ 2/2 passed | ✅ preferred key, legacy fallback, empty fallback | ✅ Display fallback extracted to pure helper |
| 5.2 | `tests/unit/docx-template-data.test.ts` | Unit | Existing renderer path covered by extraction | ✅ Tests failed because `prepareDocxTemplateData` did not exist | ✅ `npm test -- tests/unit/docx-template-data.test.ts` 2/2 | ✅ explicit empty PPS CUIT plus nullish nested/array CUIT normalization | ✅ Existing renderer now delegates to pure preparation helper |

### Verification
- ✅ `npm run test:e2e -- tests/e2e/secretary-convenios-lista.spec.ts` (2 passed) — final run after production-component route guard.
- ✅ `npm test` (11 files, 41 tests) — final run.
- ✅ `npx tsc --noEmit` — final run after clearing stale `tsconfig.tsbuildinfo` generated by the dev server.

### Remaining Tasks
- None for this apply batch. Ready for SDD re-verify.

### Notes
- The Playwright route is guarded with `notFound()` in production and whitelisted in middleware so local E2E can render real Next/React components without protected-route credentials.
- The synthetic static HTML harness was removed; browser assertions now exercise `ProtectedHeader` and `ConveniosListaClient` production code.
