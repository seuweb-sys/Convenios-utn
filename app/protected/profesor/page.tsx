export const dynamic = 'force-dynamic';

import { ScopedConveniosPanel } from "@/app/protected/components/ScopedConveniosPanel";

export default function ProfesorPage() {
  return (
    <ScopedConveniosPanel
      scope="profesor"
      title="Panel de Profesor"
      subtitle="Práctica supervisada en las carreras de tu membresía. Filtrá por carrera y por tipo."
    />
  );
}
