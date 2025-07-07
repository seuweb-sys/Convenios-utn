'use client';

import { useState } from 'react';
import { Modal } from '@/app/components/ui/modal';
import { AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';

interface RequestModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  convenioId: string;
  convenioTitle: string;
  onSuccess?: () => void;
}

export function RequestModificationModal({
  isOpen,
  onClose,
  convenioId,
  convenioTitle,
  onSuccess
}: RequestModificationModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Por favor, explica el motivo de la solicitud');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/convenios/${convenioId}/request-modification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: message.trim(),
          convenio_title: convenioTitle
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar la solicitud');
      }

      // Limpiar y cerrar
      setMessage('');
      onClose();
      onSuccess?.();
      
      alert('✅ Solicitud enviada correctamente.\n\nEl administrador será notificado y podrá habilitar la edición del convenio.');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error inesperado al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Solicitar Modificación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Convenio: <span className="font-medium">{convenioTitle}</span>
          </p>
        </div>

        {/* Información */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 ¿Cuándo usar esta función?
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Error en datos del alumno o empresa</li>
            <li>• Fechas incorrectas</li>
            <li>• Información desactualizada</li>
            <li>• Otros errores detectados</li>
          </ul>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Motivo de la solicitud *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explica detalladamente qué necesita ser modificado y por qué..."
              className="mt-1 min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isSubmitting ? (
              'Enviando...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Solicitud
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          El administrador recibirá una notificación y podrá habilitar la edición.
        </p>
      </div>
    </Modal>
  );
} 