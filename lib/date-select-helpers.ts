/**
 * Devuelve si el día (1–31 como string) sigue siendo válido para el mes dado (nombre en español).
 * Usado al cambiar el mes en selects día/mes sin borrar el día cuando sigue siendo válido.
 */
export function isDiaValidForMes(
  dia: string | undefined,
  mesNombre: string,
  meses: readonly string[],
  diasPorMes: readonly number[]
): boolean {
  if (!dia || !mesNombre) return false;
  const mesIdx = meses.indexOf(mesNombre);
  if (mesIdx < 0) return false;
  const max = diasPorMes[mesIdx];
  const d = parseInt(dia, 10);
  return !Number.isNaN(d) && d >= 1 && d <= max;
}
