"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/app/protected/admin/data-table";
import { columns } from "./columns";
import { ActivityApiData } from "@/app/api/activity/route";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";

export default function ActividadPage() {
  const [activities, setActivities] = useState<ActivityApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then(res => res.json())
      .then((data: ActivityApiData[]) => {
        setActivities(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching activity:", error);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <BackgroundPattern />
      <div className="p-6 w-full relative">
        <DashboardHeader 
          name="Actividad" 
          subtitle="Historial de actividades y cambios en el sistema" 
        />
        
        <div className="mt-6">
          <SectionContainer title="Historial de Actividad">
            {loading ? (
              <div className="space-y-4">
                <div className="h-24 w-full skeleton"></div>
                <div className="h-24 w-full skeleton"></div>
                <div className="h-24 w-full skeleton"></div>
              </div>
            ) : (
              <DataTable columns={columns} data={activities} />
            )}
          </SectionContainer>
        </div>
      </div>
    </>
  );
} 