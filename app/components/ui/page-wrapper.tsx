'use client';

import { useEffect, useState } from 'react';
import { useLoading } from '@/app/components/providers/loading-provider';

interface PageWrapperProps {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function PageWrapper({ children, loadingText, className = '' }: PageWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const { setLoading } = useLoading();

  useEffect(() => {
    // Montaje directo sin loading artificial
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`animate-in fade-in-0 duration-300 ${className}`}>
      {children}
    </div>
  );
} 