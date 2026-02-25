import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const variantClasses = {
    info: 'bg-paper-200 text-ink-600 border-paper-300',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div
      className={`rounded-sm border p-4 text-sm ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}
