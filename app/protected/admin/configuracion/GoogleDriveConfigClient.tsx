"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  CheckCircleIcon,
  AlertTriangle, // Corregido
  CheckIcon,
  ExternalLinkIcon,
  SettingsIcon,
  AlertCircleIcon,
  X, // Corregido
} from 'lucide-react'
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TokenInfo {
  createdAt: string;
  expiresAt: string | null;
}

interface GoogleDriveConfigClientProps {
  hasExistingTokens: boolean;
  tokenInfo: TokenInfo | null;
}

export function GoogleDriveConfigClient({ 
  hasExistingTokens, 
  tokenInfo 
}: GoogleDriveConfigClientProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGoogleDrive = async () => {
    setIsConnecting(true);
    
    try {
      // Llamar a la API para obtener URL de autorización
      const response = await fetch('/api/auth/google/connect');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirigir a Google para autorización
        window.location.href = data.authUrl;
      } else {
        throw new Error('No se pudo obtener la URL de autorización');
      }
    } catch (error) {
      console.error('Error conectando con Google Drive:', error);
      alert('Error al conectar con Google Drive. Inténtalo de nuevo.');
      setIsConnecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { 
      locale: es 
    });
  };

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Google Drive</h3>
            <p className="text-sm text-muted-foreground">
              Conectá tu cuenta de Google Drive para subir documentos
            </p>
          </div>
        </div>

        {hasExistingTokens && (
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">Conectado</span>
          </div>
        )}
      </div>

      {hasExistingTokens && tokenInfo ? (
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Cuenta de Google Drive conectada exitosamente
              </span>
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <p>Conectada el: {formatDate(tokenInfo.createdAt)}</p>
              {tokenInfo.expiresAt && (
                <p>
                  {isTokenExpired(tokenInfo.expiresAt) ? (
                    <span className="flex items-center space-x-1 text-orange-600">
                      <AlertCircleIcon className="h-3 w-3" />
                      <span>Token expirado el: {formatDate(tokenInfo.expiresAt)}</span>
                    </span>
                  ) : (
                    <span>Expira el: {formatDate(tokenInfo.expiresAt)}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Los documentos se subirán automáticamente a tu Google Drive
            </div>
            <Button
              onClick={handleConnectGoogleDrive}
              disabled={isConnecting}
              variant="outline"
              size="sm"
            >
              {isConnecting ? (
                "Reconectando..."
              ) : (
                <>
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Reconectar
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Google Drive no está conectado
              </span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Para que los documentos se suban automáticamente a Google Drive, 
              necesitás autorizar la aplicación una vez.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Solo el administrador puede conectar Google Drive
            </div>
            <Button
              onClick={handleConnectGoogleDrive}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                "Conectando..."
              ) : (
                <>
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Conectar Google Drive
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/60">
        <h4 className="text-sm font-medium mb-2">¿Qué hace esta configuración?</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Permite subir documentos automáticamente a tu Google Drive</li>
          <li>• Los archivos se organizan en carpetas según el estado del convenio</li>
          <li>• Solo necesitás autorizar una vez (los tokens se renuevan automáticamente)</li>
          <li>• Los documentos quedan en tu cuenta personal de Google</li>
        </ul>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Conexión con Google Drive</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Conecta tu cuenta de Google Drive para permitir que la aplicación guarde convenios
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="pulsing-indicator">
              <span 
                className={`animate-ping ${hasExistingTokens ? 'bg-green-400' : 'bg-red-400'}`}
              ></span>
              <span 
                className={`relative-dot ${hasExistingTokens ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
            </span>
            <span className={`text-sm font-medium ${hasExistingTokens ? 'text-green-500' : 'text-red-500'}`}>
              {hasExistingTokens ? 'Conectado' : 'No conectado'}
            </span>
          </div>
        </div>

        {/* NUEVA SECCIÓN: Información del sistema */}
        <div className="rounded-lg border bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
          <h4 className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-200">
            <SettingsIcon className="h-4 w-4" />
            Sistema de Administrador Único
          </h4>
          <div className="mt-2 space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <p>
              • <strong>Tu cuenta Google Drive</strong> se usa para TODOS los convenios
            </p>
            <p>
              • <strong>Cualquier usuario</strong> puede crear convenios, pero se guardan en tu Drive
            </p>
            <p>
              • <strong>No hay límite de usuarios</strong> en la aplicación (solo 1 cuenta OAuth)
            </p>
            <p>
              • <strong>Control centralizado</strong> - todos los archivos en un solo lugar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 