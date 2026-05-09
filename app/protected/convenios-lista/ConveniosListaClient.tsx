"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { ConvenioItem } from "@/app/components/dashboard";
import { ConvenioCardSkeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, SearchIcon } from "lucide-react";

export function ConveniosListaClient({
  convenios,
  careers,
  secretariats,
  pagination = { page: 1, pageSize: 10, total: convenios.length },
  filters = { q: "", status: null, type: null, career: null, secretariat: null },
}: {
  convenios: any[];
  careers: any[];
  secretariats: any[];
  pagination?: { page: number; pageSize: number; total: number };
  filters?: {
    q: string;
    status: string | null;
    type: string | null;
    career: string | null;
    secretariat: string | null;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(filters.q);
  const [statusFilter, setStatusFilterState] = useState<string | null>(filters.status);
  const [typeFilter, setTypeFilterState] = useState<string | null>(filters.type);
  const [careerFilter, setCareerFilterState] = useState<string | null>(filters.career);
  const [secretariatFilter, setSecretariatFilterState] = useState<string | null>(filters.secretariat);
  const [isLoading, setIsLoading] = useState(false);
  const pageCount = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  const updateUrl = (updates: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.set("page", "1");
    setIsLoading(true);
    router.push(`${pathname}?${params.toString()}`);
  };

  const setStatusFilter = (value: string | null) => {
    setStatusFilterState(value);
    updateUrl({ status: value });
  };

  const setTypeFilter = (value: string | null) => {
    setTypeFilterState(value);
    updateUrl({ type: value });
  };

  const setCareerFilter = (value: string | null) => {
    setCareerFilterState(value);
    updateUrl({ career: value });
  };

  const setSecretariatFilter = (value: string | null) => {
    setSecretariatFilterState(value);
    updateUrl({ secretariat: value });
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateUrl({ q: search.trim() });
  };

  const goToPage = (page: number) => {
    updateUrl({ page: String(page) }, false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
      <div className="md:col-span-1">
        <AdminFilters
          data={convenios}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          careerFilter={careerFilter}
          setCareerFilter={setCareerFilter}
          careers={careers}
          secretariats={secretariats}
          secretariatFilter={secretariatFilter}
          setSecretariatFilter={setSecretariatFilter}
        />
      </div>
      <div className="md:col-span-3">
        <form onSubmit={submitSearch} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <input
              aria-label="Buscar en convenios"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar convenios..."
              className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ConvenioCardSkeleton key={i} />
            ))}
          </div>
        ) : convenios.length > 0 ? (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            {convenios.map((convenio) => (
              <div key={convenio.id} data-testid="convenio-list-card">
                <ConvenioItem
                  id={convenio.id}
                  title={convenio.title}
                  date={new Date(convenio.created_at).toLocaleDateString('es-ES')}
                  type={convenio.convenio_types.name}
                  status={convenio.status}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-8 text-center animate-in fade-in-0 duration-300">
            <p className="text-muted-foreground">No se encontraron convenios con los filtros seleccionados.</p>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
          <span className="text-muted-foreground">
            Página {pagination.page} de {pageCount} · {pagination.total} convenios
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pageCount}
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
