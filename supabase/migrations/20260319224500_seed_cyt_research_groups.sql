-- Grupos de investigación CyT (org_units.unit_type = cyt_group)
-- Códigos en snake_case minúscula (consistente con grupo_general); nombres oficiales según catálogo.

INSERT INTO public.org_units (secretariat_id, unit_type, code, name, active)
SELECT s.id, 'cyt_group', v.code, v.name, true
FROM public.secretariats s
CROSS JOIN (
  VALUES
    ('cinaptic', 'Centro de Investigación Aplicada en Tecnologías de la Información y Comunicación'),
    ('quimobi', 'Centro de Investigación en Química Orgánica Biológica'),
    ('quitex', 'Centro de Química e Ingeniería Teórica y Experimental'),
    ('guda', 'Grupo Universitario de Automatización'),
    ('gim', 'Grupo de Investigación en Materiales'),
    ('gimef', 'Grupo de Investigación en Mecánica de los Fluidos'),
    ('grupo_lar', 'Grupo de Investigación en Licenciatura en Administración Rural'),
    ('gitea', 'Grupo de Investigación en Tecnologías Energéticas Apropiadas'),
    ('gistaq', 'Grupo de Investigación sobre temas Ambientales y Químicos'),
    ('biotec', 'Grupo de Investigación en Biotecnología y Alimentos'),
    ('giesin', 'Grupo de Investigación Educativa sobre Ingeniería')
) AS v(code, name)
WHERE s.code = 'CYT'
ON CONFLICT (secretariat_id, code) DO UPDATE
SET
  name = EXCLUDED.name,
  active = true,
  unit_type = EXCLUDED.unit_type;
