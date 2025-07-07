'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  FileTextIcon, 
  CalendarIcon, 
  BuildingIcon, 
  UserIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { RequestModificationModal } from '@/app/components/ui/request-modification-modal';

interface ConvenioInfoDisplayProps {
  convenioId: string;
}

interface ConvenioData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  content_data: any;
  form_data: any;
  convenio_types: {
    id: number;
    name: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

const statusConfig = {
  pendiente: {
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Pendiente de Revisión'
  },
  aprobado: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    label: 'Aprobado'
  },
  rechazado: {
    icon: XCircle,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    label: 'Rechazado'
  },
  enviado: {
    icon: Clock,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    label: 'Enviado'
  },
  borrador: {
    icon: FileTextIcon,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
    label: 'Borrador'
  },
  revision_modificacion: {
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    label: 'Solicitud de Modificación'
  }
};

export function ConvenioInfoDisplay({ convenioId }: ConvenioInfoDisplayProps) {
  const router = useRouter();
  const [convenio, setConvenio] = useState<ConvenioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConvenio();
  }, [convenioId]);

  const fetchConvenio = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/convenios/${convenioId}`);
      
      if (!response.ok) {
        throw new Error('No se pudo cargar el convenio');
      }
      
      const data = await response.json();
      setConvenio(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!convenio) return;
    
    // Determinar el tipo de convenio para la URL
    const convenioTypeName = convenio.convenio_types.name.toLowerCase();
    let typeSlug = '';
    
    if (convenioTypeName.includes('marco') && convenioTypeName.includes('práctica')) {
      typeSlug = 'practica-marco';
    } else if (convenioTypeName.includes('marco')) {
      typeSlug = 'marco';
    } else if (convenioTypeName.includes('específico')) {
      typeSlug = 'especifico';
    } else if (convenioTypeName.includes('particular')) {
      typeSlug = 'particular';
    } else if (convenioTypeName.includes('acuerdo')) {
      typeSlug = 'acuerdo';
    }
    
    router.push(`/protected/convenio-detalle/${convenioId}?type=${typeSlug}&mode=correccion`);
  };

  const renderBasicInfo = () => {
    if (!convenio?.form_data) return null;

    const data = convenio.form_data;
    
    return (
      <div className="space-y-6">
        {/* Información del Estudiante/Alumno (si existe) */}
        {data.alumno_nombre && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <UserIcon className="w-5 h-5" />
              Información del Estudiante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-600 dark:text-blue-400">Estudiante:</span>
                <p className="mt-1 font-semibold text-blue-800 dark:text-blue-200">{data.alumno_nombre}</p>
              </div>
              {data.alumno_carrera && (
                <div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">Carrera:</span>
                  <p className="mt-1 text-blue-800 dark:text-blue-200">{data.alumno_carrera}</p>
                </div>
              )}
              {data.alumno_legajo && (
                <div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">Legajo:</span>
                  <p className="mt-1 text-blue-800 dark:text-blue-200">{data.alumno_legajo}</p>
                </div>
              )}
              {data.alumno_dni && (
                <div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">DNI:</span>
                  <p className="mt-1 text-blue-800 dark:text-blue-200">***{data.alumno_dni.slice(-3)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información de la Empresa/Entidad */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BuildingIcon className="w-5 h-5 text-green-600" />
            Empresa/Entidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Nombre:</span>
              <p className="mt-1 font-semibold">{data.entidad_nombre || data.empresa_nombre || 'No especificado'}</p>
            </div>
            {(data.entidad_tipo || data.empresa_tipo) && (
              <div>
                <span className="font-medium text-muted-foreground">Tipo:</span>
                <p className="mt-1">{data.entidad_tipo || data.empresa_tipo}</p>
              </div>
            )}
            {(data.entidad_cuit || data.empresa_cuit) && (
              <div>
                <span className="font-medium text-muted-foreground">CUIT:</span>
                <p className="mt-1">***{(data.entidad_cuit || data.empresa_cuit).slice(-4)}</p>
              </div>
            )}
            {(data.entidad_domicilio || data.empresa_direccion_calle) && (
              <div>
                <span className="font-medium text-muted-foreground">Dirección:</span>
                <p className="mt-1">{data.entidad_domicilio || data.empresa_direccion_calle}</p>
              </div>
            )}
            {(data.entidad_ciudad || data.empresa_direccion_ciudad) && (
              <div>
                <span className="font-medium text-muted-foreground">Ciudad:</span>
                <p className="mt-1">{data.entidad_ciudad || data.empresa_direccion_ciudad}</p>
              </div>
            )}
            {data.entidad_rubro && (
              <div>
                <span className="font-medium text-muted-foreground">Rubro:</span>
                <p className="mt-1">{data.entidad_rubro}</p>
              </div>
            )}
          </div>
        </div>

        {/* Representante/Contacto */}
        {(data.entidad_representante || data.representanteNombre || data.empresa_representante_nombre) && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-orange-600" />
              Representante Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Nombre:</span>
                <p className="mt-1 font-semibold">
                  {data.entidad_representante || data.representanteNombre || data.empresa_representante_nombre || 'No especificado'}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Cargo:</span>
                <p className="mt-1">
                  {data.entidad_cargo || data.cargoRepresentante || data.empresa_representante_caracter || 'No especificado'}
                </p>
              </div>
              {data.representante_telefono && (
                <div>
                  <span className="font-medium text-muted-foreground">Teléfono:</span>
                  <p className="mt-1">{data.representante_telefono}</p>
                </div>
              )}
              {data.representante_email && (
                <div>
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <p className="mt-1">{data.representante_email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fechas y Tipo de Convenio */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            Información del Convenio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Tipo de Convenio:</span>
              <p className="mt-1 font-semibold">{convenio.convenio_types.name}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Fecha de Creación:</span>
              <p className="mt-1">{new Date(convenio.created_at).toLocaleDateString('es-ES')}</p>
            </div>
            {data.dia && data.mes && (
              <div>
                <span className="font-medium text-muted-foreground">Fecha de Firma:</span>
                <p className="mt-1">{data.dia} de {data.mes}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-muted-foreground">Última Actualización:</span>
              <p className="mt-1">{new Date(convenio.updated_at).toLocaleDateString('es-ES')}</p>
            </div>
            {data.fecha_inicio && (
              <div>
                <span className="font-medium text-muted-foreground">Fecha de Inicio:</span>
                <p className="mt-1">{new Date(data.fecha_inicio).toLocaleDateString('es-ES')}</p>
              </div>
            )}
            {data.fecha_fin && (
              <div>
                <span className="font-medium text-muted-foreground">Fecha de Fin:</span>
                <p className="mt-1">{new Date(data.fecha_fin).toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Información de Práctica/Actividad (si existe) */}
        {(data.practica_tematica || data.alumno_tutor || data.empresa_tutor || data.practica_carga_horaria) && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileTextIcon className="w-5 h-5 text-indigo-600" />
              Información de la Práctica
            </h3>
            <div className="space-y-4 text-sm">
              {data.practica_tematica && (
                <div>
                  <span className="font-medium text-muted-foreground">Temática:</span>
                  <p className="mt-1 text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded border-l-4 border-indigo-500">{data.practica_tematica}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.alumno_tutor && (
                  <div>
                    <span className="font-medium text-muted-foreground">Tutor UTN:</span>
                    <p className="mt-1">{data.alumno_tutor}</p>
                  </div>
                )}
                {data.empresa_tutor && (
                  <div>
                    <span className="font-medium text-muted-foreground">Tutor Empresa:</span>
                    <p className="mt-1">{data.empresa_tutor}</p>
                  </div>
                )}
                {data.practica_carga_horaria && (
                  <div>
                    <span className="font-medium text-muted-foreground">Carga Horaria:</span>
                    <p className="mt-1">{data.practica_carga_horaria} horas</p>
                  </div>
                )}
                {data.practica_modalidad && (
                  <div>
                    <span className="font-medium text-muted-foreground">Modalidad:</span>
                    <p className="mt-1">{data.practica_modalidad}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando convenio...</p>
        </div>
      </div>
    );
  }

  if (error || !convenio) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar el convenio</h2>
        <p className="text-muted-foreground mb-6">{error || 'No se encontró el convenio'}</p>
        <Link href="/protected/convenios-lista">
          <Button>
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Volver a Mis Convenios
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[convenio.status as keyof typeof statusConfig] || statusConfig.pendiente;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/protected/convenios-lista">
            <Button variant="outline" size="sm">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{convenio.title}</h1>
            <p className="text-muted-foreground">{convenio.convenio_types.name}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${statusInfo.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{statusInfo.label}</span>
        </div>
      </div>

      {/* Información */}
      {renderBasicInfo()}

      {/* Acciones */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Disponibles</h3>
        <div className="flex flex-wrap gap-3">
          {/* Solo mostrar botón de editar si está en borrador */}
          {convenio.status === 'borrador' && (
            <Button onClick={handleEditClick} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Continuar Editando
            </Button>
          )}
          
          {/* Solicitar modificación si está aprobado */}
          {convenio.status === 'aprobado' && (
            <Button 
              onClick={() => setShowRequestModal(true)}
              variant="outline"
              className="flex items-center gap-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Solicitar Modificación
            </Button>
          )}

          {/* Mostrar estado si está en revisión de modificación */}
          {convenio.status === 'revision_modificacion' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800 dark:text-orange-200">
                Solicitud de modificación enviada. Esperando respuesta del administrador.
              </span>
            </div>
          )}
        </div>
        
        {/* Información adicional */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> Esta es una vista de solo lectura por motivos de privacidad. 
            {convenio.status === 'aprobado' && ' Si necesitas realizar cambios, usa "Solicitar Modificación".'}
            {convenio.status === 'borrador' && ' Puedes continuar editando mientras esté en borrador.'}
            {convenio.status === 'pendiente' && ' El convenio está siendo revisado por el equipo administrativo.'}
            {convenio.status === 'revision_modificacion' && ' Has solicitado una modificación. El administrador revisará tu solicitud y podrá habilitar la edición.'}
          </p>
        </div>
      </div>

      {/* Modal de solicitud de modificación */}
      <RequestModificationModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        convenioId={convenio.id}
        convenioTitle={convenio.title}
        onSuccess={() => {
          // Actualizar la página o mostrar mensaje
          window.location.reload();
        }}
      />
    </div>
  );
} 