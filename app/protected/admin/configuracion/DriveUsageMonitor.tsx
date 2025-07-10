"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { HardDriveIcon, FolderIcon, FileIcon, AlertTriangleIcon } from "lucide-react";

interface DriveUsage {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  percentUsed: number;
  conveniosCount: number;
  lastUpdated: string;
}

export function DriveUsageMonitor() {
  const [usage, setUsage] = useState<DriveUsage | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/drive-usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching drive usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (percent: number) => {
    if (percent > 90) return 'text-red-600 bg-red-100';
    if (percent > 75) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <HardDriveIcon className="h-5 w-5" />
          Uso de Google Drive
        </h3>
        <Button 
          onClick={fetchUsage} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Uso de almacenamiento */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Almacenamiento</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usado:</span>
                <span>{formatBytes(usage.usedStorage)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span>{formatBytes(usage.totalStorage)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    usage.percentUsed > 90 ? 'bg-red-500' :
                    usage.percentUsed > 75 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
                />
              </div>
              <div className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${getUsageColor(usage.percentUsed)}`}>
                {usage.percentUsed.toFixed(1)}% usado
              </div>
            </div>
          </div>

          {/* Estadísticas de convenios */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Convenios</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Total convenios:</span>
                <span className="font-semibold">{usage.conveniosCount}</span>
              </div>
              <div className="text-xs text-gray-500">
                Última actualización: {new Date(usage.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas de almacenamiento */}
      {usage && usage.percentUsed > 85 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangleIcon className="h-5 w-5" />
            <h4 className="font-medium">Almacenamiento casi lleno</h4>
          </div>
          <p className="text-sm text-orange-700 mt-2">
            Tu Google Drive está usando más del 85% del espacio disponible. 
            Considera limpiar archivos antiguos o actualizar a un plan con más almacenamiento.
          </p>
          <div className="mt-3">
            <Button size="sm" variant="outline">
              <a href="https://one.google.com/storage" target="_blank" rel="noopener noreferrer">
                Gestionar almacenamiento
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 