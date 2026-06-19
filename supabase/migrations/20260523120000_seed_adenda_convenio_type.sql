INSERT INTO convenio_types (id, name, description, active, fields, template_content)
VALUES (
  6,
  'Adenda',
  'Adenda para complementar o modificar un convenio previo existente.',
  true,
  $$[
    {"name":"ciudad","type":"text","required":true},
    {"name":"provincia","type":"text","required":true},
    {"name":"dia","type":"text","required":true},
    {"name":"mes","type":"text","required":true},
    {"name":"anio","type":"text","required":true},
    {"name":"entidad_nombre","type":"text","required":true},
    {"name":"entidad_tipo","type":"text","required":false},
    {"name":"entidad_domicilio","type":"text","required":true},
    {"name":"entidad_ciudad","type":"text","required":true},
    {"name":"entidad_provincia","type":"text","required":true},
    {"name":"entidad_cuit","type":"text","required":false},
    {"name":"entidad_representante","type":"text","required":true},
    {"name":"entidad_dni","type":"text","required":true},
    {"name":"entidad_cargo","type":"text","required":true},
    {
      "name":"convenios_previos",
      "type":"array",
      "required":true,
      "items":[
        {"name":"tipo","type":"text","required":true},
        {"name":"fecha","type":"text","required":true},
        {"name":"objeto","type":"text","required":true}
      ]
    },
    {"name":"exponen_adicional","type":"textarea","required":false},
    {
      "name":"acuerdan",
      "type":"array",
      "required":true,
      "items":[
        {"name":"ordinal","type":"text","required":true},
        {"name":"texto","type":"textarea","required":true}
      ]
    },
    {"name":"anexos","type":"array","required":false}
  ]$$::jsonb,
  jsonb_build_object(
    'title', 'ADDENDA AL CONVENIO ESPECÍFICO',
    'template', 'templates/addenda.docx',
    'uses_physical_docx', true,
    'repeatable', jsonb_build_array('convenios_previos', 'acuerdan')
  )
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  fields = EXCLUDED.fields,
  template_content = EXCLUDED.template_content;

SELECT setval(
  pg_get_serial_sequence('convenio_types', 'id'),
  COALESCE((SELECT MAX(id) FROM convenio_types), 1),
  true
);
