# Proposal: Reclasificar convenios (admin)

## Intent

Los administradores necesitan corregir la clasificación organizativa de cualquier convenio (secretaría, carrera, subárea, año) sin depender del flujo solo-legacy en Membresías.

## Scope

### In Scope

- Pestaña **Reclasificar** en el panel admin con listado filtrable y formulario alineado al bloque legacy.
- Endpoint `PATCH` admin que actualice clasificación y audite con acción distinta de `reclassify_legacy`.
- Carga de catálogo `org_units` en la página admin.

### Out of Scope

- Eliminar el bloque «Reclasificar convenios legacy» en Membresías (convivencia).
- Cambiar reglas de visibilidad por rol fuera de lo que ya implica actualizar `convenios`.

## Approach

SSR de `org_units`; UI cliente reutiliza filtros y reglas SA/carrera como en `MembershipsManager`. Nuevo handler admin valida coherencia secretaría/subárea y aplica actualización + `activity_log`.

## Affected Areas

| Area | Impact |
|------|--------|
| `app/protected/admin/` | Nueva pestaña y componente |
| `app/api/admin/convenios/[id]/classification/` | Nuevo |
| `openspec/changes/admin-reclasificar-convenios/` | Artefactos SDD |

## Risks

| Risk | Mitigation |
|------|------------|
| Clasificación incorrecta afecta alcances | Documentado; admin es responsable |

## Rollback

Revertir PR: quitar ruta API, pestaña, props y query `org_units`.

## Dependencies

- Ninguna externa.

## Success Criteria

- [ ] Admin reclasifica un convenio y ve datos actualizados tras refrescar.
- [ ] Log de actividad con acción `reclassify_admin`.
