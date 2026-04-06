# Delta: Admin — Reclasificar convenios

## ADDED Requirements

### Requirement: Acceso a la pestaña Reclasificar

El sistema **DEBE** mostrar a usuarios con rol `admin` una pestaña «Reclasificar» en el panel de administración.

#### Scenario: Admin ve la pestaña

- **GIVEN** un usuario autenticado con rol `admin`
- **WHEN** abre `/protected/admin`
- **THEN** puede seleccionar la pestaña «Reclasificar».

### Requirement: Selección y filtros

El sistema **DEBE** permitir filtrar la lista de convenios por estado, tipo, carrera y secretaría, y **DEBE** permitir elegir un convenio de la lista filtrada.

#### Scenario: Filtrar y elegir convenio

- **GIVEN** convenios en el sistema
- **WHEN** el admin aplica filtros y elige un convenio en el selector
- **THEN** el formulario muestra la secretaría, carrera (si aplica), subárea y año actuales del convenio seleccionado.

### Requirement: Guardar clasificación

El sistema **DEBE** persistir `secretariat_id`, `career_id`, `org_unit_id` y `agreement_year` vía API admin y **DEBE** registrar la acción en `activity_log` como `reclassify_admin`.

#### Scenario: Guardado exitoso

- **GIVEN** un convenio seleccionado y valores válidos
- **WHEN** el admin confirma la reclasificación
- **THEN** los valores se guardan y queda un registro de actividad con acción `reclassify_admin`.

#### Scenario: No autorizado

- **GIVEN** un usuario no admin
- **WHEN** invoca el endpoint de reclasificación
- **THEN** recibe respuesta `401` o `403`.

### Requirement: Coherencia de datos

El sistema **NO DEBE** aceptar `career_id` distinto de null cuando la secretaría no es SA. El sistema **NO DEBE** aceptar `org_unit_id` que no pertenezca a la `secretariat_id` indicada.

#### Scenario: Subárea inválida

- **GIVEN** una `org_unit_id` de otra secretaría
- **WHEN** se envía el PATCH
- **THEN** la API responde error `400` con mensaje claro.
