"use client";

import { useSearchParams, useParams } from 'next/navigation';
import { ChevronLeftIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { 
  BackgroundPattern, 
  SectionContainer 
} from "@/app/components/dashboard";
import { Button } from "@/app/components/ui/button";
import { ConvenioFormLayout } from "@/app/components/convenios/ConvenioFormLayout";
import { convenioConfigs } from "@/app/components/convenios/convenio-configs";

export default function ConvenioPage() {
  const params = useParams<{ id: string }>();
  const paramId = params.id;
  const isCreating = paramId === "nuevo";
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as keyof typeof convenioConfigs;
  
  // Si está creando un convenio y el tipo existe en la configuración
  if (isCreating && type && convenioConfigs[type]) {
    const config = convenioConfigs[type];
    return <ConvenioFormLayout config={config} />;
  }

  // Si no es un tipo válido, mostrar mensaje de no disponible
  return (
    <>
      <BackgroundPattern />
      <div className="p-8 w-full relative">
        <div className="flex items-center justify-center h-[60vh]">
          <SectionContainer title="No disponible">
            <div className="text-center py-8">
              <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold mb-2">Tipo de Convenio No Disponible</h2>
              <p className="text-muted-foreground mb-6">
                {type ? 
                  `El tipo "${type}" no está disponible actualmente.` :
                  "Debe especificar un tipo de convenio válido."
                }
              </p>
              <Link href="/protected">
                <Button>
                  <ChevronLeftIcon className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </SectionContainer>
        </div>
      </div>
    </>
  );
} 