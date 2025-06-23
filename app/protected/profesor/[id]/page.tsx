"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  ChevronLeftIcon, 
  BuildingIcon, 
  UserIcon, 
  CalendarIcon, 
  FileTextIcon,
  ClipboardCheckIcon,
  CheckIcon
} from "lucide-react";
import Link from "next/link";
import {
  SectionContainer,
  BackgroundPattern,
  DashboardHeader
} from "@/app/components/dashboard";
import { Button } from "@/app/components/ui/button";

export default function ConvenioDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [convenio, setConvenio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchConvenio() {
      try {
        setLoading(true);
        
        // Verificar autenticación
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Verificar rol (solo admin y profesor pueden ver detalles)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin" && profile?.role !== "profesor") {
          router.push("/protected");
          return;
        }

        // Obtener convenio con todos los datos
        const { data: convenioData, error: convenioError } = await supabase
          .from("convenios")
          .select(`
            *,
            profiles:user_id (
              full_name,
              role
            ),
            convenio_types (
              name
            ),
            observaciones (
              id,
              content,
              created_at,
              resolved
            )
          `)
          .eq("id", params.id)
          .single();

        if (convenioError) {
          throw new Error("Error al cargar convenio");
        }

        setConvenio(convenioData);
        console.log("Convenio cargado:", convenioData);
        console.log("Form data:", convenioData?.form_data);
      } catch (e) {
        console.error("Error:", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchConvenio();
    }
  }, [params.id, router]);

  // Función helper para renderizar campos de entidad
  const renderEntidadData = (data: any) => {
    if (!data) return null;
    
    console.log("Data recibida en renderEntidadData:", data);
    
    // Intentar extraer datos de diferentes estructuras
    let entidadInfo: any = {};
    
    if (data.entidad_nombre) {
      // Acuerdo de Colaboración / Convenio Particular
      entidadInfo = {
        nombre: data.entidad_nombre,
        cuit: data.entidad_cuit,
        domicilio: data.entidad_domicilio,
        ciudad: data.entidad_ciudad,
        rubro: data.entidad_rubro
      };
    } else if (data.empresa_nombre) {
      // Convenio Particular (estructura empresa)
      entidadInfo = {
        nombre: data.empresa_nombre,
        cuit: data.empresa_cuit,
        domicilio: data.empresa_direccion_calle,
        ciudad: data.empresa_direccion_ciudad,
        rubro: "Empresa"
      };
    } else if (data.partes && data.partes[0]) {
      // Convenio Marco / Específico / Práctica Marco
      const parte = data.partes[0];
      entidadInfo = {
        nombre: parte.nombre,
        tipo: parte.tipo,
        domicilio: parte.domicilio,
        ciudad: parte.ciudad,
        cuit: parte.cuit,
        rubro: parte.rubro
      };
    }

    // Si no hay datos específicos, mostrar todos los campos disponibles
    if (Object.keys(entidadInfo).length === 0) {
      console.log("No se encontraron datos específicos, mostrando todos los campos:", data);
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/10 to-blue-600/10 rounded-xl blur-xl"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
              <BuildingIcon className="h-5 w-5" />
              Datos del Convenio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(data).map(([key, value]) => (
                <div key={key}><span className="font-medium">{key}:</span> {String(value)}</div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/10 to-blue-600/10 rounded-xl blur-xl"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
            <BuildingIcon className="h-5 w-5" />
            Datos de la Entidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {entidadInfo.nombre && <div><span className="font-medium">Entidad:</span> {entidadInfo.nombre}</div>}
            {entidadInfo.tipo && <div><span className="font-medium">Tipo:</span> {entidadInfo.tipo}</div>}
            {entidadInfo.cuit && <div><span className="font-medium">CUIT:</span> {entidadInfo.cuit}</div>}
            {entidadInfo.domicilio && <div><span className="font-medium">Dirección:</span> {entidadInfo.domicilio}</div>}
            {entidadInfo.ciudad && <div><span className="font-medium">Ciudad:</span> {entidadInfo.ciudad}</div>}
            {entidadInfo.rubro && <div><span className="font-medium">Rubro:</span> {entidadInfo.rubro}</div>}
          </div>
        </div>
      </div>
    );
  };

  // Función helper para renderizar datos del representante
  const renderRepresentanteData = (data: any) => {
    if (!data) return null;
    
    let representanteInfo: any = {};
    
    if (data.entidad_representante) {
      // Acuerdo de Colaboración
      representanteInfo = {
        nombre: data.entidad_representante,
        dni: data.entidad_dni,
        cargo: data.entidad_cargo
      };
    } else if (data.empresa_representante_nombre) {
      // Convenio Particular
      representanteInfo = {
        nombre: data.empresa_representante_nombre,
        cargo: data.empresa_representante_caracter,
        dni: null
      };
    } else if (data.partes && data.partes[0]) {
      // Convenio Marco / Específico / Práctica Marco
      const parte = data.partes[0];
      representanteInfo = {
        nombre: parte.representanteNombre,
        cargo: parte.cargoRepresentante,
        dni: parte.representanteDni
      };
    }

    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-teal-600 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Datos del Representante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {representanteInfo.nombre && <div><span className="font-medium">Representante:</span> {representanteInfo.nombre}</div>}
            {representanteInfo.cargo && <div><span className="font-medium">Cargo:</span> {representanteInfo.cargo}</div>}
            {representanteInfo.dni && <div><span className="font-medium">DNI:</span> {representanteInfo.dni}</div>}
          </div>
        </div>
      </div>
    );
  };

  // Función helper para renderizar datos específicos según el tipo
  const renderSpecificData = (data: any, tipo: string) => {
    if (!data) return null;

    switch (tipo) {
      case "Convenio Particular de Práctica Supervisada":
        return (
          <>
            {/* Datos del Alumno */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Datos del Alumno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {data.alumno_carrera && <div><span className="font-medium">Carrera:</span> {data.alumno_carrera}</div>}
                  {data.alumno_dni && <div><span className="font-medium">DNI:</span> {data.alumno_dni}</div>}
                  {data.alumno_legajo && <div><span className="font-medium">Legajo:</span> {data.alumno_legajo}</div>}
                </div>
              </div>
            </div>

            {/* Detalles de la Práctica */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                  <ClipboardCheckIcon className="h-5 w-5" />
                  Detalles de la Práctica
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.fecha_inicio && <div><span className="font-medium">Fecha Inicio:</span> {data.fecha_inicio}</div>}
                    {data.fecha_fin && <div><span className="font-medium">Fecha Fin:</span> {data.fecha_fin}</div>}
                    {data.facultad_docente_tutor_nombre && <div><span className="font-medium">Docente Tutor:</span> {data.facultad_docente_tutor_nombre}</div>}
                    {data.empresa_tutor_nombre && <div><span className="font-medium">Tutor Empresarial:</span> {data.empresa_tutor_nombre}</div>}
                    {data.fecha_firma && <div><span className="font-medium">Fecha Firma:</span> {data.fecha_firma}</div>}
                  </div>
                  {data.practica_tematica && <div><span className="font-medium">Temática:</span> {data.practica_tematica}</div>}
                </div>
              </div>
            </div>
          </>
        );

      case "Convenio Específico":
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Detalles del Convenio Específico
              </h3>
              <div className="text-sm space-y-1">
                {data.datosBasicos?.convenioMarcoFecha && <div><span className="font-medium">Fecha convenio marco:</span> {data.datosBasicos.convenioMarcoFecha}</div>}
                {data.datosBasicos?.convenioEspecificoTipo && <div><span className="font-medium">Tipo específico:</span> {data.datosBasicos.convenioEspecificoTipo}</div>}
                {data.datosBasicos?.unidadEjecutoraFacultad && <div><span className="font-medium">Unidad ejecutora facultad:</span> {data.datosBasicos.unidadEjecutoraFacultad}</div>}
                {data.datosBasicos?.unidadEjecutoraEntidad && <div><span className="font-medium">Unidad ejecutora entidad:</span> {data.datosBasicos.unidadEjecutoraEntidad}</div>}
                {data.datosBasicos?.dia && data.datosBasicos?.mes && (
                  <div><span className="font-medium">Fecha de firma:</span> {data.datosBasicos.dia} de {data.datosBasicos.mes}</div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        // Para Convenio Marco, Práctica Marco, Acuerdo de Colaboración
        const fechaInfo = data.dia && data.mes ? `${data.dia} de ${data.mes}` : 
                          data.datosBasicos?.dia && data.datosBasicos?.mes ? `${data.datosBasicos.dia} de ${data.datosBasicos.mes}` : 
                          null;

        if (fechaInfo) {
          return (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-green-500/10 to-green-600/10 rounded-xl blur-xl"></div>
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Datos de la Firma
                </h3>
                <div className="text-sm">
                  <div><span className="font-medium">Fecha de Firma:</span> {fechaInfo}</div>
                </div>
              </div>
            </div>
          );
        }
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded-lg w-96 mb-8"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !convenio) {
    return (
      <>
        <BackgroundPattern />
        <div className="p-6 w-full relative">
          <DashboardHeader name="Error" subtitle="No se pudo cargar el convenio" />
          <div className="mt-6">
            <SectionContainer title="Error">
              <div className="text-center py-12 text-red-500">
                <p className="text-lg font-semibold">Error al cargar el convenio</p>
                <p className="text-sm mt-2">El convenio no existe o no tienes permisos para verlo</p>
                <Link href="/protected/profesor" className="mt-4 inline-block">
                  <Button>
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    Volver al Panel
                  </Button>
                </Link>
              </div>
            </SectionContainer>
          </div>
        </div>
      </>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      enviado: { label: "Enviado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
      aprobado: { label: "Aprobado", className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
      aceptado: { label: "Aceptado", className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
      rechazado: { label: "Rechazado", className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
    };

    const { label, className } = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <BackgroundPattern />
      <div className="p-6 w-full relative">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/protected/profesor">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Detalle del Convenio</h1>
            <p className="text-muted-foreground">{convenio.serial_number}</p>
          </div>
          {getStatusBadge(convenio.status)}
        </div>

        <div className="space-y-6">
          {/* Información General */}
          <SectionContainer title="Información General">
            <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Título:</span> {convenio.title}</div>
                <div><span className="font-medium">Tipo:</span> {convenio.convenio_types?.name || "Sin tipo"}</div>
                <div><span className="font-medium">Creado por:</span> {convenio.profiles?.full_name}</div>
                <div><span className="font-medium">Fecha de creación:</span> {formatDate(convenio.created_at)}</div>
                {convenio.updated_at && (
                  <div><span className="font-medium">Última actualización:</span> {formatDate(convenio.updated_at)}</div>
                )}
              </div>
            </div>
          </SectionContainer>

          {/* Datos del Convenio - Sin SectionContainer para máximo ancho */}
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-500/20 text-green-600">
                  <CheckIcon className="h-5 w-5" />
                </div>
                Datos del Convenio
              </h2>
              <p className="text-sm text-muted-foreground">
                Todos los datos registrados para este convenio.
              </p>
            </div>

            <div className="w-full space-y-6">
                {/* Mostrar bloques con datos si están disponibles, sino mensaje explicativo */}
                {convenio.form_data ? (
                  <>
                    {renderEntidadData(convenio.form_data)}
                    {renderRepresentanteData(convenio.form_data)}
                    {renderSpecificData(convenio.form_data, convenio.convenio_types?.name)}
                  </>
                ) : (
                  <div className="relative w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/10 to-blue-600/10 rounded-xl blur-xl"></div>
                    <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-xl p-8 w-full">
                      <h3 className="text-lg font-semibold text-blue-600 mb-6 flex items-center gap-2">
                        <BuildingIcon className="h-5 w-5" />
                        Datos del Convenio
                      </h3>
                      <div className="text-center py-12">
                        <FileTextIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
                        <p className="text-lg text-muted-foreground mb-3">
                          Los datos detallados del formulario no están disponibles para este convenio.
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                          Este convenio fue creado con una versión anterior del sistema.
                        </p>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm text-primary font-medium">
                            💡 Para ver los datos detallados, crea un nuevo convenio usando el sistema actual.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
                      </SectionContainer>
          </div>

          {/* Observaciones */}
          {convenio.observaciones && convenio.observaciones.length > 0 && (
            <SectionContainer title="Observaciones">
              <div className="space-y-4">
                {convenio.observaciones.map((obs: any) => (
                  <div key={obs.id} className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        obs.resolved 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                      }`}>
                        {obs.resolved ? 'Resuelta' : 'Pendiente'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(obs.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{obs.content}</p>
                  </div>
                ))}
              </div>
            </SectionContainer>
          )}
        </div>
      </div>
    </>
  );
} 