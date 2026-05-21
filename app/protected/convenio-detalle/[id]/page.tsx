"use client";

export const dynamic = 'force-dynamic';


import { useSearchParams, useParams } from 'next/navigation';
import { ChevronLeftIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { 
  BackgroundPattern, 
  SectionContainer 
} from "@/app/components/dashboard";
import { Button } from "@/app/components/ui/button";
import { ConvenioFormLayout } from "@/app/components/convenios/ConvenioFormLayout";
import { ConvenioInfoDisplay } from "@/app/components/convenios/convenio-info-display";
import { convenioConfigs } from "@/app/components/convenios/convenio-configs";
import { useConvenioMarcoStore } from "@/stores/convenioMarcoStore";
import { getConvenioFormSlugByTypeId } from "@/app/lib/convenio-editing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { requiresAdminEditConfirmation } from "../edit-mode-helpers";

export default function ConvenioPage() {
  const params = useParams<{ id: string }>();
  const paramId = params.id;
  const isCreating = paramId === "nuevo";
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as keyof typeof convenioConfigs;
  const mode = searchParams.get('mode');
  const origin = searchParams.get('origin');
  const [approvedEditConfirmed, setApprovedEditConfirmed] = useState(false);
  
  // Store de convenio para inicializar cuando estemos en modo corrección
  const initializeStore = useConvenioMarcoStore((state) => state.initialize);
  const isStoreInitialized = useConvenioMarcoStore((state) => state.isInitialized);
  const convenioStatus = useConvenioMarcoStore((state) => state.convenioData.status);

  // Si estamos corrigiendo un convenio existente, inicializar el store con el ID
  useEffect(() => {
    if (!isCreating && mode === 'correccion' && paramId) {
      initializeStore(paramId as unknown as any);
    }
  }, [isCreating, mode, paramId, initializeStore]);

  // 3. Vista de solo lectura (por defecto para convenios existentes)
  if (!isCreating && mode !== 'correccion') {
    return (
      <>
        <BackgroundPattern />
        <div className="p-8 w-full relative">
          <ConvenioInfoDisplay convenioId={paramId} />
        </div>
      </>
    );
  }

  // 1. Creación de convenio nuevo
  if (isCreating && type && convenioConfigs[type]) {
    const config = convenioConfigs[type];
    return <ConvenioFormLayout config={config} />;
  }

  // 4. Corrección de convenio existente con datos precargados
  if (!isCreating && mode === 'correccion') {
    // Esperar a que los datos estén en el store
    if (!isStoreInitialized) {
      return (
        <div className="flex items-center justify-center h-screen w-full">
          <p className="text-muted-foreground">Cargando convenio…</p>
        </div>
      );
    }

    // Determinar slug si no es válido o falta
    let slug: keyof typeof convenioConfigs | null = null;
    if (type && convenioConfigs[type]) {
      slug = type;
    } else {
      const convenioData = useConvenioMarcoStore.getState().convenioData as any;
      const slugByTypeId = getConvenioFormSlugByTypeId(convenioData?.convenio_type_id);
      if (slugByTypeId) {
        slug = slugByTypeId;
      }

      const convenioTypeName = convenioData?.convenio_types?.name as string | undefined;
      if (convenioTypeName) {
        const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const name = normalize(convenioTypeName.toLowerCase());
        if (name.includes('marco') && name.includes('practica')) slug = 'practica-marco';
        else if (name.includes('marco')) slug = 'marco';
        else if (name.includes('especifico')) slug = 'especifico';
        else if (name.includes('particular')) slug = 'particular';
        else if (name.includes('acuerdo')) slug = 'acuerdo';
      }
    }

    if (slug && convenioConfigs[slug]) {
      const config = convenioConfigs[slug];

      if (requiresAdminEditConfirmation(origin, convenioStatus) && !approvedEditConfirmed) {
        return (
          <AlertDialog open>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Esta edición va a resetear un convenio aprobado</AlertDialogTitle>
                <AlertDialogDescription>
                  Si continuás, se archivará el documento aprobado actual, se regenerará uno nuevo y el convenio volverá a estado enviado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Link href={`/protected/convenio-detalle/${paramId}`}>Cancelar</Link>
                </AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => setApprovedEditConfirmed(true)}>
                  Continuar con la edición
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      }

      return <ConvenioFormLayout config={config} />;
    }
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
