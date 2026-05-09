export function resolveFacultadResponsible(data: Record<string, unknown> | null | undefined) {
  const facultad = typeof data?.facultad_docente_tutor_nombre === "string"
    ? data.facultad_docente_tutor_nombre.trim()
    : "";
  if (facultad) return facultad;

  const legacy = typeof data?.practica_tutor_docente === "string"
    ? data.practica_tutor_docente.trim()
    : "";
  return legacy;
}
