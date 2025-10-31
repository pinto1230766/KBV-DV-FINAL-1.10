import React, { createContext, useContext, useMemo, useCallback, ReactNode, useState, useEffect } from 'react';
import { DataOptimizations } from '../utils/performance-optimizations';
import { generateUUID } from '../utils/uuid';
import { Speaker, Visit, Host, CustomMessageTemplates, CustomHostRequestTemplates, Language, MessageType, MessageRole, TalkHistory, CongregationProfile, PublicTalk, Feedback, SavedView, ActiveFilters, SpecialDate } from '../types';
import { initialSpeakers, initialHosts, UNASSIGNED_HOST, NO_HOST_NEEDED, initialVisits, initialPublicTalks, initialSpecialDates } from '../constants';
import { useToast } from './ToastContext';
import { encrypt, decrypt } from '../utils/crypto';
import { EncryptionPrompt } from '../components/EncryptionPrompt';
import { SpinnerIcon } from '../components/Icons';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { get, set, del } from '../utils/idb';
import useLocalStorage from '../hooks/useLocalStorage';
import { checkStorageWarning, formatSize } from '../utils/storage';
import { scheduleVisitNotifications, cancelVisitNotifications } from '../utils/notifications-enhanced';
import { backupManager } from '../utils/backup';
import { analytics, trackVisitCreated, trackFeatureUsed } from '../utils/analytics';
import { logger } from '../utils/logger';
import { validateData, VisitSchema, SpeakerSchema, HostSchema } from '../utils/validation';
import { escapeHtml, sanitizeInput } from '../utils/security';
import { safeDelete, updateArrayItem } from '../utils/arrayUtils';

interface AppData {
  speakers: Speaker[];
  visits: Visit[];
  hosts: Host[];
  archivedVisits: Visit[];
  customTemplates: CustomMessageTemplates;
  customHostRequestTemplates: CustomHostRequestTemplates;
  congregationProfile: CongregationProfile;
  publicTalks: PublicTalk[];
  savedViews: SavedView[];
  specialDates: SpecialDate[];
}

const initialData: AppData = {
    speakers: initialSpeakers,
    visits: initialVisits,
    hosts: initialHosts,
    archivedVisits: [],
    customTemplates: {},
    customHostRequestTemplates: {},
    congregationProfile: {
        name: "KBV DV LYON .FP",
        subtitle: "Gestion des Orateurs Visiteurs",
        defaultTime: "14:30",
        hospitalityOverseer: "Pinto Francisco",
        hospitalityOverseerPhone: "+33777388914",
        backupPhoneNumber: "",
        latitude: null,
        longitude: null,
    },
    publicTalks: initialPublicTalks,
    savedViews: [],
    specialDates: initialSpecialDates,
};

interface DataContextType {
  appData: AppData | null;
  isEncrypted: boolean;
  isOnline: boolean;
  
  upcomingVisits: Visit[];
  pastUnarchivedVisits: Visit[];
  allSpeakerTags: string[];
  allHostTags: string[];
  
  logoUrl: string;
  updateLogo: (newUrl: string | null) => void;

  customTemplates: CustomMessageTemplates;
  customHostRequestTemplates: CustomHostRequestTemplates;

  addSpeaker: (speakerData: Speaker) => void;
  updateSpeaker: (speakerData: Speaker) => void;
  deleteSpeaker: (speakerId: string) => void;
  addVisit: (visitData: Visit) => Promise<void>;
  updateVisit: (visitData: Visit) => Promise<void>;
  deleteVisit: (visitId: string) => Promise<void>;
  completeVisit: (visit: Visit) => void;
  addFeedbackToVisit: (visitId: string, feedback: Feedback) => void;
  deleteArchivedVisit: (visitId: string) => void;
  removeDuplicateArchivedVisits: () => void;
  addHost: (hostData: Host) => boolean;
  updateHost: (hostName: string, updatedData: Partial<Host>) => void;
  deleteHost: (hostName: string) => void;
  saveCustomTemplate: (language: Language, messageType: MessageType, role: MessageRole, text: string) => void;
  deleteCustomTemplate: (language: Language, messageType: MessageType, role: MessageRole) => void;
  saveCustomHostRequestTemplate: (language: Language, text: string) => void;
  deleteCustomHostRequestTemplate: (language: Language) => void;
  logCommunication: (visitId: string, messageType: MessageType, role: MessageRole) => void;
  updateCongregationProfile: (profile: CongregationProfile) => void;
  
  addTalk: (talkData: PublicTalk) => void;
  updateTalk: (talkNumber: string | number, updatedData: PublicTalk) => void;
  deleteTalk: (talkNumber: string | number) => void;
  updatePublicTalksList: (talksList: string) => void;

  saveFilterView: (view: SavedView) => void;
  deleteFilterView: (viewId: string) => void;
  
  exportData: () => void;
  importData: (data: any) => Promise<void>;
  resetData: () => void;
  
  enableEncryption: (password: string) => Promise<boolean>;
  disableEncryption: (password: string) => Promise<boolean>;

  syncWithGoogleSheet: () => Promise<void>;
  apiKey: string;
  updateApiKey: (key: string) => void;
  googleSheetId: string;
  updateGoogleSheetId: (id: string) => void;
  sheetTabs: Array<{ name: string; gid: string }>;
  addSheetTab: (name: string, gid: string) => void;
  removeSheetTab: (gid: string) => void;

  mergeSpeakers: (primarySpeakerId: string, duplicateIds: string[]) => void;
  mergeHosts: (primaryHostName: string, duplicateNames: string[]) => void;
  
  addSpecialDate: (dateData: SpecialDate) => void;
  updateSpecialDate: (dateData: SpecialDate) => void;
  deleteSpecialDate: (dateId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }): React.JSX.Element => {
    const { addToast } = useToast();
    const isOnline = useOnlineStatus();

    const [appData, setAppData] = useState<AppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [sessionPassword, setSessionPassword] = useState<string | null>(null);
    const [storedApiKey, setStoredApiKey] = useLocalStorage<string>('gemini-api-key', '');
    const apiKey = useMemo(() => (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : storedApiKey, [storedApiKey]);

    const [storedGoogleSheetId, setStoredGoogleSheetId] = useLocalStorage<string>('google-sheet-id', '1drIzPPi6AohCroSyUkF1UmMFxuEtMACBF4XATDjBOcg');
    const googleSheetId = useMemo(() => (typeof process !== 'undefined' && process.env?.GOOGLE_SHEET_ID) ? process.env.GOOGLE_SHEET_ID : storedGoogleSheetId, [storedGoogleSheetId]);
    
    const [sheetTabs, setSheetTabs] = useLocalStorage<Array<{ name: string; gid: string }>>('google-sheet-tabs', [
        { name: 'MAIU 2026', gid: '1817293373' },
        { name: 'JUNHU 2026', gid: '1474640023' },
    ]);

    const updateApiKey = (key: string) => {
        setStoredApiKey(key);
        addToast("Clé API enregistrée.", 'success');
    };

    const updateGoogleSheetId = (id: string) => {
        setStoredGoogleSheetId(id);
        addToast("ID Google Sheet enregistré.", 'success');
    };
    
    const addSheetTab = (name: string, gid: string) => {
        if (sheetTabs.some(t => t.gid === gid)) {
            addToast("Cet onglet existe déjà.", 'warning');
            return;
        }
        setSheetTabs([...sheetTabs, { name, gid }]);
        addToast("Onglet ajouté.", 'success');
    };
    
    const removeSheetTab = (gid: string) => {
        setSheetTabs(sheetTabs.filter(t => t.gid !== gid));
        addToast("Onglet supprimé.", 'success');
    };

    const defaultLogo = useMemo(() => {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23b91c1c'/><text x='50' y='48' dominant-baseline='middle' text-anchor='middle' font-family='Montserrat, sans-serif' font-size='35' font-weight='bold' fill='white'>KBV</text><text x='50' y='70' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-size='15' font-weight='bold' fill='white'>DV LYON</text></svg>`;
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }, []);

    const [logoUrl, setLogoUrl] = useState<string>(() => {
        return localStorage.getItem('customAppLogo') || defaultLogo;
    });

    const updateLogo = useCallback((newUrl: string | null) => {
        const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
        const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;

        if (newUrl) {
            try {
                const url = new URL(newUrl);
                if (!['data:', 'https:'].includes(url.protocol)) {
                    addToast("URL non autorisée. Utilisez une URL HTTPS ou data:.", 'error');
                    return;
                }
                if (newUrl.length > 100000) {
                    addToast("URL trop longue.", 'error');
                    return;
                }
            } catch {
                addToast("URL invalide.", 'error');
                return;
            }
            
            localStorage.setItem('customAppLogo', newUrl);
            setLogoUrl(newUrl);
            if (favicon) favicon.href = newUrl;
            if (appleTouchIcon) appleTouchIcon.href = newUrl;
            addToast("Nouveau logo appliqué.", 'success');
        } else {
            localStorage.removeItem('customAppLogo');
            setLogoUrl(defaultLogo);
            if (favicon) favicon.href = defaultLogo;
            if (appleTouchIcon) appleTouchIcon.href = defaultLogo;
            addToast("Logo par défaut restauré.", 'info');
        }
    }, [defaultLogo, addToast]);

    useEffect(() => {
        const loadAndMigrateData = async () => {
            const lsEncryptedFlag = localStorage.getItem('dataIsEncrypted') === 'true';
            const lsEncryptedData = localStorage.getItem('encryptedAppData');
            const lsAppData = localStorage.getItem('appData');

            if (lsEncryptedFlag && lsEncryptedData) {
                await set('dataIsEncrypted', true);
                await set('encryptedAppData', lsEncryptedData);
                localStorage.removeItem('dataIsEncrypted');
                localStorage.removeItem('encryptedAppData');
                localStorage.removeItem('appData');
                addToast("Stockage mis à jour pour une meilleure performance.", "info");
            } else if (lsAppData) {
                try {
                    const data = JSON.parse(lsAppData);
                    await set('appData', data);
                    localStorage.removeItem('appData');
                    localStorage.removeItem('encryptedAppData');
                    localStorage.removeItem('dataIsEncrypted');
                    addToast("Stockage mis à jour pour une meilleure performance.", "info");
                } catch (e) { console.error("Could not parse old localStorage data.", e); }
            }

            const encryptedFlag = await get<boolean>('dataIsEncrypted');
            setIsEncrypted(!!encryptedFlag);

            if (encryptedFlag) {
                setIsLocked(true);
            } else {
                try {
                    const dataFromDb = await get<AppData>('appData');
                    setAppData(dataFromDb || initialData);
                } catch (error) {
                    console.error("Error loading plaintext data:", error);
                    addToast("Erreur de chargement des données.", "error");
                    setAppData(initialData);
                }
            }
            setIsLoading(false);
        };
        loadAndMigrateData();
    }, [addToast]);

    const updateAppData = useCallback((updater: (prev: AppData) => AppData) => {
        setAppData(prev => {
            if (!prev) return initialData;
            return updater(prev);
        });
    }, []);

    const upcomingVisits = useMemo(() => {
        if (!appData) return [];
        return DataOptimizations.getUpcomingVisits(appData.visits);
    }, [appData?.visits]);
    
    const pastUnarchivedVisits = useMemo(() => {
        if (!appData) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        return [...appData.visits]
            .filter(v => {
                const visitDate = new Date(v.visitDate + 'T00:00:00');
                return visitDate < today && visitDate >= ninetyDaysAgo;
            })
            .sort((a, b) => new Date(b.visitDate + 'T00:00:00').getTime() - new Date(a.visitDate + 'T00:00:00').getTime());
    }, [appData?.visits]);

    const allSpeakerTags = useMemo(() => {
        if (!appData) return [];
        return DataOptimizations.getAllTags(appData.speakers);
    }, [appData?.speakers]);

    const allHostTags = useMemo(() => {
        if (!appData) return [];
        return DataOptimizations.getAllTags(appData.hosts);
    }, [appData?.hosts]);

    // Placeholder functions - implement as needed
    const addSpeaker = useCallback((speakerData: Speaker) => {}, []);
    const updateSpeaker = useCallback((speakerData: Speaker) => {}, []);
    const deleteSpeaker = useCallback((speakerId: string) => {}, []);
    const addVisit = useCallback(async (visitData: Visit) => {}, []);
    const updateVisit = useCallback(async (visitData: Visit) => {}, []);
    const deleteVisit = useCallback(async (visitId: string) => {}, []);
    const completeVisit = useCallback((visit: Visit) => {}, []);
    const addFeedbackToVisit = useCallback((visitId: string, feedback: Feedback) => {}, []);
    const deleteArchivedVisit = useCallback((visitId: string) => {}, []);
    const removeDuplicateArchivedVisits = useCallback(() => {}, []);
    const addHost = useCallback((hostData: Host): boolean => false, []);
    const updateHost = useCallback((hostName: string, updatedData: Partial<Host>) => {}, []);
    const deleteHost = useCallback((hostName: string) => {}, []);
    const saveCustomTemplate = useCallback((language: Language, messageType: MessageType, role: MessageRole, text: string) => {}, []);
    const deleteCustomTemplate = useCallback((language: Language, messageType: MessageType, role: MessageRole) => {}, []);
    const saveCustomHostRequestTemplate = useCallback((language: Language, text: string) => {}, []);
    const deleteCustomHostRequestTemplate = useCallback((language: Language) => {}, []);
    const logCommunication = useCallback((visitId: string, messageType: MessageType, role: MessageRole) => {}, []);
    const updateCongregationProfile = useCallback((profile: CongregationProfile) => {
        updateAppData(prev => ({ ...prev, congregationProfile: profile }));
        addToast("Profil de la congrégation mis à jour.", 'success');
    }, [updateAppData, addToast]);
    const addTalk = useCallback((talkData: PublicTalk) => {}, []);
    const updateTalk = useCallback((talkNumber: string | number, updatedData: PublicTalk) => {}, []);
    const deleteTalk = useCallback((talkNumber: string | number) => {}, []);
    const updatePublicTalksList = useCallback((talksList: string) => {}, []);
    const saveFilterView = useCallback((view: SavedView) => {}, []);
    const deleteFilterView = useCallback((viewId: string) => {}, []);
    const exportData = useCallback(() => {}, []);
    const importData = useCallback(async (data: any) => {}, []);
    const resetData = useCallback(() => {}, []);
    const enableEncryption = useCallback(async (password: string): Promise<boolean> => false, []);
    const disableEncryption = useCallback(async (password: string): Promise<boolean> => false, []);
    const syncWithGoogleSheet = useCallback(async () => {}, []);
    const mergeSpeakers = useCallback((primarySpeakerId: string, duplicateIds: string[]) => {}, []);
    const mergeHosts = useCallback((primaryHostName: string, duplicateNames: string[]) => {}, []);
    const addSpecialDate = useCallback((dateData: SpecialDate) => {}, []);
    const updateSpecialDate = useCallback((dateData: SpecialDate) => {}, []);
    const deleteSpecialDate = useCallback((dateId: string) => {}, []);

    const value: DataContextType = {
        appData,
        isEncrypted,
        isOnline,
        upcomingVisits,
        pastUnarchivedVisits,
        allSpeakerTags,
        allHostTags,
        logoUrl,
        updateLogo,
        customTemplates: appData?.customTemplates || {},
        customHostRequestTemplates: appData?.customHostRequestTemplates || {},
        addSpeaker, updateSpeaker, deleteSpeaker,
        addVisit, updateVisit, deleteVisit, completeVisit, addFeedbackToVisit, deleteArchivedVisit, removeDuplicateArchivedVisits,
        addHost, updateHost, deleteHost,
        saveCustomTemplate, deleteCustomTemplate, saveCustomHostRequestTemplate, deleteCustomHostRequestTemplate,
        logCommunication, exportData, importData, resetData,
        enableEncryption, disableEncryption,
        updateCongregationProfile,
        syncWithGoogleSheet,
        addTalk, updateTalk, deleteTalk, updatePublicTalksList,
        saveFilterView, deleteFilterView,
        apiKey,
        updateApiKey,
        googleSheetId,
        updateGoogleSheetId,
        sheetTabs,
        addSheetTab,
        removeSheetTab,
        mergeSpeakers,
        mergeHosts,
        addSpecialDate, updateSpecialDate, deleteSpecialDate,
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
                <SpinnerIcon className="w-12 h-12 text-primary" />
            </div>
        );
    }

    if (isLocked) {
        return <EncryptionPrompt mode="unlock" onUnlock={async () => false} />;
    }

    if (!appData) {
        return (
            <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
                <p>Erreur critique lors du chargement des données.</p>
            </div>
        );
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};