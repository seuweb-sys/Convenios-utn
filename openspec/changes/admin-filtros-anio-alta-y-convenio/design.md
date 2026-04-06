# Design: Filtros año de alta y año del convenio

## Technical Approach

Filtrado **en cliente** sobre `convenios[]` ya provisto por SSR. Dos nuevos estados `number | null` o `string | null` para “año seleccionado” donde `null` = todos.

- **Año de alta:** `const y = new Date(c.created_at).getFullYear()` (local).
- **Año del convenio:** `c.agreement_year === null` → solo coincide con opción “Sin año”; si el filtro es un número, `c.agreement_year === filtro`.

Lista de años en `<select>`: unión ordenada de años presentes en `data` (mín/máx razonable) para alta; para `agreement_year` incluir años presentes + entrada “Sin año” si `some(agreement_year == null)`.

## UI

- Bloque **“Fechas”** (icono `Calendar` de lucide) después de estados o antes de secretarías — consistente con jerarquía actual.
- Dos filas: label + select nativo o componente existente (mismo estilo que otros selects del admin).
- Texto de ayuda de una línea (`text-muted-foreground text-xs`) bajo el bloque.

## File Changes


| File                                               | Action                                             |
| -------------------------------------------------- | -------------------------------------------------- |
| `app/protected/admin/admin-filters.tsx`            | Añadir props, sección UI, años derivados de `data` |
| `app/protected/admin/AdminPanelClient.tsx`         | Estado + filtros en `filteredConvenios`            |
| `app/protected/admin/ReclassifyConveniosPanel.tsx` | Paridad de estado y filtro                         |


## Interfaces

```ts
// Props nuevas (ejemplo)
uploadYearFilter: number | "all" | "none";
setUploadYearFilter: (v: ...) => void;
agreementYearFilter: number | "all" | "none";
setAgreementYearFilter: (v: ...) => void;
```

(Ajustar tipos: `"none"` solo para agreement year sin año; upload year no necesita “sin año”.)

## Testing


| Layer  | Approach                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Manual | Crear/mejorar convenios de prueba con distinta `created_at` y `agreement_year`; verificar combinaciones. |


## Migration

No aplica.

## Open Questions

None.