'use client';

import { useRouter } from 'next/navigation';
import { useLoading } from '@/app/components/providers/loading-provider';
import { useCallback } from 'react';

export function useLoadingNavigation() {
  const router = useRouter();
  const { setLoading } = useLoading();

  const navigate = useCallback((path: string, loadingText?: string) => {
    // Navegación directa sin overlay molesto
    router.push(path);
  }, [router, setLoading]);

  const replace = useCallback((path: string, loadingText?: string) => {
    router.replace(path);
  }, [router, setLoading]);

  const back = useCallback((loadingText?: string) => {
    router.back();
  }, [router, setLoading]);

  return {
    navigate,
    replace,
    back,
  };
} 