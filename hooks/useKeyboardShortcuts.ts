import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Raccourcis prédéfinis pour l'application
export const getAppShortcuts = (actions: {
  openSearch: () => void;
  addSpeaker: () => void;
  addHost: () => void;
  scheduleVisit: () => void;
  toggleTheme: () => void;
}) => [
  {
    key: 'k',
    ctrl: true,
    action: actions.openSearch,
    description: 'Ouvrir la recherche'
  },
  {
    key: 's',
    ctrl: true,
    shift: true,
    action: actions.addSpeaker,
    description: 'Ajouter un orateur'
  },
  {
    key: 'h',
    ctrl: true,
    shift: true,
    action: actions.addHost,
    description: 'Ajouter un contact'
  },
  {
    key: 'n',
    ctrl: true,
    action: actions.scheduleVisit,
    description: 'Programmer une visite'
  },
  {
    key: 'd',
    ctrl: true,
    action: actions.toggleTheme,
    description: 'Basculer le thème'
  }
];