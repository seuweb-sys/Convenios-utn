export const dynamic = 'force-dynamic';

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  getPracticeConvenioTypeIds,
  shouldApplyProfesorPracticeOnlyConvenioFilter,
} from "@/app/lib/authz/profesor-membership-scope";
import { shouldUseMineOnlyConveniosForDashboard } from "@/app/lib/authz/membership-scope";
import { resolveConvenioTypeIdByAlias } from "@/app/lib/convenios/type-normalization";
import { buildConvenioFacetCounts } from "@/app/lib/convenios/facet-counts";
import {
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { ConveniosListaClient } from "./ConveniosListaClient";
import {
  buildConveniosListaQueryParams,
  buildConveniosSearchFilter,
} from "./query-params";

interface ConveniosListaFilterContext {
  applyProfesorPracticeOnly: boolean;
  practiceTypeIds: number[];
  mineOnlyList: boolean;
  userId: string;
  status: string | null;
  type: string | null;
  career: string | null;
  secretariat: string | null;
  searchFilter: string | null;
}

/**
 * Apply the same visibility / filter constraints to both the paginated list
 * query and the unpaginated facet-counts query. Keeping this in one place avoids
 * drift between the two builders and avoids reusing a builder after `.range()`.
 */
function applyConveniosListaFilters<T>(query: T, ctx: ConveniosListaFilterContext): T {
  let q = query as any;
  if (ctx.applyProfesorPracticeOnly) {
    q = q.in("convenio_type_id", ctx.practiceTypeIds);
  }
  if (ctx.mineOnlyList) {
    q = q.eq("user_id", ctx.userId);
  }
  if (ctx.status) {
    q = q.eq("status", ctx.status);
  }
  if (ctx.type) {
    const typeId = Number.parseInt(ctx.type, 10);
    if (Number.isFinite(typeId)) {
      q = q.eq("convenio_type_id", typeId);
    } else {
      // Resolve alias (accented/unaccented raw DB spelling) through the shared
      // helper so filtering by "Convenio Marco Práctica Supervisada" still
      // matches type-5 rows when the DB stores the unaccented spelling.
      const resolvedTypeId = resolveConvenioTypeIdByAlias(ctx.type);
      q =
        resolvedTypeId !== null
          ? q.eq("convenio_type_id", resolvedTypeId)
          : q.eq("convenio_types.name", ctx.type);
    }
  }
  if (ctx.career) {
    q = q.eq("career_id", ctx.career);
  }
  if (ctx.secretariat) {
    q = q.eq("secretariat_id", ctx.secretariat);
  }
  if (ctx.searchFilter) {
    q = q.or(ctx.searchFilter);
  }
  return q as T;
}

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

  const searchFilter = buildConveniosSearchFilter(queryParams.q);

  const filterCtx: ConveniosListaFilterContext = {
    applyProfesorPracticeOnly: Boolean(applyProfesorPracticeOnly),
    practiceTypeIds: getPracticeConvenioTypeIds(),
    mineOnlyList: Boolean(mineOnlyList),
    userId: user.id,
    status: queryParams.status,
    type: queryParams.type,
    career: queryParams.career,
    secretariat: queryParams.secretariat,
    searchFilter,
  };

  const listQuery = applyConveniosListaFilters(
    supabase
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
      .order("created_at", { ascending: false }),
    filterCtx
  );

  const { data: convenios, error: conveniosError, count } = await listQuery.range(
    queryParams.from,
    queryParams.to
  );

  // Second query with the SAME visibility/filter constraints but WITHOUT
  // `.range()`: selects only the columns needed to compute sidebar facet
  // counts over the full filtered set (RLS applies through the same client).
  // Kept separate from listQuery so we never reuse a builder after `.range()`.
  const countsQuery = applyConveniosListaFilters(
    supabase.from("convenios").select(`
      status,
      convenio_type_id,
      secretariat_id,
      career_id,
      convenio_types(name),
      profiles:user_id ( career_id )
    `),
    filterCtx
  );

  const { data: facetRows, error: facetError } = await countsQuery;

  if (facetError) {
    console.error("Error fetching convenios facet counts:", facetError);
  }

  const counts = buildConvenioFacetCounts(facetRows ?? []);

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
          counts={counts}
        />
      </div>
    </div>
  );
}
