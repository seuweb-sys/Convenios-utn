"use client";
import { useState } from "react";
import { DataTable } from "@/app/protected/admin/data-table";
import { columns } from "@/app/protected/admin/columns";
import { userColumns } from "@/app/protected/admin/users/columns";
import { careerColumns } from "@/app/protected/admin/careers/columns";
import { CareerDialog } from "@/app/protected/admin/careers/career-dialog";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { SectionContainer } from "@/app/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";

export function AdminPanelClient({ convenios, users, careers }: { convenios: any[], users: any[], careers: any[] }) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredConvenios = (convenios || []).filter((c) => {
    const statusOk = !statusFilter || c.status === statusFilter;
    const typeOk = !typeFilter || c.convenio_types?.name === typeFilter;
    return statusOk && typeOk;
  });

  return (
    <div className="mt-6">
      <Tabs defaultValue="convenios" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="convenios">Convenios</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="carreras">Carreras</TabsTrigger>
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
              />
            </div>
          </div>
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
      </Tabs>
    </div>
  );
}