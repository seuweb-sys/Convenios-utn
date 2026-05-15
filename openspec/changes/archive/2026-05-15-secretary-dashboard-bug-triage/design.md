# Design: Secretary Dashboard Bug Triage

## Technical Approach

Keep the change inside the existing Next.js App Router/Supabase patterns. Remove only the unused global protected search, then move secretary list search/pagination into `/protected/convenios-lista` using URL query params and Supabase `range()`/`count` so the page never loads the whole table. PPS form fixes stay in form/schema helpers and preserve existing `form_data` string contracts for DOCX templates.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Secretary list data | Server component reads `searchParams`, applies filters/search/range/count in Supabase | Client-side filtering of all rows; new API endpoint | Current page already queries Supabase server-side; bounded server queries satisfy scope with less churn. |
| Search UI | Add a small client search/pagination control in `ConveniosListaClient.tsx` that updates URL params | Reuse admin `DataTable` | Secretary UI is card-based, not table-based; admin behavior is mainly search input + pagination intent. |
| DNI/CUIT | Shared Zod helpers: DNI required numeric 1–20; CUIT optional numeric, stores `""` when missing | Keep 7/8/11-digit Argentina-only rules; use `null` | User clarified DNI must be lax/bounded and CUIT optional. Empty string preserves DOCX template compatibility. |
| PPS careers | Code-defined options exported from a helper and rendered as `<select>` | Query `careers` table; free text | Requirement says no DB read solely for PPS options; selector avoids typo drift. |

## Data Flow

```text
/protected/convenios-lista?page&q&status&type...
  └─ server page validates user/scope
      └─ Supabase convenios select(count: "exact") + ilike + filters + range(0..9)
          └─ ConveniosListaClient renders cards, search box, pagination links

PPS form ── shared validators/static careers ── content_data/form_data strings ── API POST/PATCH ── DOCX templates
```

## File Changes

| File | Action | Description |
|---|---|---|
| `app/protected/layout.tsx` | Modify | Remove top search input and unused `SearchIcon` import; keep header/sidebar/notifications. |
| `app/protected/convenios-lista/page.tsx` | Modify | Accept `searchParams`; apply status/type/career/secretariat/search/mine/profesor scope in Supabase; request 10 rows and exact count; stop fetching all records for list pagination. |
| `app/protected/convenios-lista/ConveniosListaClient.tsx` | Modify | Add search input, pagination controls, URL-param filter handlers, and render server-provided page rows. |
| `app/api/convenios/route.ts` | Modify | Add the same bounded `q` search/count behavior for API consumers; keep existing `full=true` compatibility. |
| `app/lib/forms/identity-validation.ts` | Create | Export `dniSchema`, `optionalCuitSchema`, and `emptyString` normalization helpers. |
| `app/lib/forms/pps-careers.ts` | Create | Export stable PPS career option list used by the particular PPS form. |
| `app/components/forms/convenio-particular/ConvenioParticularForm.tsx` | Modify | Use career `<select>`, DNI max 20, optional CUIT with empty string, and keep `facultad_docente_tutor_nombre`/`practica_tutor_docente` mapping. |
| `app/components/forms/convenio-practica-marco/ConvenioPracticaMarcoForm.tsx` | Modify | Apply shared DNI/CUIT helpers and empty-string CUIT persistence. |
| `app/components/forms/convenio-especifico/ConvenioEspecificoForm.tsx` | Modify | Apply shared DNI/CUIT helpers and empty-string CUIT persistence. |
| `app/components/forms/acuerdo-colaboracion/AcuerdoColaboracionForm.tsx` | Modify | Apply shared DNI/CUIT helpers and empty-string CUIT persistence. |
| `app/components/convenios/convenio-info-display.tsx` | Modify | Show PPS Facultad responsible from `facultad_docente_tutor_nombre` or `practica_tutor_docente`; render empty/safe fallback when absent. |

## Interfaces / Contracts

```ts
type ConveniosListaSearchParams = {
  q?: string; page?: string; status?: string; type?: string;
  career?: string; secretariat?: string;
};

type PaginatedConvenios = {
  convenios: any[]; page: number; pageSize: 10; total: number;
};

type PpsCareerOption = { value: string; label: string };
```

CUIT fields remain strings in `form_data`; missing CUIT is `""`, not `null`.

## Testing Strategy

Strict TDD is active for apply/verify; implement tests before behavior changes.

| Layer | What to Test | Approach |
|---|---|---|
| Unit | DNI/CUIT helpers and PPS career options | Vitest tests for numeric bounds, optional CUIT as `""`, no DB dependency. |
| Integration | Supabase query param handling | Vitest route/page helper tests for `q`, `page`, limit 10, count metadata, invalid params. |
| E2E | Secretary list search/pagination and PPS final display | Playwright creates/uses seeded convenios, verifies top search absent, list search resets page, 10-card max, Facultad responsible visible. |
| Manual | DOCX with empty CUIT | Generate PPS/no-CUIT document and confirm template does not crash; secretary may remove empty CUIT label. |

## Migration / Rollout

No database migration required. Existing records remain valid; display reads both old and current PPS responsible keys.

## Open Questions

- None blocking.
