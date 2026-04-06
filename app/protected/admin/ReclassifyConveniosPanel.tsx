"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { SectionContainer } from "@/app/components/dashboard";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { formatOrgUnitLabel } from "@/lib/org-unit-label";
import { useToast } from "@/app/components/ui/toast";
import type { Career } from "@/app/protected/admin/careers/columns";
import {
  passesConvenioYearFilters,
  type AgreementYearFilterValue,
} from "@/app/lib/admin/convenio-year-filters";

type OrgUnitRow = {
  id: string;
  code: string;
  name: string;
  unit_type: string;
  secretariat_id: string | null;
};

export function ReclassifyConveniosPanel({
  convenios,
  careers,
  secretariats,
  org_units,
}: {
  convenios: any[];
  careers: Career[];
  secretariats: { id: string; code: string; name: string }[];
  org_units: OrgUnitRow[];
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [careerFilter, setCareerFilter] = useState<string | null>(null);
  const [secretariatFilter, setSecretariatFilter] = useState<string | null>(null);
  const [uploadYearFilter, setUploadYearFilter] = useState<number | null>(null);
  const [agreementYearFilter, setAgreementYearFilter] = useState<AgreementYearFilterValue>(null);

  const [selectedConvenioId, setSelectedConvenioId] = useState("");
  const [secretariatId, setSecretariatId] = useState("");
  const [careerId, setCareerId] = useState("");
  const [orgUnitId, setOrgUnitId] = useState("");
  const [agreementYear, setAgreementYear] = useState<number>(() => new Date().getFullYear());
  const [saving, setSaving] = useState(false);

  const filteredConvenios = (convenios || []).filter((c) => {
    const statusOk = !statusFilter || c.status === statusFilter;
    const typeOk = !typeFilter || c.convenio_types?.name === typeFilter;
    const careerOk =
      !careerFilter || c.career_id === careerFilter || c.profiles?.career_id === careerFilter;
    const secretariatOk = !secretariatFilter || c.secretariat_id === secretariatFilter;
    const yearOk = passesConvenioYearFilters(c, uploadYearFilter, agreementYearFilter);
    return statusOk && typeOk && careerOk && secretariatOk && yearOk;
  });

  const selectedSecretariatCode = useMemo(() => {
    const sec = secretariats.find((s) => s.id === secretariatId);
    return sec?.code || "";
  }, [secretariats, secretariatId]);

  const filteredOrgUnits = useMemo(() => {
    if (!secretariatId) return org_units;
    return org_units.filter((ou) => ou.secretariat_id === secretariatId);
  }, [org_units, secretariatId]);

  const filteredCareers = useMemo(() => {
    return selectedSecretariatCode === "SA" ? careers : [];
  }, [selectedSecretariatCode, careers]);

  const applyConvenioToForm = (c: (typeof convenios)[0]) => {
    setSecretariatId(c.secretariat_id || "");
    setCareerId(c.career_id || "");
    setOrgUnitId(c.org_unit_id || "");
    const y = c.agreement_year;
    setAgreementYear(
      typeof y === "number" && !Number.isNaN(y) ? y : new Date().getFullYear()
    );
  };

  useEffect(() => {
    if (!selectedConvenioId) return;
    const c = convenios.find((x: { id: string }) => x.id === selectedConvenioId);
    if (!c) return;
    setSecretariatId(c.secretariat_id || "");
    setCareerId(c.career_id || "");
    setOrgUnitId(c.org_unit_id || "");
    const y = c.agreement_year;
    setAgreementYear(
      typeof y === "number" && !Number.isNaN(y) ? y : new Date().getFullYear()
    );
  }, [convenios, selectedConvenioId]);

  const onSelectConvenio = (id: string) => {
    setSelectedConvenioId(id);
    const c = convenios.find((x) => x.id === id);
    if (c) applyConvenioToForm(c);
    else {
      setSecretariatId("");
      setCareerId("");
      setOrgUnitId("");
      setAgreementYear(new Date().getFullYear());
    }
  };

  const reclassify = async () => {
    if (!selectedConvenioId || !secretariatId) {
      toastError("Faltan datos", "Selecciona un convenio y una secretaría.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/convenios/${selectedConvenioId}/classification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretariat_id: secretariatId,
          career_id: selectedSecretariatCode === "SA" ? careerId || null : null,
          org_unit_id: orgUnitId || null,
          agreement_year: agreementYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo reclasificar");
      }
      success("Convenio actualizado", "La clasificación se guardó correctamente.");
      router.refresh();
    } catch (e: unknown) {
      toastError("Error", e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <SectionContainer title="Reclasificar convenios">
          <p className="text-sm text-muted-foreground mb-4">
            Elegí un convenio (podés usar los filtros de la derecha), revisá la clasificación y guardá los
            cambios.
          </p>
          <div className="rounded-lg border border-border/60 bg-card/80 p-4">
            <h3 className="text-lg font-semibold mb-3">Clasificación</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={selectedConvenioId}
                onChange={(e) => onSelectConvenio(e.target.value)}
              >
                <option value="">Convenio</option>
                {filteredConvenios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.serial_number || c.id.slice(0, 8)} — {c.title}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={secretariatId}
                onChange={(e) => {
                  setSecretariatId(e.target.value);
                  setCareerId("");
                  setOrgUnitId("");
                }}
              >
                <option value="">Secretaría</option>
                {secretariats.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={careerId}
                onChange={(e) => setCareerId(e.target.value)}
                disabled={selectedSecretariatCode !== "SA"}
              >
                <option value="">Carrera (opcional)</option>
                {filteredCareers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `${c.code} — ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={orgUnitId}
                onChange={(e) => setOrgUnitId(e.target.value)}
              >
                <option value="">Subárea (opcional)</option>
                {filteredOrgUnits.map((ou) => (
                  <option key={ou.id} value={ou.id}>
                    {formatOrgUnitLabel(ou)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={2000}
                max={2100}
                value={agreementYear}
                onChange={(e) =>
                  setAgreementYear(parseInt(e.target.value || String(new Date().getFullYear()), 10))
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                aria-label="Año del convenio"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={() => void reclassify()} disabled={saving}>
                {saving ? "Guardando..." : "Reclasificar convenio"}
              </Button>
            </div>
          </div>
        </SectionContainer>
      </div>
      <div className="lg:col-span-1">
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
          uploadYearFilter={uploadYearFilter}
          setUploadYearFilter={setUploadYearFilter}
          agreementYearFilter={agreementYearFilter}
          setAgreementYearFilter={setAgreementYearFilter}
        />
      </div>
    </div>
  );
}
