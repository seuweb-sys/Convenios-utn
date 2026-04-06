# Design: Reclasificar convenios (admin)

## Technical Approach

Nueva ruta `PATCH /api/admin/convenios/[id]/classification` valida rol admin, coherencia secretaría/subárea/regla SA, normaliza año, actualiza fila `convenios` (incl. limpieza de flags como en legacy cuando aplica) e inserta `activity_log` con `action: "reclassify_admin"` y metadata con valores previos y nuevos.

Cliente: `ReclassifyConveniosPanel` con estado de filtros (misma lógica que `AdminPanelClient`), `useMemo` para carreras/subáreas como `MembershipsManager`, `useRouter().refresh()` y toast tras éxito.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Ubicación API | `classification/route.ts` bajo admin | Separado de legacy; REST claro |
| Catálogo org_units | SSR en `page.tsx` | Evita fetch extra y mantiene patrón admin |
| Regla SA | Servidor + cliente | Doble capa; mensajes consistentes |

## Data Flow

```
AdminPage → org_units + convenios → AdminPanelClient → ReclassifyConveniosPanel
                                                              ↓ PATCH /classification
                                                         Supabase convenios + activity_log
```

## File Changes

| File | Action |
|------|--------|
| `app/api/admin/convenios/[id]/classification/route.ts` | Create |
| `app/protected/admin/ReclassifyConveniosPanel.tsx` | Create |
| `app/protected/admin/AdminPanelClient.tsx` | Modify |
| `app/protected/admin/page.tsx` | Modify |
| `openspec/changes/admin-reclasificar-convenios/*` | Create |

## Interfaces

**PATCH body:** `{ secretariat_id: string, career_id?: string | null, org_unit_id?: string | null, agreement_year?: number | null }`

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Manual | Flujo: filtrar, elegir, cambiar secretaría, guardar, ver tabla Convenios |
| E2E | Opcional: spec admin futuro |

## Migration

No hay migración de datos.

## Open Questions

None.
