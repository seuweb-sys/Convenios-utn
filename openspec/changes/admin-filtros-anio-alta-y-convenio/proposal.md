# Proposal: Filtros por año de alta y año del convenio (admin)

## Intent

Permitir al administrador acotar el listado de convenios por **año de carga en el sistema** (`created_at`) y por **año del convenio** (`agreement_year`), de forma independiente, para casos como: alta en 2026 y acuerdo de 2025.

## Scope

### In Scope

- Dos filtros tipo año (select con “Todos”) en la columna de filtros del tab **Convenios**.
- Lógica de filtrado en cliente sobre el arreglo ya cargado (mismo patrón que estado/tipo/secretaría).
- Misma lógica aplicada al listado filtrable de la pestaña **Reclasificar** (`ReclassifyConveniosPanel`).
- Microcopy que distinga “Alta en el sistema” vs “Año del convenio”.
- Opción **“Sin año”** para `agreement_year` null (si existe data).

### Out of Scope

- Rango de fechas por día en `created_at`.
- Filtros por fechas dentro de `form_data` (firma, vigencia).
- Cambios de API o paginación servidor.

## Approach

Extender `AdminFilters` con props y estado elevado en `AdminPanelClient` (y duplicar estado en `ReclassifyConveniosPanel` o extraer hook/helper compartido si reduce duplicación). Año de alta: `new Date(c.created_at).getFullYear()` en zona local del navegador. Año del convenio: `c.agreement_year` con comparación estricta o null.

## Affected Areas


| Area                                                                                                            | Impact                                      |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `[app/protected/admin/admin-filters.tsx](../../../app/protected/admin/admin-filters.tsx)`                       | Nuevos controles y opcional línea de ayuda  |
| `[app/protected/admin/AdminPanelClient.tsx](../../../app/protected/admin/AdminPanelClient.tsx)`                 | Estado + condiciones en `filteredConvenios` |
| `[app/protected/admin/ReclassifyConveniosPanel.tsx](../../../app/protected/admin/ReclassifyConveniosPanel.tsx)` | Paridad de filtros                          |


## Risks


| Risk                                        | Mitigation                                                    |
| ------------------------------------------- | ------------------------------------------------------------- |
| Zona horaria: `created_at` UTC vs año local | Documentar en design: usar año local del cliente para “alta”. |
| `agreement_year` null                       | Opción “Sin año” explícita.                                   |


## Rollback

Revertir commits que toquen los tres archivos anteriores.

## Dependencies

Ninguna.

## Success Criteria

- Filtrar solo por año de alta, solo por año de convenio, y ambos a la vez.
- Comportamiento alineado entre tab Convenios y Reclasificar.

---

## Orchestrator runbook (SDD)


| Fase    | Artefacto                     | Siguiente                    |
| ------- | ----------------------------- | ---------------------------- |
| Propose | Este archivo                  | `specs/admin/spec.md`        |
| Spec    | Delta specs                   | `design.md`                  |
| Design  | Diseño técnico                | `tasks.md`                   |
| Tasks   | Checklist                     | `sdd-apply` (implementación) |
| Verify  | Contraste manual vs criterios | Cierre                       |


**Nombre del cambio:** `admin-filtros-anio-alta-y-convenio`  
**Modo artefactos:** `openspec` (filesystem en `openspec/changes/...`).