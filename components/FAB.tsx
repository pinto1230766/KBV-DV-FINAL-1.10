import React, { useState } from 'react';
import { PlusIcon } from './Icons';

interface FABAction {
    label: string;
    icon: React.FC<{ className?: string }>;
    onClick: () => void;
}

interface FABProps {
    actions: FABAction[];
}

export const FAB: React.FC<FABProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);

    const mainAction = actions[0];
    const subActions = actions.slice(1);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (subActions.length > 0) {
            setIsOpen(prev => !prev);
        } else {
            mainAction.onClick();
        }
    };
    
    const handleActionClick = (actionOnClick: () => void) => {
        actionOnClick();
        setIsOpen(false);
    }

    return (
        <div className="fixed bottom-6 right-6 z-30 mobile-nav-safe-area no-print">
            <div className="relative flex flex-col items-center gap-3">
                {isOpen && subActions.map((action, index) => (
                    <div key={action.label} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${(subActions.length - index -1) * 50}ms`}}>
                         <span className="bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark px-3 py-1 rounded-md shadow-lg text-sm font-semibold">
                            {action.label}
                        </span>
                        <button
                            onClick={() => handleActionClick(action.onClick)}
                            className="w-12 h-12 bg-white dark:bg-primary-light rounded-full shadow-lg flex items-center justify-center text-primary dark:text-white"
                            aria-label={action.label}
                        >
                            <action.icon className="w-6 h-6" />
                        </button>
                    </div>
                ))}
                
                <button
                    onClick={toggleMenu}
                    className="w-16 h-16 bg-primary hover:bg-primary-light text-white rounded-full shadow-2xl flex items-center justify-center transition-transform transform active:scale-95"
                    aria-label={subActions.length > 0 ? (isOpen ? 'Fermer le menu' : 'Ouvrir le menu') : mainAction.label}
                    aria-haspopup={subActions.length > 0}
                    aria-expanded={isOpen}
                >
                    <PlusIcon className={`w-8 h-8 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                </button>
            </div>
        </div>
    );
};