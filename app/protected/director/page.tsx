import { ScopedConveniosPanel } from "@/app/protected/components/ScopedConveniosPanel";

export default function DirectorPage() {
  return (
    <ScopedConveniosPanel
      scope="director"
      title="Panel de Director"
      subtitle="Convenios en el ámbito de tus carreras (directores anteriores, profesores y tu actividad)."
    />
  );
}
