import React from 'react';

interface AppleBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const AppleBadge: React.FC<AppleBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: dot ? 'w-2 h-2' : 'px-2 py-1 text-xs',
    md: dot ? 'w-3 h-3' : 'px-3 py-1 text-sm',
    lg: dot ? 'w-4 h-4' : 'px-4 py-2 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
    info: 'bg-cyan-500 text-white'
  };

  const baseClasses = dot 
    ? 'rounded-full flex-shrink-0'
    : 'inline-flex items-center justify-center font-semibold rounded-full';

  return (
    <span 
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {!dot && children}
    </span>
  );
};