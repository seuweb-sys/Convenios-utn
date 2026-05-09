import { notFound } from "next/navigation";

import { ProtectedHeader } from "@/app/components/layout/protected-header";
import { ConveniosListaClient } from "@/app/protected/convenios-lista/ConveniosListaClient";
import { buildConveniosListaQueryParams } from "@/app/protected/convenios-lista/query-params";

const allConvenios = Array.from({ length: 12 }, (_, index) => ({
  id: `convenio-${index + 1}`,
  title: index === 11 ? "Otro convenio final" : `UTN convenio ${index + 1}`,
  created_at: new Date(2026, 0, index + 1).toISOString(),
  status: "enviado",
  convenio_types: { name: "Convenio Marco" },
  career_id: "sistemas",
  secretariat_id: "extension",
}));

const careers = [{ id: "sistemas", name: "Ingeniería en Sistemas", code: "ISI" }];
const secretariats = [{ id: "extension", name: "Extensión", code: "EXT" }];

export default function SecretaryConveniosListaPlaywrightPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const queryParams = buildConveniosListaQueryParams(searchParams);
  const q = queryParams.q.toLowerCase();
  const filteredConvenios = q
    ? allConvenios.filter((convenio) => convenio.title.toLowerCase().includes(q))
    : allConvenios;
  const pageConvenios = filteredConvenios.slice(queryParams.from, queryParams.to + 1);

  return (
    <div className="flex h-screen flex-col">
      <ProtectedHeader
        showNotifications={false}
        user={{ id: "playwright-secretary", email: "secretaria@utn.test" }}
        profile={{ full_name: "Secretaría Playwright", role: "secretaria" }}
      />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-6">
          <ConveniosListaClient
            convenios={pageConvenios}
            careers={careers}
            secretariats={secretariats}
            pagination={{
              page: queryParams.page,
              pageSize: queryParams.pageSize,
              total: filteredConvenios.length,
            }}
            filters={{
              q: queryParams.q,
              status: queryParams.status,
              type: queryParams.type,
              career: queryParams.career,
              secretariat: queryParams.secretariat,
            }}
          />
        </div>
      </main>
    </div>
  );
}
