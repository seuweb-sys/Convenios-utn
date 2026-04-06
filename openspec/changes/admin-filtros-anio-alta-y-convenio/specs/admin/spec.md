# Delta: Admin — Filtros año de alta y año del convenio

## ADDED Requirements

### Requirement: Filtro por año de alta en el sistema

El sistema **DEBE** permitir filtrar convenios por el **año calendario** de `created_at` (alta en el sistema), usando la zona horaria local del navegador para derivar el año.

#### Scenario: Filtrar convenios cargados en un año

- **GIVEN** convenios con distintas fechas de `created_at`
- **WHEN** el admin selecciona un año en “Año de alta en el sistema” (o equivalente en UI)
- **THEN** solo se listan convenios cuyo año de alta coincide con ese año.

#### Scenario: Sin filtro de alta

- **GIVEN** el filtro de año de alta en “Todos”
- **WHEN** el admin visualiza el listado
- **THEN** no se excluye ningún convenio por fecha de alta.

### Requirement: Filtro por año del convenio

El sistema **DEBE** permitir filtrar por `agreement_year` cuando está definido.

#### Scenario: Filtrar por año del convenio

- **GIVEN** convenios con `agreement_year` distintos o null
- **WHEN** el admin selecciona un año en “Año del convenio”
- **THEN** solo se listan convenios con ese `agreement_year`.

#### Scenario: Convenios sin año

- **GIVEN** convenios con `agreement_year` null
- **WHEN** el admin selecciona la opción “Sin año” (si existe en catálogo)
- **THEN** solo se listan convenios sin año asignado.

### Requirement: Combinación y paridad de pestañas

El sistema **DEBE** aplicar ambos filtros con **AND** lógico junto a los filtros existentes. El sistema **DEBE** ofrecer el mismo comportamiento en el tab **Convenios** y en **Reclasificar**.

#### Scenario: Combinar alta 2026 y convenio 2025

- **GIVEN** un convenio cargado en 2026 con `agreement_year` 2025
- **WHEN** el admin filtra alta 2026 y año del convenio 2025
- **THEN** ese convenio aparece en el listado.