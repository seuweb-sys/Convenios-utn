"use client";
import { useState } from "react";
import { DataTable } from "@/app/protected/admin/data-table";
import { columns } from "@/app/protected/admin/columns";
import { userColumns } from "@/app/protected/admin/users/columns";
import { careerColumns, Career } from "@/app/protected/admin/careers/columns";
import { CareerDialog } from "@/app/protected/admin/careers/career-dialog";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { SectionContainer } from "@/app/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { MembershipsManager } from "@/app/protected/admin/memberships/MembershipsManager";
import { ReclassifyConveniosPanel } from "@/app/protected/admin/ReclassifyConveniosPanel";
import {
  passesConvenioYearFilters,
  type AgreementYearFilterValue,
} from "@/app/lib/admin/convenio-year-filters";

export function AdminPanelClient({
  convenios,
  users,
  careers,
  secretariats,
  org_units,
}: {
  convenios: any[];
  users: any[];
  careers: Career[];
  secretariats: { id: string; code: string; name: string }[];
  org_units: { id: string; code: string; name: string; unit_type: string; secretariat_id: string | null }[];
}) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [careerFilter, setCareerFilter] = useState<string | null>(null);
  const [secretariatFilter, setSecretariatFilter] = useState<string | null>(null);
  const [uploadYearFilter, setUploadYearFilter] = useState<number | null>(null);
  const [agreementYearFilter, setAgreementYearFilter] = useState<AgreementYearFilterValue>(null);

  const filteredConvenios = (convenios || []).filter((c) => {
    const statusOk = !statusFilter || c.status === statusFilter;
    const typeOk = !typeFilter || c.convenio_types?.name === typeFilter;
    const careerOk =
      !careerFilter ||
      c.career_id === careerFilter ||
      c.profiles?.career_id === careerFilter;
    const secretariatOk = !secretariatFilter || c.secretariat_id === secretariatFilter;
    const yearOk = passesConvenioYearFilters(c, uploadYearFilter, agreementYearFilter);
    return statusOk && typeOk && careerOk && secretariatOk && yearOk;
  });

  return (
    <div className="mt-6">
      <Tabs defaultValue="convenios" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="convenios">Convenios</TabsTrigger>
          <TabsTrigger value="reclasificar">Reclasificar</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="carreras">Carreras</TabsTrigger>
          <TabsTrigger value="membresias">Membresías</TabsTrigger>
        </TabsList>

        <TabsContent value="convenios">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-4">
              <SectionContainer title="Convenios del Sistema">
                <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
                  <DataTable columns={columns} data={filteredConvenios} searchKey="title" emptyMessage="No hay convenios para mostrar." />
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
        </TabsContent>

        <TabsContent value="reclasificar">
          <ReclassifyConveniosPanel
            convenios={convenios}
            careers={careers}
            secretariats={secretariats}
            org_units={org_units}
          />
        </TabsContent>

        <TabsContent value="usuarios">
          <SectionContainer title="Gestión de Usuarios">
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
              <DataTable columns={userColumns} data={users} searchKey="full_name" emptyMessage="No hay usuarios para mostrar." />
            </div>
          </SectionContainer>
        </TabsContent>

        <TabsContent value="carreras">
          <SectionContainer title="Gestión de Carreras">
            <div className="flex justify-end mb-4">
              <CareerDialog />
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
              <DataTable columns={careerColumns} data={careers} searchKey="name" emptyMessage="No hay carreras para mostrar." />
            </div>
          </SectionContainer>
        </TabsContent>

        <TabsContent value="membresias">
          <SectionContainer title="Gestión de Membresías">
            <MembershipsManager />
          </SectionContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}