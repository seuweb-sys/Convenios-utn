'use client';

import { useLoading } from "@/app/components/providers/loading-provider";
import { Spinner } from "@/app/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function LoadingOverlay() {
  const { isLoading, loadingText } = useLoading();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('loading-cursor');
    } else {
      document.body.classList.remove('loading-cursor');
    }
    
    return () => {
      document.body.classList.remove('loading-cursor');
    };
  }, [isLoading]);

  if (!mounted || !isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200" />
      
      {/* Contenedor del spinner */}
      <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Card contenedor */}
        <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            {/* Spinner con efecto de glow */}
            <div className="relative">
              <Spinner size="xl" className="text-primary" />
              <div className="absolute inset-0 animate-ping">
                <Spinner size="xl" className="text-primary/30" />
              </div>
            </div>
            
            {/* Texto de carga */}
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{loadingText}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 