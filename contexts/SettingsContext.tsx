import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language } from '../types';

export interface NotificationSettings {
    reminder7: boolean;
    reminder2: boolean;
    confirmation: boolean;
    thanks: boolean;
    email: boolean;
    push: boolean;
    notificationTime: string; // 'HH:mm'
    quietHours: {
        enabled: boolean;
        start: string; // 'HH:mm'
        end: string;   // 'HH:mm'
    };
}

export interface AdvancedSettings {
    offlineMode: boolean;
    debugMode: boolean;
    autoBackup: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    cacheSize: string;
}

export interface DashboardSettings {
    defaultPeriod: 'week' | 'month' | 'quarter' | 'year';
    defaultChart: 'bar' | 'line' | 'pie' | 'area';
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    exportFormat: 'pdf' | 'excel' | 'csv' | 'json';
}

export interface AISettings {
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    temperature: number;
    maxTokens: number;
    autoGenerate: boolean;
    smartSuggestions: boolean;
}

export interface InterfaceSettings {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    language: Language;
    animations: boolean;
    compactMode: boolean;
    notificationSettings: NotificationSettings;
    advancedSettings: AdvancedSettings;
    dashboardSettings: DashboardSettings;
    aiSettings: AISettings;
}

interface SettingsContextType {
    settings: InterfaceSettings;
    setTheme: (theme: InterfaceSettings['theme']) => void;
    setFontSize: (fontSize: InterfaceSettings['fontSize']) => void;
    setLanguage: (language: Language) => void;
    setAnimations: (enabled: boolean) => void;
    setCompactMode: (enabled: boolean) => void;
    setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
    setAdvancedSettings: (settings: Partial<AdvancedSettings>) => void;
    setDashboardSettings: (settings: Partial<DashboardSettings>) => void;
    setAISettings: (settings: Partial<AISettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<InterfaceSettings>({
        theme: 'auto',
        fontSize: 'medium',
        language: 'fr',
        animations: true,
        compactMode: false,
        notificationSettings: {
            reminder7: true,
            reminder2: true,
            confirmation: true,
            thanks: false,
            email: false,
            push: true,
            notificationTime: '09:00',
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
        },
        advancedSettings: {
            offlineMode: false,
            debugMode: false,
            autoBackup: true,
            logLevel: 'info',
            cacheSize: '100MB',
        },
        dashboardSettings: {
            defaultPeriod: 'month',
            defaultChart: 'bar',
            autoRefresh: true,
            refreshInterval: 300,
            exportFormat: 'pdf',
        },
        aiSettings: {
            model: 'gemini-2.5-flash',
            temperature: 0.7,
            maxTokens: 1000,
            autoGenerate: false,
            smartSuggestions: true,
        },
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('interfaceSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings(currentSettings => ({...currentSettings, ...parsedSettings}));
            }
        } catch (error) {
            console.error("Failed to parse interface settings from localStorage", error);
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('interfaceSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);

    // Apply theme
    useEffect(() => {
        const root = window.document.documentElement;
        const body = window.document.body;
        const isDark =
            settings.theme === 'dark' ||
            (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        console.log('Theme change:', settings.theme, 'isDark:', isDark);
        
        // Appliquer sur html et body
        root.classList.toggle('dark', isDark);
        body.classList.toggle('dark', isDark);
        
        // Forcer les styles de base
        if (isDark) {
            root.style.setProperty('background-color', '#0f172a', 'important');
            root.style.setProperty('color', '#e2e8f0', 'important');
            body.style.setProperty('background-color', '#0f172a', 'important');
            body.style.setProperty('color', '#e2e8f0', 'important');
        } else {
            root.style.setProperty('background-color', '#f1f5f9', 'important');
            root.style.setProperty('color', '#1e293b', 'important');
            body.style.setProperty('background-color', '#f1f5f9', 'important');
            body.style.setProperty('color', '#1e293b', 'important');
        }
    }, [settings.theme]);

    // Apply font size
    useEffect(() => {
        const root = window.document.documentElement;
        if (settings.fontSize === 'small') {
            root.style.fontSize = '90%';
        } else if (settings.fontSize === 'large') {
            root.style.fontSize = '110%';
        } else {
            root.style.fontSize = '100%';
        }
    }, [settings.fontSize]);

    // Apply animation setting
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('animations-disabled', !settings.animations);
    }, [settings.animations]);

    // Apply compact mode setting
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('compact-mode', settings.compactMode);
    }, [settings.compactMode]);

    // Observe debug mode setting
    useEffect(() => {
        if (settings.advancedSettings.debugMode) {
            console.log("Debug Mode is ON.");
        } else {
            console.log("Debug Mode is OFF.");
        }
    }, [settings.advancedSettings.debugMode]);

    const setTheme = useCallback((theme: InterfaceSettings['theme']) => {
        setSettings(s => ({ ...s, theme }));
    }, []);

    const setFontSize = useCallback((fontSize: InterfaceSettings['fontSize']) => {
        setSettings(s => ({ ...s, fontSize }));
    }, []);

    const setLanguage = useCallback((language: Language) => {
        setSettings(s => ({ ...s, language }));
    }, []);

    const setAnimations = useCallback((enabled: boolean) => {
        setSettings(s => ({ ...s, animations: enabled }));
    }, []);

    const setCompactMode = useCallback((enabled: boolean) => {
        setSettings(s => ({ ...s, compactMode: enabled }));
    }, []);
    
    const setNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
        setSettings(s => ({
            ...s,
            notificationSettings: {
                ...s.notificationSettings,
                ...newSettings,
            },
        }));
    }, []);

    const setAdvancedSettings = useCallback((newSettings: Partial<AdvancedSettings>) => {
        setSettings(s => ({
            ...s,
            advancedSettings: {
                ...s.advancedSettings,
                ...newSettings,
            },
        }));
    }, []);

    const setDashboardSettings = useCallback((newSettings: Partial<DashboardSettings>) => {
        setSettings(s => ({
            ...s,
            dashboardSettings: {
                ...s.dashboardSettings,
                ...newSettings,
            },
        }));
    }, []);

    const setAISettings = useCallback((newSettings: Partial<AISettings>) => {
        setSettings(s => ({
            ...s,
            aiSettings: {
                ...s.aiSettings,
                ...newSettings,
            },
        }));
    }, []);

    const value = useMemo(() => ({
        settings,
        setTheme,
        setFontSize,
        setLanguage,
        setAnimations,
        setCompactMode,
        setNotificationSettings,
        setAdvancedSettings,
        setDashboardSettings,
        setAISettings,
    }), [settings, setTheme, setFontSize, setLanguage, setAnimations, setCompactMode, setNotificationSettings, setAdvancedSettings, setDashboardSettings, setAISettings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};