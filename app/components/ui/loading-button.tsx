'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Spinner } from '@/app/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void | Promise<void>;
}

export function LoadingButton({
  children,
  loadingText = 'Cargando...',
  variant = 'default',
  size = 'default',
  onClick,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!onClick || isLoading) return;

    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Spinner 
            size="sm" 
            variant={variant === 'outline' ? 'default' : 'white'} 
          />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </Button>
  );
} 