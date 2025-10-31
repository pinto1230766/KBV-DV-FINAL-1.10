import React from 'react';

interface AppleButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const AppleButton: React.FC<AppleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = '',
  type = 'button'
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center gap-2 font-semibold
    rounded-2xl border-none cursor-pointer transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-blue-500/20
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    overflow-hidden select-none
  `;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 to-blue-600 text-white
      hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-white/10 before:to-transparent before:opacity-0 
      hover:before:opacity-100 before:transition-opacity
    `,
    secondary: `
      bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white
      hover:bg-gray-200 dark:hover:bg-gray-600 shadow-md hover:shadow-lg
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600 text-white
      hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white
      hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl
    `,
    ghost: `
      bg-transparent text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
      border border-blue-200 dark:border-blue-700
    `
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && icon && icon}
      <span className="relative z-10">{children}</span>
    </button>
  );
};