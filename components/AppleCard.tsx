import React from 'react';

interface AppleCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export const AppleCard: React.FC<AppleCardProps> = ({ 
  children, 
  className = '', 
  hover = true, 
  glass = false,
  onClick 
}) => {
  const baseClasses = glass 
    ? 'glass-effect dark:glass-effect-dark' 
    : 'bg-white dark:bg-gray-800 shadow-lg';
    
  const hoverClasses = hover 
    ? 'hover:transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300' 
    : '';
    
  const clickClasses = onClick 
    ? 'cursor-pointer active:scale-[0.98]' 
    : '';

  return (
    <div 
      className={`
        ${baseClasses}
        ${hoverClasses}
        ${clickClasses}
        rounded-2xl p-6 border border-black/5 dark:border-white/10
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};