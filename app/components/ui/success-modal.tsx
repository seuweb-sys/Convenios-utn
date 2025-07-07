'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/app/components/ui/modal';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  redirectPath?: string;
  redirectText?: string;
  autoRedirectSeconds?: number;
  onRedirect?: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  redirectPath = '/protected',
  redirectText = 'Volver al Inicio',
  autoRedirectSeconds = 5,
  onRedirect
}: SuccessModalProps) {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoRedirectSeconds);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onRedirect) {
            onRedirect();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoRedirectSeconds, onRedirect]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-8 text-center max-w-md mx-auto">
        {/* Icono de éxito con animación */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center animate-in zoom-in-75 duration-300">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-green-500/20 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4 animate-in slide-in-from-bottom-4 duration-500">
          {title}
        </h2>

        {/* Mensaje */}
        <p className="text-muted-foreground mb-6 leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-150">
          {message}
        </p>

        {/* Estado */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 animate-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">En espera de revisión</span>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <Button
            onClick={onRedirect}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
          >
            {redirectText}
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          {/* Countdown */}
          <p className="text-xs text-muted-foreground">
            Redirigiendo automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    </Modal>
  );
} 