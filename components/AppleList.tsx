import React from 'react';
import { ChevronRightIcon } from './Icons';

interface AppleListProps {
  children: React.ReactNode;
  className?: string;
}

interface AppleListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  chevron?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AppleList: React.FC<AppleListProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export const AppleListItem: React.FC<AppleListItemProps> = ({
  children,
  onClick,
  icon,
  badge,
  chevron = false,
  disabled = false,
  className = ''
}) => {
  const isClickable = !!onClick && !disabled;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        flex items-center gap-4 px-6 py-4
        border-b border-gray-100 dark:border-gray-700 last:border-b-0
        transition-all duration-200
        ${isClickable 
          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700' 
          : ''
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
          {icon}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      {/* Badge */}
      {badge && (
        <div className="flex-shrink-0">
          {badge}
        </div>
      )}
      
      {/* Chevron */}
      {chevron && (
        <div className="flex-shrink-0 text-gray-400">
          <ChevronRightIcon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};