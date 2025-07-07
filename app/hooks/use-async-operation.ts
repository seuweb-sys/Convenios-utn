'use client';

import { useState, useCallback } from 'react';
import { useLoading } from '@/app/components/providers/loading-provider';
import { useToast } from '@/app/components/ui/toast';

interface AsyncOperationOptions {
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAsyncOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const { setLoading } = useLoading();
  const { success, error } = useToast();

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    const {
      loadingText = 'Procesando...',
      successMessage,
      errorMessage,
      onSuccess,
      onError
    } = options;

    setIsLoading(true);
    setLoading(true, loadingText);

    try {
      const result = await operation();
      
      if (successMessage) {
        success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (err) {
      const errorObj = err as Error;
      
      if (errorMessage) {
        error(errorMessage, errorObj.message);
      } else {
        error('Error', errorObj.message);
      }
      
      if (onError) {
        onError(errorObj);
      }
      
      return null;
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [setLoading, success, error]);

  return {
    execute,
    isLoading
  };
} 