import React, { useState } from 'react';
import { PlusIcon, UserIcon, HomeIcon, SearchIcon, CalendarIcon } from './Icons';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Bouton d'activation */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
        title="Actions rapides"
      >
        <PlusIcon className={`w-6 h-6 transition-transform duration-200 ${isVisible ? 'rotate-45' : ''}`} />
      </button>

      {/* Menu des actions */}
      {isVisible && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsVisible(false)}
          />
          
          {/* Actions */}
          <div className="fixed bottom-36 right-4 z-40 space-y-3">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="flex items-center gap-3 animate-in slide-in-from-right duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Label avec raccourci */}
                <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {action.label}
                    </span>
                    {action.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border">
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
                
                {/* Bouton d'action */}
                <button
                  onClick={() => {
                    action.action();
                    setIsVisible(false);
                  }}
                  className="w-12 h-12 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors"
                  title={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// Actions rapides prédéfinies
export const getQuickActions = (handlers: {
  openSearch: () => void;
  addSpeaker: () => void;
  addHost: () => void;
  scheduleVisit: () => void;
}): QuickAction[] => [
  {
    id: 'search',
    label: 'Rechercher',
    icon: SearchIcon,
    shortcut: 'Ctrl+K',
    action: handlers.openSearch
  },
  {
    id: 'schedule',
    label: 'Programmer visite',
    icon: CalendarIcon,
    shortcut: 'Ctrl+N',
    action: handlers.scheduleVisit
  },
  {
    id: 'add-speaker',
    label: 'Ajouter orateur',
    icon: UserIcon,
    shortcut: 'Ctrl+Shift+S',
    action: handlers.addSpeaker
  },
  {
    id: 'add-host',
    label: 'Ajouter contact',
    icon: HomeIcon,
    shortcut: 'Ctrl+Shift+H',
    action: handlers.addHost
  }
];