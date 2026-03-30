"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { formatOrgUnitLabel } from "@/lib/org-unit-label";

type MembershipRole = "secretario" | "director" | "profesor" | "miembro";

interface MembershipRecord {
  id: string;
  profile_id: string;
  membership_role: MembershipRole;
  secretariat_id: string | null;
  career_id: string | null;
  org_unit_id: string | null;
  is_active: boolean;
  profiles?: { id: string; full_name: string | null };
  secretariats?: { id: string; code: string; name: string } | null;
  careers?: { id: string; name: string; code: string | null } | null;
  org_units?: { id: string; name: string; code: string; unit_type: string } | null;
}

interface CatalogRecord {
  id: string;
  name: string;
  code?: string;
  unit_type?: string;
  secretariat_id?: string;
}

interface UserRecord {
  id: string;
  full_name: string | null;
  role: string;
}

interface MembershipsPayload {
  users: UserRecord[];
  secretariats: CatalogRecord[];
  careers: CatalogRecord[];
  org_units: CatalogRecord[];
  memberships: MembershipRecord[];
}

interface LegacyConvenio {
  id: string;
  serial_number: string;
  title: string;
  convenio_type_id: number;
  profiles?: { full_name: string | null };
}

const MEMBERSHIP_ROLES: MembershipRole[] = ["secretario", "director", "profesor", "miembro"];

export function MembershipsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<MembershipsPayload>({
    users: [],
    secretariats: [],
    careers: [],
    org_units: [],
    memberships: [],
  });
  const [legacyConvenios, setLegacyConvenios] = useState<LegacyConvenio[]>([]);

  const [profileId, setProfileId] = useState("");
  const [membershipRole, setMembershipRole] = useState<MembershipRole>("miembro");
  const [secretariatId, setSecretariatId] = useState("");
  const [careerId, setCareerId] = useState("");
  const [orgUnitId, setOrgUnitId] = useState("");
  const [legacyConvenioId, setLegacyConvenioId] = useState("");
  const [legacySecretariatId, setLegacySecretariatId] = useState("");
  const [legacyCareerId, setLegacyCareerId] = useState("");
  const [legacyOrgUnitId, setLegacyOrgUnitId] = useState("");
  const [legacyYear, setLegacyYear] = useState<number>(new Date().getFullYear());

  const selectedSecretariatCode = useMemo(() => {
    const sec = payload.secretariats.find((s) => s.id === secretariatId);
    return sec?.code || "";
  }, [payload.secretariats, secretariatId]);

  const filteredOrgUnits = useMemo(() => {
    if (!secretariatId) return payload.org_units;
    return payload.org_units.filter((ou) => ou.secretariat_id === secretariatId);
  }, [payload.org_units, secretariatId]);

  const filteredCareers = useMemo(() => {
    if (selectedSecretariatCode !== "SA") return [];
    return payload.careers;
  }, [selectedSecretariatCode, payload.careers]);

  const legacySelectedSecretariatCode = useMemo(() => {
    const sec = payload.secretariats.find((s) => s.id === legacySecretariatId);
    return sec?.code || "";
  }, [payload.secretariats, legacySecretariatId]);

  const legacyOrgUnits = useMemo(() => {
    if (!legacySecretariatId) return payload.org_units;
    return payload.org_units.filter((ou) => ou.secretariat_id === legacySecretariatId);
  }, [payload.org_units, legacySecretariatId]);

  const legacyCareers = useMemo(() => {
    return legacySelectedSecretariatCode === "SA" ? payload.careers : [];
  }, [legacySelectedSecretariatCode, payload.careers]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [membershipsRes, legacyRes] = await Promise.all([
        fetch("/api/admin/memberships", { cache: "no-store" }),
        fetch("/api/admin/legacy-convenios", { cache: "no-store" }),
      ]);

      if (!membershipsRes.ok) {
        throw new Error("No se pudo cargar la gestión de membresías");
      }
      if (!legacyRes.ok) {
        throw new Error("No se pudo cargar convenios legacy");
      }

      const data = (await membershipsRes.json()) as MembershipsPayload;
      const legacyData = (await legacyRes.json()) as { convenios: LegacyConvenio[] };
      setPayload(data);
      setLegacyConvenios(legacyData.convenios || []);
    } catch (e: any) {
      setError(e.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setProfileId("");
    setMembershipRole("miembro");
    setSecretariatId("");
    setCareerId("");
    setOrgUnitId("");
  };

  const createMembership = async () => {
    if (!profileId) {
      setError("Selecciona un usuario");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          membership_role: membershipRole,
          secretariat_id: secretariatId || null,
          career_id: careerId || null,
          org_unit_id: orgUnitId || null,
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear la membresía");
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e.message || "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  const toggleMembership = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/memberships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo actualizar la membresía");
      }
      await load();
    } catch (e: any) {
      setError(e.message || "Error inesperado");
    }
  };

  const reclassifyLegacy = async () => {
    if (!legacyConvenioId || !legacySecretariatId) {
      setError("Selecciona convenio legacy y secretaría para reclasificar");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/legacy-convenios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convenio_id: legacyConvenioId,
          secretariat_id: legacySecretariatId,
          career_id: legacyCareerId || null,
          org_unit_id: legacyOrgUnitId || null,
          agreement_year: legacyYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo reclasificar");
      }
      setLegacyConvenioId("");
      setLegacySecretariatId("");
      setLegacyCareerId("");
      setLegacyOrgUnitId("");
      setLegacyYear(new Date().getFullYear());
      await load();
    } catch (e: any) {
      setError(e.message || "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando membresías...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card/80 p-4">
        <h3 className="text-lg font-semibold mb-3">Asignar membresía</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            <option value="">Usuario</option>
            {payload.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.id.slice(0, 8)} ({u.role})
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={membershipRole}
            onChange={(e) => setMembershipRole(e.target.value as MembershipRole)}
          >
            {MEMBERSHIP_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
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
            {payload.secretariats.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
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
                {c.code ? `${c.code} - ` : ""}{c.name}
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
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={createMembership} disabled={saving}>
            {saving ? "Guardando..." : "Agregar membresía"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-lg border border-border/60 bg-card/80 p-4">
        <h3 className="text-lg font-semibold mb-3">Membresías actuales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border/60">
                <th className="py-2 pr-2">Usuario</th>
                <th className="py-2 pr-2">Rol membresía</th>
                <th className="py-2 pr-2">Secretaría</th>
                <th className="py-2 pr-2">Carrera</th>
                <th className="py-2 pr-2">Subárea</th>
                <th className="py-2 pr-2">Estado</th>
                <th className="py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {payload.memberships.map((m) => (
                <tr key={m.id} className="border-b border-border/40">
                  <td className="py-2 pr-2">{m.profiles?.full_name || m.profile_id.slice(0, 8)}</td>
                  <td className="py-2 pr-2">{m.membership_role}</td>
                  <td className="py-2 pr-2">{m.secretariats?.code || "-"}</td>
                  <td className="py-2 pr-2">
                    {m.careers ? `${m.careers.code ? `${m.careers.code} - ` : ""}${m.careers.name}` : "-"}
                  </td>
                  <td className="py-2 pr-2">
                    {m.org_units ? formatOrgUnitLabel(m.org_units) : "-"}
                  </td>
                  <td className="py-2 pr-2">{m.is_active ? "Activa" : "Inactiva"}</td>
                  <td className="py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMembership(m.id, m.is_active)}
                    >
                      {m.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </td>
                </tr>
              ))}
              {payload.memberships.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-muted-foreground">
                    No hay membresías cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card/80 p-4">
        <h3 className="text-lg font-semibold mb-3">Reclasificar convenios legacy</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={legacyConvenioId}
            onChange={(e) => setLegacyConvenioId(e.target.value)}
          >
            <option value="">Convenio legacy</option>
            {legacyConvenios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.serial_number || c.id.slice(0, 8)} - {c.title}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={legacySecretariatId}
            onChange={(e) => {
              setLegacySecretariatId(e.target.value);
              setLegacyCareerId("");
              setLegacyOrgUnitId("");
            }}
          >
            <option value="">Secretaría</option>
            {payload.secretariats.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={legacyCareerId}
            onChange={(e) => setLegacyCareerId(e.target.value)}
            disabled={legacySelectedSecretariatCode !== "SA"}
          >
            <option value="">Carrera (opcional)</option>
            {legacyCareers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} - ` : ""}{c.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={legacyOrgUnitId}
            onChange={(e) => setLegacyOrgUnitId(e.target.value)}
          >
            <option value="">Subárea (opcional)</option>
            {legacyOrgUnits.map((ou) => (
              <option key={ou.id} value={ou.id}>
                {formatOrgUnitLabel(ou)}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={2000}
            max={2100}
            value={legacyYear}
            onChange={(e) => setLegacyYear(parseInt(e.target.value || String(new Date().getFullYear()), 10))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={reclassifyLegacy} disabled={saving}>
            {saving ? "Reclasificando..." : "Reclasificar convenio legacy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
