import React, { useEffect, useRef } from 'react';

export interface ContextMenuAction {
    label: string;
    icon: React.FC<{ className?: string }>;
    onClick: () => void;
    isDestructive?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    actions: ContextMenuAction[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-card-light dark:bg-card-dark rounded-md shadow-2xl border border-border-light dark:border-border-dark animate-fade-in"
            style={{ top: `${y}px`, left: `${x}px` }}
        >
            <div className="py-1">
                {actions.map((action, index) => (
                    <button
                        key={action.label}
                        onClick={() => {
                            action.onClick();
                            onClose();
                        }}
                        className={`w-full text-left flex items-center px-4 py-2 text-sm ${
                            action.isDestructive
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-text-main dark:text-text-main-dark'
                        } hover:bg-gray-100 dark:hover:bg-primary-light/20`}
                    >
                        <action.icon className="w-4 h-4 mr-3" />
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
