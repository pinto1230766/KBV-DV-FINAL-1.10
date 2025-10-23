import React, { createContext, useContext, useMemo, useCallback, ReactNode, useState, useEffect } from 'react';
import { Speaker, Visit, Host, CustomMessageTemplates, CustomHostRequestTemplates, Language, MessageType, MessageRole, CongregationProfile, PublicTalk, Feedback, SavedView, SpecialDate } from '../types';
import { initialSpeakers, initialHosts, initialVisits, initialPublicTalks, initialSpecialDates } from '../constants';
import { useToast } from './ToastContext';
import { encrypt, decrypt } from '../utils/crypto';
import { EncryptionPrompt } from '../components/EncryptionPrompt';
import { SpinnerIcon } from '../components/Icons';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { get, set, del } from '../utils/idb';
import useLocalStorage from '../hooks/useLocalStorage';

// Interface pour les données d'importation
interface ImportData {
    speakers?: Speaker[];
    visits?: Visit[];
    hosts?: Host[];
    archivedVisits?: Visit[];
    customTemplates?: CustomMessageTemplates;
    customHostRequestTemplates?: CustomHostRequestTemplates;
    congregationProfile?: CongregationProfile;
    publicTalks?: PublicTalk[];
    savedViews?: SavedView[];
    specialDates?: SpecialDate[];
}

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


// Define the shape of the data and actions provided by the context.
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

  // Actions
  addSpeaker: (speakerData: Speaker) => void;
  updateSpeaker: (speakerData: Speaker) => void;
  deleteSpeaker: (speakerId: string) => void;
  addVisit: (visitData: Visit) => void;
  updateVisit: (visitData: Visit) => void;
  deleteVisit: (visitId: string) => void;
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
  importData: (data: ImportData) => Promise<void>;
  resetData: () => void;
  
  enableEncryption: (password: string) => Promise<boolean>;
  disableEncryption: () => Promise<boolean>;

  syncWithGoogleSheet: () => Promise<void>;
  apiKey: string;
  updateApiKey: (key: string) => void;

  mergeSpeakers: (primarySpeakerId: string, duplicateIds: string[]) => void;
  mergeHosts: (primaryHostName: string, duplicateNames: string[]) => void;
  
  addSpecialDate: (dateData: SpecialDate) => void;
  updateSpecialDate: (dateData: SpecialDate) => void;
  deleteSpecialDate: (dateId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const isOnline = useOnlineStatus();

    const [appData, setAppData] = useState<AppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [sessionPassword, setSessionPassword] = useState<string | null>(null);
    const [storedApiKey, setStoredApiKey] = useLocalStorage<string>('gemini-api-key', '');
    const apiKey = useMemo(() => (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : storedApiKey, [storedApiKey]);

    const updateApiKey = (key: string) => {
        setStoredApiKey(key);
        addToast("Clé API enregistrée.", 'success');
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

    const updateAppData = useCallback((updater: (prev: AppData) => AppData) => {
        setAppData(prev => prev ? updater(prev) : initialData);
    }, []);

    const upcomingVisits = useMemo(() => {
        if (!appData) return [];
        return appData.visits.filter(visit => new Date(visit.visitDate) > new Date() && visit.status !== 'completed');
    }, [appData]);

    const pastUnarchivedVisits = useMemo(() => {
        if (!appData) return [];
        return appData.visits.filter(visit => new Date(visit.visitDate) <= new Date() && visit.status !== 'completed');
    }, [appData]);

    const allSpeakerTags = useMemo(() => {
        if (!appData) return [];
        const tags = new Set<string>();
        appData.speakers.forEach(speaker => speaker.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [appData]);

    const allHostTags = useMemo(() => {
        if (!appData) return [];
        const tags = new Set<string>();
        appData.hosts.forEach(host => host.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [appData]);

    // Initial load effect
    useEffect(() => {
        const loadAndMigrateData = async () => {
            // --- One-time Migration from localStorage to IndexedDB ---
            const lsEncryptedFlag = localStorage.getItem('dataIsEncrypted') === 'true';
            const lsEncryptedData = localStorage.getItem('encryptedAppData');
            const lsAppData = localStorage.getItem('appData');

            if (lsEncryptedFlag && lsEncryptedData) {
                await set('dataIsEncrypted', true);
                await set('encryptedAppData', lsEncryptedData);
                localStorage.removeItem('dataIsEncrypted');
                localStorage.removeItem('encryptedAppData');
                localStorage.removeItem('appData'); // Clean up everything
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
            // --- End Migration ---

            // --- Regular Load from IndexedDB ---
            const encryptedFlag = await get<boolean>('dataIsEncrypted');
            setIsEncrypted(!!encryptedFlag);

            if (encryptedFlag) {
                setIsLocked(true);
            } else {
                try {
                    const dataFromDb = await get<AppData>('appData');
                    setAppData(dataFromDb || initialData);
                } catch (error: unknown) {
            console.error("Erreur lors du chargement des données:", error);
            addToast("Erreur lors du chargement des données.", "error");
                    setAppData(initialData);
                }
            }
            setIsLoading(false);
        };
        loadAndMigrateData();
    }, [addToast]);

    // Persist data on change effect
    useEffect(() => {
        if (!appData || isLoading) return;

        const saveData = async (dataToSave: AppData) => {
            try {
                if (isEncrypted && sessionPassword) {
                    const encryptedData = await encrypt(dataToSave, sessionPassword);
                    await set('encryptedAppData', encryptedData);
                    await del('appData');
                } else if (!isEncrypted) {
                    await set('appData', dataToSave);
                    await del('encryptedAppData');
                }
            } catch (error) {
                console.error("Error saving data to IndexedDB:", error);
                let userMessage = "Erreur critique de sauvegarde. Vos derniers changements pourraient ne pas être enregistrés.";
                if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'QUOTA_EXCEEDED_ERR')) {
                    userMessage = "Erreur de sauvegarde : le stockage de votre appareil est plein. Essayez de supprimer des photos ou des pièces jointes.";
                }
                addToast(userMessage, "error", 10000);
            }
        };

        saveData(appData);
    }, [appData, isEncrypted, sessionPassword, isLoading, addToast]);

    const unlock = async (password: string): Promise<boolean> => {
        const encryptedData = await get<string>('encryptedAppData');
        if (!encryptedData) {
            addToast("Aucune donnée chiffrée trouvée.", "error");
            return false;
        }
        try {
            const decryptedData = await decrypt<AppData>(encryptedData, password);
            setAppData(decryptedData);
            setSessionPassword(password);
            setIsLocked(false);
            addToast("Données déverrouillées.", "success");
            return true;
        } catch {
            addToast("Mot de passe incorrect.", "error");
            return false;
        }
    };
    
    const addSpecialDate = (dateData: SpecialDate) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: [...(prev.specialDates || []), dateData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
        addToast("Date spéciale ajoutée.", 'success');
    };

    const updateSpecialDate = (dateData: SpecialDate) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: (prev.specialDates || []).map(d => d.id === dateData.id ? dateData : d).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
        addToast("Date spéciale mise à jour.", 'success');
    };

    const deleteSpecialDate = (dateId: string) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: (prev.specialDates || []).filter(d => d.id !== dateId)
        }));
        addToast("Date spéciale supprimée.", 'success');
    };

    // Speaker actions
    const addSpeaker = useCallback((speakerData: Speaker) => {
        updateAppData(prev => ({
            ...prev,
            speakers: [...prev.speakers, speakerData]
        }));
        addToast("Orateur ajouté.", 'success');
    }, [updateAppData, addToast]);

    const updateSpeaker = useCallback((speakerData: Speaker) => {
        updateAppData(prev => ({
            ...prev,
            speakers: prev.speakers.map(speaker =>
                speaker.id === speakerData.id ? speakerData : speaker
            )
        }));
        addToast("Orateur mis à jour.", 'success');
    }, [updateAppData, addToast]);

    const deleteSpeaker = useCallback((speakerId: string) => {
        updateAppData(prev => ({
            ...prev,
            speakers: prev.speakers.filter(speaker => speaker.id !== speakerId)
        }));
        addToast("Orateur supprimé.", 'success');
    }, [updateAppData, addToast]);

    // Visit actions
    const addVisit = useCallback((visitData: Visit) => {
        updateAppData(prev => ({
            ...prev,
            visits: [...prev.visits, visitData]
        }));
        addToast("Visite ajoutée.", 'success');
    }, [updateAppData, addToast]);

    const updateVisit = useCallback((visitData: Visit) => {
        updateAppData(prev => ({
            ...prev,
            visits: prev.visits.map(visit =>
                visit.visitId === visitData.visitId ? visitData : visit
            )
        }));
        addToast("Visite mise à jour.", 'success');
    }, [updateAppData, addToast]);

    const deleteVisit = useCallback((visitId: string) => {
        updateAppData(prev => ({
            ...prev,
            visits: prev.visits.filter(visit => visit.visitId !== visitId)
        }));
        addToast("Visite supprimée.", 'success');
    }, [updateAppData, addToast]);

    const completeVisit = useCallback((visit: Visit) => {
        updateAppData(prev => ({
            ...prev,
            visits: prev.visits.map(v =>
                v.visitId === visit.visitId
                    ? { ...v, status: 'completed' as const }
                    : v
            ),
            archivedVisits: [...prev.archivedVisits, { ...visit, status: 'completed' as const }]
        }));
        addToast("Visite marquée comme terminée.", 'success');
    }, [updateAppData, addToast]);

    const addFeedbackToVisit = useCallback((visitId: string, feedback: Feedback) => {
        updateAppData(prev => ({
            ...prev,
            visits: prev.visits.map(visit =>
                visit.visitId === visitId
                    ? { ...visit, feedback }
                    : visit
            )
        }));
        addToast("Retour ajouté à la visite.", 'success');
    }, [updateAppData, addToast]);

    const deleteArchivedVisit = useCallback((visitId: string) => {
        updateAppData(prev => ({
            ...prev,
            archivedVisits: prev.archivedVisits.filter(visit => visit.visitId !== visitId)
        }));
        addToast("Visite archivée supprimée.", 'success');
    }, [updateAppData, addToast]);

    const removeDuplicateArchivedVisits = useCallback(() => {
        updateAppData(prev => {
            const uniqueVisits = prev.archivedVisits.filter((visit, index, self) =>
                index === self.findIndex(v => v.visitId === visit.visitId)
            );
            return {
                ...prev,
                archivedVisits: uniqueVisits
            };
        });
        addToast("Doublons supprimés des visites archivées.", 'success');
    }, [updateAppData, addToast]);

    // Host actions
    const addHost = useCallback((hostData: Host): boolean => {
        updateAppData(prev => {
            const exists = prev.hosts.some(host => host.nom === hostData.nom);
            if (exists) {
                addToast("Un hôte avec ce nom existe déjà.", 'warning');
                return prev;
            }
            return {
                ...prev,
                hosts: [...prev.hosts, hostData]
            };
        });
        addToast("Hôte ajouté.", 'success');
        return true;
    }, [updateAppData, addToast]);

    const updateHost = useCallback((hostName: string, updatedData: Partial<Host>) => {
        updateAppData(prev => ({
            ...prev,
            hosts: prev.hosts.map(host =>
                host.nom === hostName ? { ...host, ...updatedData } : host
            )
        }));
        addToast("Hôte mis à jour.", 'success');
    }, [updateAppData, addToast]);

    const deleteHost = useCallback((hostName: string) => {
        updateAppData(prev => ({
            ...prev,
            hosts: prev.hosts.filter(host => host.nom !== hostName)
        }));
        addToast("Hôte supprimé.", 'success');
    }, [updateAppData, addToast]);

    // Template actions
    const saveCustomTemplate = useCallback((language: Language, messageType: MessageType, role: MessageRole, text: string) => {
        updateAppData(prev => ({
            ...prev,
            customTemplates: {
                ...prev.customTemplates,
                [language]: {
                    ...prev.customTemplates[language],
                    [messageType]: {
                        ...prev.customTemplates[language]?.[messageType],
                        [role]: text
                    }
                }
            }
        }));
        addToast("Modèle personnalisé sauvegardé.", 'success');
    }, [updateAppData, addToast]);

    const deleteCustomTemplate = useCallback((language: Language, messageType: MessageType, role: MessageRole) => {
        updateAppData(prev => {
            const newTemplates = { ...prev.customTemplates };
            if (newTemplates[language]?.[messageType]) {
                delete newTemplates[language][messageType][role];
            }
            return {
                ...prev,
                customTemplates: newTemplates
            };
        });
        addToast("Modèle personnalisé supprimé.", 'success');
    }, [updateAppData, addToast]);

    const saveCustomHostRequestTemplate = useCallback((language: Language, text: string) => {
        updateAppData(prev => ({
            ...prev,
            customHostRequestTemplates: {
                ...prev.customHostRequestTemplates,
                [language]: text
            }
        }));
        addToast("Modèle de demande d'accueil sauvegardé.", 'success');
    }, [updateAppData, addToast]);

    const deleteCustomHostRequestTemplate = useCallback((language: Language) => {
        updateAppData(prev => {
            const newTemplates = { ...prev.customHostRequestTemplates };
            delete newTemplates[language];
            return {
                ...prev,
                customHostRequestTemplates: newTemplates
            };
        });
        addToast("Modèle de demande d'accueil supprimé.", 'success');
    }, [updateAppData, addToast]);

    // Communication and data actions
    const logCommunication = useCallback((visitId: string, messageType: MessageType, role: MessageRole) => {
        const now = new Date().toISOString();
        updateAppData(prev => ({
            ...prev,
            visits: prev.visits.map(visit =>
                visit.visitId === visitId
                    ? {
                        ...visit,
                        communicationStatus: {
                            ...visit.communicationStatus,
                            [messageType]: {
                                ...visit.communicationStatus?.[messageType],
                                [role]: now
                            }
                        }
                    }
                    : visit
            )
        }));
    }, [updateAppData]);

    const updateCongregationProfile = useCallback((profile: CongregationProfile) => {
        updateAppData(prev => ({
            ...prev,
            congregationProfile: profile
        }));
        addToast("Profil de congrégation mis à jour.", 'success');
    }, [updateAppData, addToast]);

    // Talk actions
    const addTalk = useCallback((talkData: PublicTalk) => {
        updateAppData(prev => ({
            ...prev,
            publicTalks: [...prev.publicTalks, talkData]
        }));
        addToast("Exposé ajouté.", 'success');
    }, [updateAppData, addToast]);

    const updateTalk = useCallback((talkNumber: string | number, updatedData: PublicTalk) => {
        updateAppData(prev => ({
            ...prev,
            publicTalks: prev.publicTalks.map(talk =>
                talk.number === talkNumber ? updatedData : talk
            )
        }));
        addToast("Exposé mis à jour.", 'success');
    }, [updateAppData, addToast]);

    const deleteTalk = useCallback((talkNumber: string | number) => {
        updateAppData(prev => ({
            ...prev,
            publicTalks: prev.publicTalks.filter(talk => talk.number !== talkNumber)
        }));
        addToast("Exposé supprimé.", 'success');
    }, [updateAppData, addToast]);

    const updatePublicTalksList = useCallback((talksList: string) => {
        try {
            const talks = JSON.parse(talksList);
            updateAppData(prev => ({
                ...prev,
                publicTalks: talks
            }));
            addToast("Liste d'exposés mise à jour.", 'success');
        } catch {
            addToast("Erreur lors de la mise à jour de la liste d'exposés.", 'error');
        }
    }, [updateAppData, addToast]);

    // Filter view actions
    const saveFilterView = useCallback((view: SavedView) => {
        updateAppData(prev => ({
            ...prev,
            savedViews: [...prev.savedViews, view]
        }));
        addToast("Vue de filtre sauvegardée.", 'success');
    }, [updateAppData, addToast]);

    const deleteFilterView = useCallback((viewId: string) => {
        updateAppData(prev => ({
            ...prev,
            savedViews: prev.savedViews.filter(view => view.id !== viewId)
        }));
        addToast("Vue de filtre supprimée.", 'success');
    }, [updateAppData, addToast]);

    // Data management actions
    const exportData = useCallback(() => {
        if (!appData) return;

        const dataToExport = {
            speakers: appData.speakers,
            visits: appData.visits,
            hosts: appData.hosts,
            archivedVisits: appData.archivedVisits,
            customTemplates: appData.customTemplates,
            customHostRequestTemplates: appData.customHostRequestTemplates,
            congregationProfile: appData.congregationProfile,
            publicTalks: appData.publicTalks,
            savedViews: appData.savedViews,
            specialDates: appData.specialDates,
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `kbv-dv-lyon-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addToast("Données exportées avec succès.", 'success');
    }, [appData, addToast]);

    const importData = useCallback(async (data: ImportData) => {
        try {
            updateAppData(prev => ({
                ...prev,
                ...data
            }));
            addToast("Données importées avec succès.", 'success');
        } catch {
            addToast("Erreur lors de l'importation des données.", 'error');
        }
    }, [updateAppData, addToast]);

    const resetData = useCallback(() => {
        setAppData(initialData);
        addToast("Données réinitialisées.", 'info');
    }, [addToast]);

    // Encryption actions
    const enableEncryption = useCallback(async (password: string): Promise<boolean> => {
        if (!appData) return false;

        try {
            const encryptedData = await encrypt(appData, password);
            await set('encryptedAppData', encryptedData);
            await set('dataIsEncrypted', true);
            await del('appData');
            setIsEncrypted(true);
            setSessionPassword(password);
            addToast("Chiffrement activé.", 'success');
            return true;
        } catch {
            addToast("Erreur lors de l'activation du chiffrement.", 'error');
            return false;
        }
    }, [appData, addToast]);

    const disableEncryption = useCallback(async (): Promise<boolean> => {
        if (!appData) return false;

        try {
            await set('appData', appData);
            await del('encryptedAppData');
            await set('dataIsEncrypted', false);
            setIsEncrypted(false);
            setSessionPassword(null);
            addToast("Chiffrement désactivé.", 'success');
            return true;
        } catch {
            addToast("Erreur lors de la désactivation du chiffrement.", 'error');
            return false;
        }
    }, [appData, addToast]);

    // Sync action
    const syncWithGoogleSheet = useCallback(async () => {
        addToast("Synchronisation avec Google Sheets non implémentée.", 'info');
    }, [addToast]);

    // Merge actions
    const mergeSpeakers = useCallback((primarySpeakerId: string, duplicateIds: string[]) => {
        updateAppData(prev => {
            const primarySpeaker = prev.speakers.find(s => s.id === primarySpeakerId);
            const duplicates = prev.speakers.filter(s => duplicateIds.includes(s.id));

            if (!primarySpeaker) return prev;

            const mergedSpeaker: Speaker = {
                ...primarySpeaker,
                talkHistory: [
                    ...primarySpeaker.talkHistory,
                    ...duplicates.flatMap(d => d.talkHistory)
                ]
            };

            return {
                ...prev,
                speakers: prev.speakers
                    .filter(s => s.id !== primarySpeakerId && !duplicateIds.includes(s.id))
                    .concat(mergedSpeaker)
            };
        });
        addToast("Orateurs fusionnés avec succès.", 'success');
    }, [updateAppData, addToast]);

    const mergeHosts = useCallback((primaryHostName: string, duplicateNames: string[]) => {
        updateAppData(prev => {
            const primaryHost = prev.hosts.find(h => h.nom === primaryHostName);
            const duplicates = prev.hosts.filter(h => duplicateNames.includes(h.nom));

            if (!primaryHost) return prev;

            const mergedHost: Host = {
                ...primaryHost,
                unavailabilities: [
                    ...(primaryHost.unavailabilities || []),
                    ...duplicates.flatMap(d => d.unavailabilities || [])
                ]
            };

            return {
                ...prev,
                hosts: prev.hosts
                    .filter(h => h.nom !== primaryHostName && !duplicateNames.includes(h.nom))
                    .concat(mergedHost)
            };
        });
        addToast("Hôtes fusionnés avec succès.", 'success');
    }, [updateAppData, addToast]);
    
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
        return <EncryptionPrompt mode="unlock" onUnlock={unlock} />;
    }

    if (!appData) {
        // This case should ideally not be hit if logic is correct, but it's a safe fallback.
        return (
            <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
                <p>Erreur critique lors du chargement des données.</p>
            </div>
        );
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    if (context.appData === null) throw new Error('useData cannot be used before data is loaded/unlocked');

    // Create stable references for derived data using the appData object
    const { speakers, visits, hosts, archivedVisits, customTemplates, customHostRequestTemplates, congregationProfile, publicTalks, savedViews, specialDates } = context.appData;

    return {
        ...context,
        speakers,
        visits,
        hosts,
        archivedVisits,
        customTemplates,
        customHostRequestTemplates,
        congregationProfile,
        publicTalks,
        savedViews,
        specialDates,
    };
};