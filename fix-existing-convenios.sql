-- Migración: Cambiar convenios existentes de 'borrador' a 'enviado'
-- Corregir fechas inválidas

BEGIN;

-- 1. Actualizar todos los convenios con status 'borrador' a 'enviado'
UPDATE convenios 
SET status = 'enviado'
WHERE status = 'borrador';

-- 2. Actualizar submitted_at para convenios que no lo tienen
UPDATE convenios 
SET submitted_at = created_at
WHERE submitted_at IS NULL AND status = 'enviado';

-- 3. Verificar cambios
SELECT 
    id,
    title,
    status,
    created_at,
    submitted_at,
    serial_number
FROM convenios 
ORDER BY created_at DESC;

COMMIT;

-- Estadísticas finales
SELECT 
    status,
    COUNT(*) as cantidad
FROM convenios 
GROUP BY status; 