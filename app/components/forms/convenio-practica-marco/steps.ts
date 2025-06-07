export const practicaMarcoSteps = [
  {
    title: "Datos de la Entidad",
    fields: [
      {
        name: "entidad_nombre",
        type: "text",
        label: "Nombre de la entidad",
        required: true
      },
      {
        name: "entidad_domicilio",
        type: "text",
        label: "Domicilio de la entidad",
        required: true
      },
      {
        name: "entidad_ciudad",
        type: "text",
        label: "Ciudad de la entidad",
        required: true
      },
      {
        name: "entidad_cuit",
        type: "number",
        label: "CUIT de la entidad",
        required: true
      },
      {
        name: "entidad_rubro",
        type: "text",
        label: "Rubro/actividad de la entidad",
        required: true
      }
    ]
  },
  {
    title: "Datos del Representante",
    fields: [
      {
        name: "entidad_representante",
        type: "text",
        label: "Representante de la entidad",
        required: true
      },
      {
        name: "entidad_dni",
        type: "number",
        label: "DNI del representante",
        required: true
      },
      {
        name: "entidad_cargo",
        type: "text",
        label: "Cargo del representante",
        required: true
      }
    ]
  },
  {
    title: "Fechas del Convenio",
    fields: [
      {
        name: "dia",
        type: "text",
        label: "Día de firma",
        required: true
      },
      {
        name: "mes",
        type: "text",
        label: "Mes de firma",
        required: true
      }
    ]
  },
  {
    title: "Revisión",
    fields: [] // Este paso solo muestra el resumen usando el store
  }
];
