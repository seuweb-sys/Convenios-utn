"use client";
import { useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { AdminFilters } from "@/app/protected/admin/admin-filters";
import { SectionContainer } from "@/app/components/dashboard";

export function ProfesorPanelClient({ convenios }: { convenios: any[] }) {
  console.log("ProfesorPanelClient recibió:", convenios);
  
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredConvenios = (convenios || []).filter((c) => {
    const statusOk = !statusFilter || c.status === statusFilter;
    const typeOk = !typeFilter || c.convenio_types?.name === typeFilter;
    return statusOk && typeOk;
  });

  console.log("Convenios filtrados:", filteredConvenios.length);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
      <div className="lg:col-span-4">
        <SectionContainer title="Convenios del Sistema">
          <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden">
            <DataTable columns={columns} data={filteredConvenios} />
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
  );
} 