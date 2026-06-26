export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  getPracticeConvenioTypeIds,
  shouldApplyProfesorPracticeOnlyConvenioFilter,
} from "@/app/lib/authz/profesor-membership-scope";
import { shouldUseMineOnlyConveniosForDashboard } from "@/app/lib/authz/membership-scope";
import { resolveConvenioTypeIdByAlias } from "@/app/lib/convenios/type-normalization";
import {
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { ConveniosListaClient } from "./ConveniosListaClient";
import {
  buildConveniosListaQueryParams,
  buildConveniosSearchFilter,
} from "./query-params";

export default async function ConveniosListaPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const queryParams = buildConveniosListaQueryParams(searchParams);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const applyProfesorPracticeOnly =
    profile &&
    (await shouldApplyProfesorPracticeOnlyConvenioFilter(
      supabase,
      user.id,
      profile.role
    ));

  const mineOnlyList =
    profile &&
    (await shouldUseMineOnlyConveniosForDashboard(supabase, user.id, profile.role));

  let conveniosQuery = supabase
    .from("convenios")
    .select(`
      *,
      convenio_types(name),
      profiles:user_id (
        full_name,
        role,
        career_id
      ),
      secretariats:secretariat_id (
        id,
        code,
        name
      ),
      careers:career_id (
        id,
        name,
        code
      ),
      org_units:org_unit_id (
        id,
        code,
        name,
        unit_type
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (applyProfesorPracticeOnly) {
    conveniosQuery = conveniosQuery.in("convenio_type_id", getPracticeConvenioTypeIds());
  }

  if (mineOnlyList) {
    conveniosQuery = conveniosQuery.eq("user_id", user.id);
  }

  if (queryParams.status) {
    conveniosQuery = conveniosQuery.eq("status", queryParams.status);
  }

  if (queryParams.type) {
    const typeId = Number.parseInt(queryParams.type, 10);
    if (Number.isFinite(typeId)) {
      conveniosQuery = conveniosQuery.eq("convenio_type_id", typeId);
    } else {
      // Resolve alias (accented/unaccented raw DB spelling) through the shared
      // helper so filtering by "Convenio Marco Práctica Supervisada" still
      // matches type-5 rows when the DB stores the unaccented spelling.
      const resolvedTypeId = resolveConvenioTypeIdByAlias(queryParams.type);
      conveniosQuery =
        resolvedTypeId !== null
          ? conveniosQuery.eq("convenio_type_id", resolvedTypeId)
          : conveniosQuery.eq("convenio_types.name", queryParams.type);
    }
  }

  if (queryParams.career) {
    conveniosQuery = conveniosQuery.eq("career_id", queryParams.career);
  }

  if (queryParams.secretariat) {
    conveniosQuery = conveniosQuery.eq("secretariat_id", queryParams.secretariat);
  }

  const searchFilter = buildConveniosSearchFilter(queryParams.q);
  if (searchFilter) {
    conveniosQuery = conveniosQuery.or(searchFilter);
  }

  const { data: convenios, error: conveniosError, count } = await conveniosQuery.range(
    queryParams.from,
    queryParams.to
  );

  const { data: careers } = await supabase
    .from("careers")
    .select("*")
    .order("name");

  const { data: secretariats } = await supabase
    .from("secretariats")
    .select("id, code, name")
    .eq("active", true)
    .order("name");

  if (conveniosError) {
    console.error("Error fetching convenios:", conveniosError);
  }

  return (
    <div className="w-full">
      <BackgroundPattern />
      <div className="p-6">
        <DashboardHeader
          name="Convenios"
          subtitle={
            mineOnlyList
              ? "Solo convenios creados por vos"
              : "Aquí puedes ver todos los convenios visibles para tu perfil"
          }
        />
        <ConveniosListaClient
          convenios={convenios || []}
          careers={careers || []}
          secretariats={secretariats || []}
          pagination={{
            page: queryParams.page,
            pageSize: queryParams.pageSize,
            total: count || 0,
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
    </div>
  );
}
