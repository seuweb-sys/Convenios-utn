'use client';

import { createContext, useContext, useCallback } from 'react';
import { useToast } from '@/app/components/ui/toast';
import { useLoadingNavigation } from '@/app/hooks/use-loading-navigation';

interface FeedbackContextType {
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showConvenioSuccess: (convenioType: string, redirectPath?: string) => void;
  showFormSuccess: (formName: string, redirectPath?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { success, error } = useToast();
  const { navigate } = useLoadingNavigation();

  const showSuccess = useCallback((message: string, description?: string) => {
    success(message, description);
  }, [success]);

  const showError = useCallback((message: string, description?: string) => {
    error(message, description);
  }, [error]);

  const showConvenioSuccess = useCallback((convenioType: string, redirectPath?: string) => {
    success(
      '¡Convenio enviado exitosamente!',
      `Tu ${convenioType} ha sido enviado para revisión. Recibirás notificaciones sobre el estado.`
    );
    
    if (redirectPath) {
      setTimeout(() => {
        navigate(redirectPath, 'Redirigiendo...');
      }, 2000);
    }
  }, [success, navigate]);

  const showFormSuccess = useCallback((formName: string, redirectPath?: string) => {
    success(
      '¡Formulario enviado exitosamente!',
      `Tu ${formName} ha sido procesado correctamente.`
    );
    
    if (redirectPath) {
      setTimeout(() => {
        navigate(redirectPath, 'Redirigiendo...');
      }, 2000);
    }
  }, [success, navigate]);

  return (
    <FeedbackContext.Provider value={{
      showSuccess,
      showError,
      showConvenioSuccess,
      showFormSuccess
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
} 