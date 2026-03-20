import { ScopedConveniosPanel } from "@/app/protected/components/ScopedConveniosPanel";

export default function SecretarioPage() {
  return (
    <ScopedConveniosPanel
      scope="secretario"
      title="Panel de Secretario"
      subtitle="Convenios de tu secretaría. Podés filtrar por origen del autor."
    />
  );
}
