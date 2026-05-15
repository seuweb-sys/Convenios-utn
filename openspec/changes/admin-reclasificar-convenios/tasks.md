# Tasks: admin-reclasificar-convenios

- [x] Artefactos OpenSpec (proposal, spec, design, tasks)
- [x] `PATCH` `app/api/admin/convenios/[id]/classification/route.ts` con validación y `activity_log`
- [x] Query `org_units` en `app/protected/admin/page.tsx` y props a cliente
- [x] `ReclassifyConveniosPanel.tsx` + pestaña en `AdminPanelClient.tsx`
- [x] Verificación: `npx tsc --noEmit` OK (`next build` falló al recolectar datos en ruta memberships ajena a este cambio)

## Follow-up bugfix

- [x] Permitir vía trigger SQL la actualización histórica autorizada de convenios de práctica sin abrir la creación histórica no privilegiada
- [x] Ajustar la validación app-level para que updates no admin mantengan un año histórico existente sin bloquear ediciones no relacionadas
- [x] Agregar pruebas focalizadas para helper de año histórico y para la nueva migración de trigger
