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
            // Validation de sécurité pour prévenir XSS
            try {
                const url = new URL(newUrl);
                // Autoriser seulement data: URLs et HTTPS
                if (!['data:', 'https:'].includes(url.protocol)) {
                    addToast("URL non autorisée. Utilisez une URL HTTPS ou data:.", 'error');
                    return;
                }
                // Limiter la taille pour éviter les attaques DoS
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
        try {
            setAppData(prev => {
                if (!prev) return initialData;
                
                // Créer une copie profonde pour éviter les effets de bord
                const prevCopy = JSON.parse(JSON.stringify(prev));
                let newData;
                
                try {
                    newData = updater(prevCopy);
                } catch (error) {
                    console.error('Erreur lors de la mise à jour des données:', error);
                    logger.error('Erreur de mise à jour des données', error);
                    return prevCopy; // Retourner l'ancien état en cas d'erreur
                }

                // Validation des données avant la mise à jour
                const validation = validateData(AppDataSchema, newData);
                if (!validation.success) {
                    const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
                    logger.error('Données invalides après mise à jour', { errors });
                    return prevCopy; // Ne pas mettre à jour si les données ne sont pas valides
                }

                return newData;
            });
        } catch (error) {
            console.error('Erreur critique dans updateAppData:', error);
            logger.error('Erreur critique dans updateAppData', error);
            // Ne pas propager l'erreur pour éviter de casser l'application
        }
    };

    // Persist data on change effect
    useEffect(() => {
        if (!appData || isLoading) return;

        const saveData = async (dataToSave: AppData) => {
            // Vérifier la taille avant de sauvegarder
            const dataSize = JSON.stringify(dataToSave).length;
            const { warning, message } = checkStorageWarning(dataSize);
            
            if (warning && message) {
                addToast(message, 'warning', 8000);
            }

            try {
                if (isEncrypted && sessionPassword) {
                    const dataString = JSON.stringify(dataToSave);
                    const encryptedData = await encrypt(dataString, sessionPassword);
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
        
        // Backup automatique quotidien
        backupManager.scheduleAutoBackup(appData);
    }, [appData, isEncrypted, sessionPassword, isLoading, addToast]);

    const unlock = async (password: string): Promise<boolean> => {
        const encryptedData = await get<string>('encryptedAppData');
        if (!encryptedData) {
            addToast("Aucune donnée chiffrée trouvée.", "error");
            return false;
        }
        try {
            const decryptedString = await decrypt(encryptedData, password);
            const decryptedData = JSON.parse(decryptedString) as AppData;
            setAppData(decryptedData);
            setSessionPassword(password);
            setIsLocked(false);
            addToast("Données déverrouillées.", "success");
            return true;
        } catch (error) {
            addToast("Mot de passe incorrect.", "error");
            return false;
        }
    };
    
    const enableEncryption = async (password: string): Promise<boolean> => {
        if (!appData) {
            addToast("Les données ne sont pas prêtes.", "error");
            return false;
        }
        try {
            const dataString = JSON.stringify(appData);
            const encryptedData = await encrypt(dataString, password);
            await set('encryptedAppData', encryptedData);
            await set('dataIsEncrypted', true);
            await del('appData');
            localStorage.clear(); // Clear all old localStorage data
            setIsEncrypted(true);
            setSessionPassword(password);
            addToast("Chiffrement activé avec succès.", "success");
            return true;
        } catch (error) {
            addToast("L'activation du chiffrement a échoué.", "error");
            return false;
        }
    };

    const disableEncryption = async (password: string): Promise<boolean> => {
        if (!appData) {
             addToast("Les données ne sont pas prêtes.", "error");
             return false;
        }
        try {
            const encryptedData = await get<string>('encryptedAppData');
            if (!encryptedData) throw new Error("No encrypted data found to decrypt.");
            await decrypt(encryptedData, password);

            await set('appData', appData);
            await del('encryptedAppData');
            await del('dataIsEncrypted');
            setIsEncrypted(false);
            setSessionPassword(null);
            addToast("Chiffrement désactivé.", "success");
            return true;
        } catch (error) {
             addToast("Mot de passe incorrect. Le chiffrement ne peut pas être désactivé.", "error");
            return false;
        }
    };

    // Derived state, memoized for performance.
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
    
const allSpeakerTags = useMemo(() => {
    if (!appData) return [];
    return DataOptimizations.getAllTags(appData.speakers);
        
    // Validation des données requises
    if (!cleanedData.nom || !cleanedData.prenom) {
        throw new Error('Le nom et le prénom sont obligatoires');
const updateSpeaker = (speakerData: Speaker) => {
    // Validation des données
    const validation = validateData(SpeakerSchema, speakerData);
    if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
        logger.error('Données orateur invalides lors de la mise à jour', undefined, { errors: errors.map(e => String(e).replace(/[\r\n]/g, ' ')) });
        addToast('Données invalides: ' + errors.join(', '), 'error');
        return;
    }

    const validatedSpeaker = { ...validation.data, talkHistory: validation.data.talkHistory || [] } as Speaker;
    updateAppData(prev => ({
        ...prev,
        speakers: prev.speakers.map(s => s.id === speakerData.id ? validatedSpeaker : s).sort((a, b) => a.nom.localeCompare(b.nom)),
        visits: prev.visits.map(v => v.id === speakerData.id ? { ...v, nom: validatedSpeaker.nom, congregation: validatedSpeaker.congregation, telephone: validatedSpeaker.telephone, photoUrl: validatedSpeaker.photoUrl } : v)
    }));
    
    analytics.track('speaker_updated', { congregation: speakerData.congregation });
    addToast("Orateur mis à jour.", 'success');
};

const deleteSpeaker = (speakerId: string) => {
    const speakerToDelete = appData?.speakers.find(s => s.id === speakerId);
    if (!speakerToDelete) return;
    
    updateAppData(prev => ({
        ...prev,
        speakers: prev.speakers.filter(s => s.id !== speakerId),
        visits: prev.visits.filter(v => v.id !== speakerId)
    }));
    
    analytics.track('speaker_deleted', { congregation: speakerToDelete.congregation });
    logger.info('Orateur supprimé', { speakerId: String(speakerId).replace(/[\r\n]/g, ' '), speakerName: String(speakerToDelete.nom).replace(/[\r\n]/g, ' ') });
    addToast(`"${speakerToDelete.nom}" et ses visites associées ont été supprimés.`, 'success');
};

const addVisit = async (visitData: Visit) => {
    // Validation des données
    const validation = validateData(VisitSchema, visitData);
    if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
        logger.error('Données visite invalides', undefined, { errors: errors.map(e => String(e).replace(/[\r\n]/g, ' ')) });
        addToast('Données invalides: ' + errors.join(', '), 'error');
        return;
    }

    const visitWithStatus = { ...validation.data, communicationStatus: {} } as Visit;
    updateAppData(prev => ({ ...prev, visits: [...prev.visits, visitWithStatus] }));
    await scheduleVisitNotifications(visitWithStatus);
    
    trackVisitCreated(visitWithStatus.locationType || 'physical');
    addToast("Visite programmée avec succès.", 'success');
};
    
const updateVisit = async (visitData: Visit) => {
    // Validation des données
    const validation = validateData(VisitSchema, visitData);
    if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
        logger.error('Données visite invalides lors de la mise à jour', undefined, { errors: errors.map(e => String(e).replace(/[\r\n]/g, ' ')) });
        addToast('Données invalides: ' + errors.join(', '), 'error');
        return;
    }

    const validatedVisit = validation.data as Visit;
    updateAppData(prev => ({ ...prev, visits: prev.visits.map(v => v.visitId === validatedVisit.visitId ? validatedVisit : v) }));
    await cancelVisitNotifications(validatedVisit.visitId);
    await scheduleVisitNotifications(validatedVisit);
    
    analytics.track('visit_updated', { locationType: validatedVisit.locationType });
    addToast("Visite mise à jour avec succès.", 'success');
};
    
const deleteVisit = async (visitId: string) => {
    const visitToDelete = appData?.visits.find(v => v.visitId === visitId);
    
    updateAppData(prev => ({ ...prev, visits: prev.visits.filter(v => v.visitId !== visitId) }));
    await cancelVisitNotifications(visitId);
    
    if (visitToDelete) {
        analytics.track('visit_deleted', { locationType: visitToDelete.locationType });
        logger.info('Visite supprimée', { visitId: String(visitId).replace(/[\r\n]/g, ' '), speakerName: String(visitToDelete.nom).replace(/[\r\n]/g, ' ') });
    }
    addToast("Visite supprimée.", 'success');
};

const completeVisit = (visit: Visit) => {
    updateAppData(prev => {
        // Check if visit is already archived to prevent duplicates
        const isAlreadyArchived = prev.archivedVisits.some(v => v.visitId === visit.visitId);
        
        if (isAlreadyArchived) {
            addToast(`Cette visite est déjà archivée.`, 'warning');
            return prev;
        }

        const newSpeakers = prev.speakers.map(s => {
            if (s.id === visit.id) {
                const newHistoryEntry: TalkHistory = { date: visit.visitDate, talkNo: visit.talkNoOrType, theme: visit.talkTheme };
                const newTalkHistory = [...(s.talkHistory || []), newHistoryEntry];
                const uniqueHistory = Array.from(new Set(newTalkHistory.map(h => h.date)))
                    .map(date => newTalkHistory.find(h => h.date === date)!)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return { ...s, talkHistory: uniqueHistory };
            }
            return s;
        });
        
        analytics.track('visit_completed', { 
            locationType: visit.locationType,
            hasFeedback: !!visit.feedback 
        });
        logger.info('Visite terminée', { visitId: String(visit.visitId).replace(/[\r\n]/g, ' '), speakerName: String(visit.nom).replace(/[\r\n]/g, ' ') });
        
        return {
            ...prev,
            speakers: newSpeakers,
            archivedVisits: [visit, ...prev.archivedVisits],
            visits: prev.visits.filter(v => v.visitId !== visit.visitId)
        };
    });
    addToast(`Visite de ${visit.nom} marquée comme terminée et archivée.`, 'success');
};

const addFeedbackToVisit = (visitId: string, feedback: Feedback) => {
    updateAppData(prev => ({
        ...prev,
        archivedVisits: prev.archivedVisits.map(v => 
            v.visitId === visitId ? { ...v, feedback } : v
        )
    }));
};

const deleteArchivedVisit = (visitId: string) => {
    updateAppData(prev => ({ ...prev, archivedVisits: prev.archivedVisits.filter(v => v.visitId !== visitId) }));
    addToast("Visite supprimée définitivement de l'archive.", 'info');
};

const removeDuplicateArchivedVisits = () => {
    updateAppData(prev => {
        const uniqueVisits = new Map<string, Visit>();
        
        // Keep only the first occurrence of each visitId
        prev.archivedVisits.forEach(visit => {
            if (!uniqueVisits.has(visit.visitId)) {
                uniqueVisits.set(visit.visitId, visit);
            }
        });
        
        const deduplicated = Array.from(uniqueVisits.values());
        const duplicatesRemoved = prev.archivedVisits.length - deduplicated.length;
        
        if (duplicatesRemoved > 0) {
            addToast(`${duplicatesRemoved} doublon(s) supprimé(s) de l'archive.`, 'success');
        } else {
            addToast("Aucun doublon trouvé dans l'archive.", 'info');
        }
        
        return {
            ...prev,
            archivedVisits: deduplicated.sort((a, b) => 
                new Date(b.visitDate + 'T00:00:00').getTime() - new Date(a.visitDate + 'T00:00:00').getTime()
            )
        };
    });
};

const addHost = (newHost: Host): boolean => {
    // Validation des données
    const validation = validateData(HostSchema, newHost);
    if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
        logger.error('Données hôte invalides', undefined, { errors: errors.map(e => String(e).replace(/[\r\n]/g, ' ')) });
        addToast('Données invalides: ' + errors.join(', '), 'error');
        return false;
    }

    if (validation.data.nom && !appData?.hosts.some(h => h.nom.toLowerCase() === validation.data.nom.toLowerCase())) {
        updateAppData(prev => ({ ...prev, hosts: [...prev.hosts, validation.data as Host].sort((a, b) => a.nom.localeCompare(b.nom)) }));
        
        analytics.track('host_added', { hasAddress: !!(validation.data as any).adresse });
        addToast("Contact d'accueil ajouté.", 'success');
        return true;
    }
    return false;
};
    
const updateHost = (hostName: string, updatedData: Partial<Host>) => {
    updateAppData(prev => {
        const newHosts = prev.hosts.map(h => h.nom === hostName ? { ...h, ...updatedData } : h).sort((a,b) => a.nom.localeCompare(b.nom));
        let newVisits = prev.visits;
        let newArchived = prev.archivedVisits;
        if (updatedData.nom && updatedData.nom !== hostName) {
            newVisits = prev.visits.map(v => v.host === hostName ? { ...v, host: updatedData.nom! } : v);
            newArchived = prev.archivedVisits.map(v => v.host === hostName ? { ...v, host: updatedData.nom! } : v);
        }
        return { ...prev, hosts: newHosts, visits: newVisits, archivedVisits: newArchived };
    });
    addToast(`Informations pour "${updatedData.nom || hostName}" mises à jour.`, 'info');
};

const deleteHost = (hostName: string) => {
    const assignedVisits = appData?.visits.filter(v => v.host === hostName && v.status !== 'cancelled');
    updateAppData(prev => ({
        ...prev,
        hosts: prev.hosts.filter(h => h.nom !== hostName),
        visits: assignedVisits && assignedVisits.length > 0
            ? prev.visits.map(v => v.host === hostName ? { ...v, host: UNASSIGNED_HOST } : v)
            : prev.visits
    }));
    if (assignedVisits && assignedVisits.length > 0) {
        addToast(`"${hostName}" supprimé. ${assignedVisits.length} visite(s) associée(s) ont été mises à jour.`, 'success');
    } else {
        addToast(`"${hostName}" a été supprimé.`, 'success');
    }
};
    
const logCommunication = (visitId: string, messageType: MessageType, role: MessageRole) => {
    updateAppData(prev => {
        let confirmedToast = false;
        const newVisits = prev.visits.map(v => {
            if (v.visitId === visitId) {
                const now = new Date().toISOString();
                const updatedStatus = JSON.parse(JSON.stringify(v.communicationStatus || {}));
                if (!updatedStatus[messageType]) updatedStatus[messageType] = {};
                updatedStatus[messageType]![role] = now;
                const newStatus = (messageType === 'preparation' && role === 'host' && v.status === 'pending') ? 'confirmed' : v.status;
                if (newStatus === 'confirmed' && v.status === 'pending') confirmedToast = true;
                
                analytics.track('communication_logged', { messageType, role, visitId });
                logger.info('Communication enregistrée', { visitId: String(visitId).replace(/[\r\n]/g, ' '), messageType: String(messageType).replace(/[\r\n]/g, ' '), role: String(role).replace(/[\r\n]/g, ' '), speakerName: String(v.nom).replace(/[\r\n]/g, ' ') });
                
                return { ...v, communicationStatus: updatedStatus, status: newStatus };
            }
            return v;
        });
        if(confirmedToast) addToast("Statut de la visite mis à 'Confirmé'.", 'success');
        return { ...prev, visits: newVisits };
    });
};

const saveCustomTemplate = (language: Language, messageType: MessageType, role: MessageRole, text: string) => {
    updateAppData(prev => {
        const newTemplates = JSON.parse(JSON.stringify(prev.customTemplates));
        if (!newTemplates[language]) newTemplates[language] = {};
        if (!newTemplates[language]![messageType]) newTemplates[language]![messageType] = {};
        newTemplates[language]![messageType]![role] = text;
        
        analytics.track('template_saved', { language, messageType, role });
        trackFeatureUsed('custom_templates');
        
        return { ...prev, customTemplates: newTemplates };
    });
    addToast("Modèle de message sauvegardé !", 'success');
};
    
const deleteCustomTemplate = (language: Language, messageType: MessageType, role: MessageRole) => {
    updateAppData(prev => {
        const newTemplates = JSON.parse(JSON.stringify(prev.customTemplates));
        if (newTemplates[language]?.[messageType]?.[role]) {
            delete newTemplates[language]![messageType]![role];
            if (Object.keys(newTemplates[language]![messageType]!).length === 0) delete newTemplates[language]![messageType];
            if (Object.keys(newTemplates[language]!).length === 0) delete newTemplates[language];
        }
        return { ...prev, customTemplates: newTemplates };
    });
    addToast("Modèle par défaut restauré.", 'info');
};

const saveCustomHostRequestTemplate = (language: Language, text: string) => {
    updateAppData(prev => ({ ...prev, customHostRequestTemplates: { ...prev.customHostRequestTemplates, [language]: text } }));
    addToast("Modèle de message de demande d'accueil sauvegardé !", 'success');
};

const deleteCustomHostRequestTemplate = (language: Language) => {
    updateAppData(prev => {
        const newTemplates = { ...prev.customHostRequestTemplates };
        delete newTemplates[language];
        return { ...prev, customHostRequestTemplates: newTemplates };
    });
    addToast("Modèle par défaut restauré pour la demande d'accueil.", 'info');
};
    
const updateCongregationProfile = (profile: CongregationProfile) => {
    updateAppData(prev => ({...prev, congregationProfile: profile }));
    addToast("Profil de la congrégation mis à jour.", 'success');
};

const addTalk = (talkData: PublicTalk) => {
    updateAppData(prev => {
        if (prev.publicTalks.some(t => t.number === talkData.number)) {
            addToast(`Le discours n°${talkData.number} existe déjà.`, 'error');
            return prev;
        }
        const newTalks = [...prev.publicTalks, talkData].sort((a, b) => {
            const numA = typeof a.number === 'string' ? Infinity : a.number;
            const numB = typeof b.number === 'string' ? Infinity : b.number;
            if (numA === Infinity && numB === Infinity) {
                return String(a.number).localeCompare(String(b.number));
            }
            return numA - numB;
        });
        addToast(`Discours n°${talkData.number} ajouté.`, 'success');
        return { ...prev, publicTalks: newTalks };
    });
};

const updateTalk = (talkNumber: string | number, updatedData: PublicTalk) => {
    updateAppData(prev => {
        const talkExists = prev.publicTalks.some(t => t.number === updatedData.number && t.number !== talkNumber);
        if (talkExists) {
            addToast(`Le discours n°${updatedData.number} existe déjà.`, 'error');
            return prev;
        }
        const newTalks = prev.publicTalks.map(t => (t.number === talkNumber ? updatedData : t)).sort((a, b) => {
            const numA = typeof a.number === 'string' ? Infinity : a.number;
            const numB = typeof b.number === 'string' ? Infinity : b.number;
            if (numA === Infinity && numB === Infinity) {
                return String(a.number).localeCompare(String(b.number));
            }
            return numA - numB;
        });
        addToast(`Discours n°${updatedData.number} mis à jour.`, 'success');
        return { ...prev, publicTalks: newTalks };
    });
};

const deleteTalk = (talkNumber: string | number) => {
    const allVisits = [...(appData?.visits || []), ...(appData?.archivedVisits || [])];
    const isTalkAssigned = allVisits.some(v => v.talkNoOrType === talkNumber.toString());

    if (isTalkAssigned) {
        addToast(`Impossible de supprimer le discours n°${talkNumber} car il est assigné à une ou plusieurs visites.`, 'error');
        return;
    }

    updateAppData(prev => ({
        ...prev,
        publicTalks: prev.publicTalks.filter(t => t.number !== talkNumber),
    }));
    addToast(`Discours n°${talkNumber} supprimé.`, 'success');
};
    
const addSpeaker = useCallback((speakerData: Omit<Speaker, 'id' | 'congregation' | 'talkHistory'> & { tags?: string[] }): boolean => {
    if (!appData) {
        logger.warn('Tentative d\'ajout d\'un orateur sans données d\'application chargées');
        addToast("Erreur: Données d'application non chargées", 'error');
        return false;
    }
    
    try {
        // Nettoyage et validation des entrées
        const cleanedData = {
            ...speakerData,
            id: generateUUID(),
            congregation: appData.congregationProfile.name || 'Inconnue',
            talkHistory: [],
            tags: Array.isArray(speakerData.tags) 
                ? speakerData.tags
                    .map(tag => sanitizeInput(tag).trim())
                    .filter(Boolean)
                    .slice(0, 10) // Limite de 10 tags maximum
                : []
        };

        // Validation des données requises
        if (!cleanedData.nom) {
            throw new Error('Le nom est obligatoire');
        }

        // Vérifier si un orateur avec le même nom existe déjà
        const speakerExists = appData.speakers.some(s => 
            s.nom.toLowerCase() === cleanedData.nom.toLowerCase() && 
            s.id !== cleanedData.id
        );

        if (speakerExists) {
            addToast(`Un orateur nommé ${cleanedData.nom} existe déjà.`, 'warning');
            return false;
        }

        // Validation avec le schéma
        const validation = validateData(SpeakerSchema, cleanedData);
        if (!validation.success) {
            const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
            logger.error('Données orateur invalides', { errors });
            throw new Error(`Données invalides: ${errors.join(', ')}`);
        }

        // Mise à jour des données
        updateAppData(prev => ({
            ...prev,
            speakers: [...prev.speakers, cleanedData].sort((a, b) => 
                a.nom.localeCompare(b.nom)
            )
        }));

        // Journalisation et suivi
        logger.info('Nouvel orateur ajouté', { 
            speakerId: cleanedData.id,
            speakerName: cleanedData.nom
        });

        if (analytics) {
            analytics.track('speaker_created', { 
                congregation: cleanedData.congregation,
                hasPhone: !!cleanedData.telephone,
                tagsCount: cleanedData.tags?.length || 0
            });
        }

        addToast(`"${cleanedData.nom}" a été ajouté avec succès !`, 'success');
        return true;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
        logger.error("Erreur lors de l'ajout d'un orateur", { error });
        addToast(errorMessage, 'error');
        return false;
    }
    try {
        // Nettoyage et validation des entrées
        const cleanedData = {
            ...speakerData,
            nom: sanitizeInput(speakerData.nom || '').trim(),
            prenom: sanitizeInput(speakerData.prenom || '').trim(),
            telephone: speakerData.telephone ? sanitizeInput(speakerData.telephone).replace(/[^0-9+\s-]/g, '') : undefined,
            email: speakerData.email ? sanitizeInput(speakerData.email).toLowerCase().trim() : undefined,
            congregation: appData.congregationProfile.name || 'Inconnue',
            tags: Array.isArray(speakerData.tags) 
                ? speakerData.tags
                    .map(tag => sanitizeInput(tag).trim())
                    .filter(Boolean)
                    .slice(0, 10) // Limite de 10 tags maximum
                : []
        };
        
        // Validation des données requises
        if (!cleanedData.nom || !cleanedData.prenom) {
            throw new Error('Le nom et le prénom sont obligatoires');
        }
        
        // Validation de l'email si fourni
        if (cleanedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedData.email)) {
            throw new Error('Format d\'email invalide');
        }
        
        // Vérifier si un orateur avec le même nom et prénom existe déjà
        const speakerExists = appData.speakers.some(s => 
            s.nom.toLowerCase() === cleanedData.nom.toLowerCase() && 
            s.prenom.toLowerCase() === cleanedData.prenom.toLowerCase()
        );
        
        if (speakerExists) {
            addToast(`Un orateur nommé ${cleanedData.prenom} ${cleanedData.nom} existe déjà.`, 'warning');
            return false;
        }
        
        const newSpeaker: Speaker = {
            ...cleanedData,
            speakerId: generateUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            talkHistory: []
        };
        
        const validation = validateData(SpeakerSchema, newSpeaker);
        if (!validation.success) {
            const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
            logger.error('Données orateur invalides', { errors });
            throw new Error(`Données invalides: ${errors.join(', ')}`);
        }
        
    
    // Sauvegarder l'orateur et gérer les erreurs
    updateAppData(prev => ({
        ...prev,
        speakers: [...prev.speakers, newSpeaker].sort((a, b) => 
            a.nom.localeCompare(b.nom) || a.prenom.localeCompare(b.prenom)
        )
    }));
    
    // Journalisation et suivi
    logger.info('Nouvel orateur ajouté', { 
        speakerId: newSpeaker.speakerId,
        speakerName: `${newSpeaker.prenom} ${newSpeaker.nom}`.trim()
    });
    
    if (analytics) {
        analytics.track('speaker_created', { 
            congregation: newSpeaker.congregation,
            hasEmail: !!newSpeaker.email,
            hasPhone: !!newSpeaker.telephone,
            tagsCount: newSpeaker.tags?.length || 0
        });
    }
    
    addToast(`"${newSpeaker.prenom} ${newSpeaker.nom}" a été ajouté avec succès !`, 'success');
    return true;
    
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    logger.error("Erreur lors de l'ajout d'un orateur", { error });
    addToast(errorMessage, 'error');
    return false;
}
    }, [appData, addToast, updateAppData, analytics]);

    const updateHost = useCallback((hostName: string, updatedData: Partial<Host>) => {
        updateAppData(prev => {
            const newHosts = prev.hosts.map(h => h.nom === hostName ? { ...h, ...updatedData } : h).sort((a,b) => a.nom.localeCompare(b.nom));
            let newVisits = prev.visits;
            let newArchived = prev.archivedVisits;
            if (updatedData.nom && updatedData.nom !== hostName) {
                newVisits = prev.visits.map(v => v.host === hostName ? { ...v, host: updatedData.nom! } : v);
                newArchived = prev.archivedVisits.map(v => v.host === hostName ? { ...v, host: updatedData.nom! } : v);
            }
            return { ...prev, hosts: newHosts, visits: newVisits, archivedVisits: newArchived };
        });
        addToast(`Informations pour "${updatedData.nom || hostName}" mises à jour.`, 'info');
    };

    const deleteHost = (hostName: string) => {
        const assignedVisits = appData?.visits.filter(v => v.host === hostName && v.status !== 'cancelled');
        updateAppData(prev => ({
            ...prev,
            hosts: prev.hosts.filter(h => h.nom !== hostName),
            visits: assignedVisits && assignedVisits.length > 0
                ? prev.visits.map(v => v.host === hostName ? { ...v, host: UNASSIGNED_HOST } : v)
                : prev.visits
        }));
        if (assignedVisits && assignedVisits.length > 0) {
            addToast(`"${hostName}" supprimé. ${assignedVisits.length} visite(s) associée(s) ont été mises à jour.`, 'success');
        } else {
            addToast(`"${hostName}" a été supprimé.`, 'success');
        }
    };
    
    const logCommunication = (visitId: string, messageType: MessageType, role: MessageRole) => {
        updateAppData(prev => {
            let confirmedToast = false;
            const newVisits = prev.visits.map(v => {
                if (v.visitId === visitId) {
                    const now = new Date().toISOString();
                    const updatedStatus = JSON.parse(JSON.stringify(v.communicationStatus || {}));
                    if (!updatedStatus[messageType]) updatedStatus[messageType] = {};

        // Vérifier si l'hôte est utilisé dans des visites à venir
        const isHostUsed = appData.visits.some(visit => 
            visit.host === hostName && 
            new Date(visit.visitDate) >= new Date()
        );

        if (isHostUsed) {
            addToast("Impossible de supprimer cet hôte car il est associé à des visites à venir.", 'error');
            return;
        }

        updateAppData(prev => ({
            ...prev,
            hosts: prev.hosts.filter(host => host.nom !== hostName)
        }));
        addToast(`Hôte "${hostName}" supprimé avec succès.`, 'success');
    }, [appData, addToast]);

    // Logique de communication
    const logCommunication = useCallback((visitId: string, messageType: MessageType, role: MessageRole) => {
        const now = new Date().toISOString();
        
        updateAppData(prev => {
            const visitIndex = prev.visits.findIndex(v => v.id === visitId);
            if (visitIndex === -1) return prev;
            
            const updatedVisits = [...prev.visits];
            const visit = { ...updatedVisits[visitIndex] };
            
            if (!visit.communicationStatus) {
                visit.communicationStatus = {};
            }
            
            if (!visit.communicationStatus[messageType]) {
                visit.communicationStatus[messageType] = {};
            }
            
            visit.communicationStatus[messageType]![role] = now;
            updatedVisits[visitIndex] = visit;
            
            return { ...prev, visits: updatedVisits };
        });
    }, []);

    // Gestion des modèles de messages personnalisés
    const saveCustomTemplate = useCallback((language: Language, messageType: MessageType, role: MessageRole, text: string) => {
        updateAppData(prev => ({
            ...prev,
            customTemplates: {
                ...prev.customTemplates,
                [language]: {
                    ...(prev.customTemplates[language] || {}),
                    [messageType]: {
                        ...(prev.customTemplates[language]?.[messageType] || {}),
                        [role]: text
                    }
                }
            }
        }));
    }, []);

    const deleteCustomTemplate = useCallback((language: Language, messageType: MessageType, role: MessageRole) => {
        updateAppData(prev => {
            const newTemplates = { ...prev.customTemplates };
            
            if (newTemplates[language]?.[messageType]?.[role]) {
                const { [role]: _, ...rest } = newTemplates[language]![messageType]!;
                newTemplates[language]![messageType] = rest as any;
            }
            
            return { ...prev, customTemplates: newTemplates };
        });
    }, []);

    // Gestion des modèles de demande d'accueil personnalisés
    const saveCustomHostRequestTemplate = useCallback((language: Language, text: string) => {
        updateAppData(prev => ({
            ...prev,
            customHostRequestTemplates: {
                ...prev.customHostRequestTemplates,
                [language]: text
            }
        }));
    }, []);

    const deleteCustomHostRequestTemplate = useCallback((language: Language) => {
        updateAppData(prev => {
            const newTemplates = { ...prev.customHostRequestTemplates };
            if (newTemplates[language]) {
                delete newTemplates[language];
            }
            return { ...prev, customHostRequestTemplates: newTemplates };
        });
    }, []);

    // Gestion du profil de la congrégation
    const updateCongregationProfile = useCallback((profile: CongregationProfile) => {
        updateAppData(prev => ({ ...prev, congregationProfile: profile }));
    }, []);

    // Gestion des discours publics
    const addTalk = useCallback((talkData: PublicTalk) => {
        updateAppData(prev => {
            // Vérifier si le numéro de discours existe déjà
            const talkExists = prev.publicTalks.some(talk => 
                String(talk.number) === String(talkData.number)
            );
            
            if (talkExists) {
                addToast(`Le discours n°${talkData.number} existe déjà.`, 'error');
                return prev;
            }
            
            return {
                ...prev,
                publicTalks: [...prev.publicTalks, talkData].sort((a, b) => 
                    String(a.number).localeCompare(String(b.number))
                )
            };
        });
    }, [addToast]);

    const updateTalk = useCallback((talkNumber: string | number, updatedData: PublicTalk) => {
        updateAppData(prev => {
            const talkIndex = prev.publicTalks.findIndex(talk => 
                String(talk.number) === String(talkNumber)
            );
            
            if (talkIndex === -1) {
                addToast(`Discours n°${talkNumber} non trouvé.`, 'error');
                return prev;
            }
            
            const updatedTalks = [...prev.publicTalks];
            updatedTalks[talkIndex] = { ...updatedTalks[talkIndex], ...updatedData };
            
            return { ...prev, publicTalks: updatedTalks };
        });
    }, [addToast]);

    const deleteTalk = useCallback((talkNumber: string | number) => {
        updateAppData(prev => ({
            ...prev,
            publicTalks: prev.publicTalks.filter(t => String(t.number) !== String(talkNumber)),
        }));
        addToast(`Discours n°${talkNumber} supprimé.`, 'success');
    }, [addToast]);

    const mergeHosts = useCallback((primaryHostName: string, duplicateNames: string[]) => {
        if (!appData) return;

        // Vérifier que l'hôte principal existe
        const primaryHost = appData.hosts.find(h => h.nom === primaryHostName);
        if (!primaryHost) {
            addToast(`L'hôte principal "${primaryHostName}" n'a pas été trouvé.`, 'error');
            return;
        }

        // Vérifier que tous les doublons existent
        const duplicates = appData.hosts.filter(h => duplicateNames.includes(h.nom));
        if (duplicates.length !== duplicateNames.length) {
            const missing = duplicateNames.filter(name => 
                !appData.hosts.some(h => h.nom === name)
            );
            addToast(`Les hôtes suivants n'ont pas été trouvés : ${missing.join(', ')}`, 'error');
            return;
        }

        // Mettre à jour les visites pour utiliser l'hôte principal
        updateAppData(prev => {
            const updatedVisits = prev.visits.map(visit => {
                if (duplicateNames.includes(visit.host)) {
                    return { ...visit, host: primaryHostName };
                }
                return visit;
            });

            // Supprimer les doublons et conserver l'hôte principal
            const updatedHosts = prev.hosts.filter(
                host => host.nom === primaryHostName || !duplicateNames.includes(host.nom)
            );

            // Récupérer tous les tags uniques des hôtes fusionnés
            const allTags = new Set<string>();
            appData.hosts.forEach(host => {
                if (host.tags) {
                    host.tags.forEach(tag => allTags.add(tag));
                }
            });

            return {
                ...prev,
                visits: updatedVisits,
                hosts: updatedHosts
            };
        });

        addToast("Fusion des hôtes terminée avec succès.", 'success');
    }, [appData, addToast]);

    const addSpecialDate = useCallback((dateData: SpecialDate) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: [...(prev.specialDates || []), dateData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
        
        analytics.track('special_date_added', { type: dateData.type });
        addToast("Date spéciale ajoutée.", 'success');
    }, [addToast]);

    const updateSpecialDate = useCallback((dateData: SpecialDate) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: (prev.specialDates || []).map(d => d.id === dateData.id ? dateData : d).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
        
        analytics.track('special_date_updated', { type: dateData.type });
        addToast("Date spéciale mise à jour.", 'success');
    }, [addToast]);

    const deleteSpecialDate = useCallback((dateId: string) => {
        const dateToDelete = appData?.specialDates?.find(d => d.id === dateId);
        
        updateAppData(prev => ({
            ...prev,
            specialDates: (prev.specialDates || []).filter(d => d.id !== dateId)
        }));
        
        if (dateToDelete) {
            analytics.track('special_date_deleted', { type: dateToDelete.type });
        }
        addToast("Date spéciale supprimée.", 'success');
    }, [appData, addToast]);

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
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
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