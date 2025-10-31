import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from './Icons';

interface AppleToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export const AppleToast: React.FC<AppleToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Entrée
    setTimeout(() => setIsVisible(true), 100);
    
    // Sortie automatique
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="w-6 h-6" />,
    error: <XCircleIcon className="w-6 h-6" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6" />,
    info: <InformationCircleIcon className="w-6 h-6" />
  };

  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  const positionClasses = position === 'top' 
    ? 'top-4' 
    : 'bottom-4';

  return (
    <div 
      className={`
        fixed ${positionClasses} left-1/2 transform -translate-x-1/2 z-50
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-2 scale-95'
        }
      `}
    >
      <div 
        className={`
          flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl
          backdrop-blur-xl border border-white/20
          ${colors[type]}
          max-w-sm mx-4
        `}
      >
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        
        <p className="font-medium text-sm leading-relaxed">
          {message}
        </p>
        
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};