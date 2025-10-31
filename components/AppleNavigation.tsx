import React from 'react';

interface AppleNavigationProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

interface AppleNavItemProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: number;
  className?: string;
}

export const AppleNavigation: React.FC<AppleNavigationProps> = ({
  children,
  className = '',
  glass = true
}) => {
  const baseClasses = glass
    ? 'backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-700/50'
    : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700';

  return (
    <nav className={`sticky top-0 z-40 ${baseClasses} ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {children}
      </div>
    </nav>
  );
};

export const AppleNavItem: React.FC<AppleNavItemProps> = ({
  children,
  active = false,
  onClick,
  icon,
  badge,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-2xl
        font-medium transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:scale-95
        ${active 
          ? 'bg-blue-500 text-white shadow-lg' 
          : 'text-gray-700 dark:text-gray-300'
        }
        ${className}
      `}
    >
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      
      <span className="whitespace-nowrap">
        {children}
      </span>
      
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};