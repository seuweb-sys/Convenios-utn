"use client";

import { useEffect, useMemo, useState } from "react";
import { ProfesorPanelClient } from "@/app/protected/profesor/ProfesorPanelClient";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader,
} from "@/app/components/dashboard";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

type Scope = "director" | "secretario" | "profesor";

export function ScopedConveniosPanel({
  scope,
  title,
  subtitle,
}: {
  scope: Scope;
  title: string;
  subtitle?: string;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [authorOrigin, setAuthorOrigin] = useState<"all" | "director" | "profesor">("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        let url = `/api/convenios?full=true&limit=8000&scope=${scope}`;
        if (scope === "secretario" && authorOrigin !== "all") {
          url += `&author_membership=${authorOrigin}`;
        }
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Error al cargar convenios");
        }
        const data = await res.json();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [scope, authorOrigin]);

  const careerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of rows) {
      const id = c.career_id || c.careers?.id;
      const name = c.careers?.name || c.careers?.code || "Carrera";
      if (id) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  return (
    <>
      <BackgroundPattern />
      <div className="p-6 w-full relative">
        <DashboardHeader name={title} subtitle={subtitle} />
        <div className="mt-4 space-y-4">
          {scope === "secretario" && (
            <SectionContainer title="Origen del autor">
              <Tabs
                value={authorOrigin}
                onValueChange={(v: string) =>
                  setAuthorOrigin(v as typeof authorOrigin)
                }
              >
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="director">Cargados por directores</TabsTrigger>
                  <TabsTrigger value="profesor">Cargados por profesores</TabsTrigger>
                </TabsList>
              </Tabs>
            </SectionContainer>
          )}

          {loading ? (
            <div className="animate-pulse h-40 rounded-lg bg-muted" />
          ) : err ? (
            <div className="text-destructive text-sm">{err}</div>
          ) : (
            <ProfesorPanelClient
              convenios={rows}
              showOwnerInfo
              scope={scope}
              careerOptions={careerOptions}
            />
          )}
        </div>
      </div>
    </>
  );
}
