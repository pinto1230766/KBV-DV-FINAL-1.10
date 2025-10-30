import React, { createContext, useContext, useMemo, useCallback, ReactNode, useState, useEffect } from 'react';
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
    
    const [sheetTabs, setSheetTabs] = useLocalStorage<Array<{ name: string; gid: string }>>('google-sheet-tabs', [
        { name: 'MAIU 2026', gid: '1817293373' },
        { name: 'JUNHU 2026', gid: '1474640023' },
    ]);

    const updateApiKey = (key: string) => {
        setStoredApiKey(key);
        addToast("Clé API enregistrée.", 'success');
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return [...appData.visits]
            .filter(v => new Date(v.visitDate + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.visitDate + 'T00:00:00').getTime() - new Date(b.visitDate + 'T00:00:00').getTime());
    }, [appData]);
    
    const pastUnarchivedVisits = useMemo(() => {
        if (!appData) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        return [...appData.visits]
            .filter(v => {
                const visitDate = new Date(v.visitDate + 'T00:00:00');
                return visitDate < today && visitDate >= ninetyDaysAgo && v.status !== 'completed' && v.status !== 'cancelled';
            })
            .sort((a, b) => new Date(b.visitDate + 'T00:00:00').getTime() - new Date(a.visitDate + 'T00:00:00').getTime());
    }, [appData]);
    
    const allSpeakerTags = useMemo(() => {
        if (!appData) return [];
        const tags = new Set<string>();
        appData.speakers.forEach(s => s.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [appData]);

    const allHostTags = useMemo(() => {
        if (!appData) return [];
        const tags = new Set<string>();
        appData.hosts.forEach(h => h.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [appData]);

    // --- Actions (refactored for single appData state) ---
    const updateAppData = (updater: (prev: AppData) => AppData) => {
        setAppData(prev => (prev ? updater(prev) : null));
    };

    const addSpeaker = (speakerData: Speaker) => {
        // Validation des données
        const validation = validateData(SpeakerSchema, speakerData);
        if (!validation.success) {
            const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
            logger.error('Données orateur invalides', undefined, { errors });
            addToast('Données invalides: ' + errors.join(', '), 'error');
            return;
        }

        const validatedSpeaker = { ...validation.data, talkHistory: validation.data.talkHistory || [] } as Speaker;
        updateAppData(prev => ({
            ...prev,
            speakers: [...prev.speakers, validatedSpeaker].sort((a, b) => a.nom.localeCompare(b.nom))
        }));
        
        analytics.track('speaker_added', { congregation: speakerData.congregation });
        addToast("Orateur ajouté.", 'success');
    };

    const updateSpeaker = (speakerData: Speaker) => {
        // Validation des données
        const validation = validateData(SpeakerSchema, speakerData);
        if (!validation.success) {
            const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
            logger.error('Données orateur invalides lors de la mise à jour', undefined, { errors });
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
        logger.info('Orateur supprimé', { speakerId, speakerName: speakerToDelete.nom });
        addToast(`"${speakerToDelete.nom}" et ses visites associées ont été supprimés.`, 'success');
    };

    const addVisit = async (visitData: Visit) => {
        // Validation des données
        const validation = validateData(VisitSchema, visitData);
        if (!validation.success) {
            const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
            logger.error('Données visite invalides', undefined, { errors });
            addToast('Données invalides: ' + errors.join(', '), 'error');
            return;
        }

        const visitWithStatus = { ...validation.data, communicationStatus: {} } as Visit;
        updateAppData(prev => ({ ...prev, visits: [...prev.visits, visitWithStatus] }));
        await scheduleVisitNotifications(visitWithStatus);
        
        trackVisitCreated(visitWithStatus);
        addToast("Visite programmée avec succès.", 'success');
    };
    
    const updateVisit = async (visitData: Visit) => {
        // Validation des données
        const validation = validateData(VisitSchema, visitData);
        if (!validation.success) {
            const errors = 'errors' in validation ? validation.errors : ['Erreur de validation'];
            logger.error('Données visite invalides lors de la mise à jour', undefined, { errors });
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
            logger.info('Visite supprimée', { visitId, speakerName: visitToDelete.nom });
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
            logger.info('Visite terminée', { visitId: visit.visitId, speakerName: visit.nom });
            
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
            logger.error('Données hôte invalides', undefined, { errors });
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
                    logger.info('Communication enregistrée', { visitId, messageType, role, speakerName: v.nom });
                    
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
    
    const updatePublicTalksList = (talksList: string) => {
        let addedCount = 0;
        let updatedCount = 0;

        updateAppData(prev => {
            const talkMap = new Map<string | number, PublicTalk>();
            prev.publicTalks.forEach(t => talkMap.set(t.number, t));

            const lines = talksList.split('\n').filter(line => line.trim());
            const talkRegex = /^([\w\d]+)\.?\s+(.+)$/;

            lines.forEach(line => {
                const match = line.trim().match(talkRegex);
                if (match) {
                    const numberStr = match[1];
                    const number = isNaN(parseInt(numberStr, 10)) ? numberStr.toUpperCase() : parseInt(numberStr, 10);
                    const theme = match[2].trim();
                    const existing = talkMap.get(number);

                    if (existing) {
                        if (existing.theme !== theme) {
                            existing.theme = theme;
                            updatedCount++;
                        }
                    } else {
                        talkMap.set(number, { number, theme });
                        addedCount++;
                    }
                }
            });

            const finalTalks = Array.from(talkMap.values()).sort((a, b) => {
                const numA = typeof a.number === 'string' ? Infinity : a.number;
                const numB = typeof b.number === 'string' ? Infinity : b.number;
                if (numA === Infinity && numB === Infinity) {
                    return String(a.number).localeCompare(String(b.number));
                }
                return numA - numB;
            });
    
          return { ...prev, publicTalks: finalTalks };
        });
    
        addToast(`${addedCount} discours ajoutés et ${updatedCount} mis à jour.`, 'success');
    };

    const saveFilterView = (view: SavedView) => {
        updateAppData(prev => ({ ...prev, savedViews: [...(prev.savedViews || []), view] }));
        addToast(`Vue "${view.name}" sauvegardée.`, 'success');
    };
    
    const deleteFilterView = (viewId: string) => {
        updateAppData(prev => ({ ...prev, savedViews: (prev.savedViews || []).filter(v => v.id !== viewId) }));
        addToast("Vue supprimée.", 'info');
    };

    const downloadFallback = useCallback((blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const exportData = useCallback(async () => {
        if (!appData) {
            addToast("Aucune donnée à exporter.", "warning");
            return;
        }
        
        analytics.track('data_exported', { 
            speakersCount: appData.speakers.length,
            visitsCount: appData.visits.length,
            hostsCount: appData.hosts.length
        });
        trackFeatureUsed('data_export');
        
        const dataString = JSON.stringify(appData, null, 2);
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `gestion_visiteurs_tj_backup_${date}.json`;
    
        if (Capacitor.isNativePlatform()) {
            try {
                // Vérifier et demander les permissions nécessaires
                const checkStorage = async () => {
                    if (Capacitor.getPlatform() === 'android') {
                        try {
                            // Essayer d'utiliser le répertoire de cache qui ne nécessite pas de permissions spéciales
                            const testPath = 'test_permission.txt';
                            await Filesystem.writeFile({
                                path: testPath,
                                data: 'test',
                                directory: Directory.Cache,
                                encoding: Encoding.UTF8
                            });
                            await Filesystem.deleteFile({
                                path: testPath,
                                directory: Directory.Cache
                            });
                            return true;
                        } catch (error) {
                            console.warn("Impossible d'écrire dans le cache:", error);
                            return false;
                        }
                    } else if (Capacitor.getPlatform() === 'ios') {
                        // Pour iOS, on utilise Documents qui est accessible via l'application Fichiers
                        return true;
                    }
                    return true;
                };

                const hasStorageAccess = await checkStorage();
                if (!hasStorageAccess) {
                    throw new Error("Impossible d'accéder au stockage de l'appareil. Vérifiez les autorisations de l'application.");
                }

                // Utiliser le répertoire Documents pour tous les appareils (plus accessible)
                const directory = Directory.Documents;
                const finalPath = Capacitor.getPlatform() === 'android' ? `KBV_Lyon_Backups/${fileName}` : fileName;

                // Créer le répertoire de sauvegarde si nécessaire
                if (Capacitor.getPlatform() === 'android') {
                    try {
                        await Filesystem.mkdir({
                            path: 'KBV_Lyon_Backups',
                            directory: Directory.Documents,
                            recursive: true
                        });
                    } catch (error) {
                        console.log('Le dossier de sauvegarde existe déjà ou ne peut pas être créé');
                    }
                }
                
                await Filesystem.writeFile({
                    path: finalPath,
                    data: dataString,
                    directory: directory,
                    encoding: Encoding.UTF8,
                    recursive: true
                });
    
                const platform = Capacitor.getPlatform();
                let successMessage: string;
                if (platform === 'ios') {
                    successMessage = `Sauvegarde enregistrée dans 'Fichiers' > 'Mon iPhone' > '${appData.congregationProfile.name}'`;
                } else if (platform === 'android') {
                    successMessage = `Sauvegarde enregistrée dans Documents > KBV_Lyon_Backups > ${fileName}`;

                    // Pour Android, on peut aussi proposer de partager le fichier si l'utilisateur veut
                    try {
                        const file = await Filesystem.getUri({
                            path: finalPath,
                            directory: Directory.Documents
                        });

                        // Optionnel : proposer de partager le fichier
                        if (file && file.uri && confirm('Voulez-vous aussi partager la sauvegarde ?')) {
                            await (window as any).Capacitor.Plugins.Share.share({
                                title: 'Sauvegarde des données KBV Lyon',
                                text: 'Voici votre sauvegarde de l\'application Gestion des Orateurs Visiteurs',
                                url: file.uri,
                                dialogTitle: 'Partager la sauvegarde',
                            });
                        }
                    } catch (shareError) {
                        console.warn("Le partage optionnel a échoué, mais la sauvegarde est bien enregistrée", shareError);
                    }
                } else {
                    successMessage = `Sauvegarde enregistrée: ${fileName}`;
                }
                
                addToast(successMessage, 'success', 7000);
            } catch (error) {
                console.error("Erreur lors de la sauvegarde native :", error);
                
                let errorMessage = "Échec de la sauvegarde native.";
                if (error instanceof Error) {
                     if (error.message.toLowerCase().includes('permission') || error.message.includes("Permission de stockage refusée")) {
                        errorMessage = "Permission de stockage refusée. Veuillez vérifier les autorisations de l'application.";
                    }
                }

                console.error("Erreur de sauvegarde native:", error);
                
                // Essayer d'utiliser le stockage local comme solution de secours
                try {
                    const backupKey = `backup_${Date.now()}`;
                    localStorage.setItem(backupKey, dataString);
                    
                    // Proposer à l'utilisateur de copier les données manuellement
                    const shouldCopy = confirm(`Impossible d'enregistrer le fichier automatiquement. Voulez-vous copier les données dans le presse-papiers ?`);
                    if (shouldCopy) {
                        await navigator.clipboard.writeText(dataString);
                        addToast("Les données ont été copiées dans le presse-papiers.", "info", 8000);
                    } else {
                        addToast("Sauvegarde échouée. Veuillez vérifier les autorisations de l'application.", "error", 8000);
                    }
                } catch (fallbackError) {
                    console.error("Échec de la sauvegarde de secours:", fallbackError);
                    addToast("Échec de la sauvegarde. Veuillez vérifier les autorisations de l'application.", "error", 8000);
                }
            }
        } else {
            const blob = new Blob([dataString], { type: 'application/json' });
            downloadFallback(blob, fileName);
            addToast("Téléchargement de la sauvegarde démarré.", 'success');
        }
    }, [appData, addToast, downloadFallback]);

    const importData = async (data: any) => {
        if (!data.speakers || !data.visits || !data.hosts) {
            throw new Error("Fichier de sauvegarde non valide ou corrompu.");
        }
        if (!appData) {
            addToast("Les données actuelles ne sont pas chargées, impossible de fusionner.", "error");
            return;
        }
    
        analytics.track('data_imported', { 
            importedSpeakers: data.speakers?.length || 0,
            importedVisits: data.visits?.length || 0,
            importedHosts: data.hosts?.length || 0
        });
        trackFeatureUsed('data_import');
        
        addToast("Fusion des données en cours...", "info");
    
        const unifyByName = <T extends { nom: string }>(current: T[], imported: T[]): T[] => {
            const map = new Map<string, T>();
            current.forEach(item => map.set(item.nom.toLowerCase().trim(), item));
            (imported || []).forEach(item => map.set(item.nom.toLowerCase().trim(), item));
            return Array.from(map.values());
        };
        const finalSpeakers = unifyByName(appData.speakers, (data.speakers || []) as Speaker[]);
        const finalHosts = unifyByName(appData.hosts, (data.hosts || []) as Host[]);
    
        const normalizeName = (value: string) => value
            ? value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            : "";

        const speakerNameToInfoMap = new Map<string, Speaker>();
        finalSpeakers.forEach(s => speakerNameToInfoMap.set(normalizeName(s.nom), s));

        const visitCompositeKey = (visit: Visit) => `${normalizeName(visit.nom)}|${visit.visitDate}`;

        const mergeVisitRecords = (existing: Visit | undefined, incoming: Visit): Visit => {
            if (!existing) {
                const cloned = { ...incoming };
                if (!cloned.visitId) {
                    cloned.visitId = generateUUID();
                }
                return cloned;
            }

            const merged: Visit = {
                ...existing,
                ...incoming,
                visitId: existing.visitId || incoming.visitId || generateUUID(),
                visitTime: incoming.visitTime || existing.visitTime,
                host: incoming.host || existing.host,
                accommodation: incoming.accommodation ?? existing.accommodation,
                meals: incoming.meals ?? existing.meals,
                status: incoming.status || existing.status,
                communicationStatus: { ...existing.communicationStatus, ...incoming.communicationStatus },
            };

            return merged;
        };

        type VisitBucket = { active?: Visit; archived?: Visit };
        const visitBuckets = new Map<string, VisitBucket>();
        let duplicateCount = 0;

        const upsertVisit = (visit: Visit, isArchived: boolean) => {
            const key = visitCompositeKey(visit);
            const bucket = visitBuckets.get(key) ?? {};

            if (isArchived) {
                if (bucket.archived) {
                    duplicateCount++;
                }
                const mergedArchived = mergeVisitRecords(bucket.archived, visit);
                visitBuckets.set(key, { ...bucket, archived: mergedArchived });
            } else {
                if (bucket.active) {
                    duplicateCount++;
                }
                const mergedActive = mergeVisitRecords(bucket.active, visit);
                visitBuckets.set(key, { ...bucket, active: mergedActive });
            }
        };

        const hydrateVisitWithSpeaker = (visit: Visit): Visit => {
            const speakerInfo = speakerNameToInfoMap.get(normalizeName(visit.nom));
            if (!speakerInfo) {
                return { ...visit };
            }

            return {
                ...visit,
                id: speakerInfo.id,
                nom: speakerInfo.nom,
                congregation: speakerInfo.congregation,
                telephone: speakerInfo.telephone,
                photoUrl: speakerInfo.photoUrl,
            };
        };

        appData.visits.forEach(v => upsertVisit(v, false));
        appData.archivedVisits.forEach(v => upsertVisit(v, true));
        (data.visits || []).forEach((v: Visit) => upsertVisit(v, false));
        (data.archivedVisits || []).forEach((v: Visit) => upsertVisit(v, true));

        const finalVisits: Visit[] = [];
        const finalArchivedVisits: Visit[] = [];

        visitBuckets.forEach(({ active, archived }) => {
            if (active) {
                finalVisits.push(hydrateVisitWithSpeaker(active));
            }
            if (archived) {
                finalArchivedVisits.push(hydrateVisitWithSpeaker(archived));
            }
        });
    
        const unifyTalks = (current: PublicTalk[], imported: PublicTalk[]): PublicTalk[] => {
            const map = new Map<string | number, PublicTalk>();
            current.forEach(item => map.set(item.number, item));
            (imported || []).forEach(item => map.set(item.number, item));
            return Array.from(map.values());
        };
        const finalTalks = unifyTalks(appData.publicTalks, data.publicTalks || []);
    
        const newAppData: AppData = {
            speakers: finalSpeakers.sort((a, b) => a.nom.localeCompare(b.nom)),
            hosts: finalHosts.sort((a, b) => a.nom.localeCompare(b.nom)),
            visits: finalVisits,
            archivedVisits: finalArchivedVisits,
            congregationProfile: data.congregationProfile || appData.congregationProfile,
            customTemplates: data.customTemplates || appData.customTemplates,
            customHostRequestTemplates: data.customHostRequestTemplates || appData.customHostRequestTemplates,
            publicTalks: finalTalks,
            savedViews: data.savedViews || appData.savedViews || [],
            specialDates: data.specialDates || appData.specialDates || [],
        };
    
        setAppData(newAppData);
        logger.info('Données importées avec succès', { 
            finalSpeakers: finalSpeakers.length,
            finalVisits: finalVisits.length,
            finalHosts: finalHosts.length
        });
        addToast("Les données ont été fusionnées intelligemment pour éviter les doublons !", 'success');
    };

    const resetData = () => {
        updateAppData(prev => ({...prev, ...initialData}));
        
        analytics.track('data_reset');
        logger.warn('Données réinitialisées par l\'utilisateur');
        addToast("Toutes les données ont été réinitialisées.", 'success');
    };

    // Fonction utilitaire pour parser les dates au format français (JJ/MM/AAAA) ou ISO (AAAA-MM-JJ)
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        
        // Format Google Sheets: Date(2025,0,19)
        const googleDateMatch = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (googleDateMatch) {
            const year = parseInt(googleDateMatch[1], 10);
            const month = parseInt(googleDateMatch[2], 10);
            const day = parseInt(googleDateMatch[3], 10);
            // Utiliser UTC pour éviter les problèmes de fuseau horaire
            return new Date(Date.UTC(year, month, day));
        }
        
        // Essayer de parser la date au format JJ/MM/AAAA
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0
            const year = parseInt(parts[2], 10);
            
            // Vérifier que les valeurs sont valides
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                return null;
            }
            
            const date = new Date(year, month, day);
            
            // Vérifier que la date est valide
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Essayer de parser la date au format ISO (AAAA-MM-JJ) ou autre format reconnu par le constructeur Date
        const isoDate = new Date(dateStr);
        if (!isNaN(isoDate.getTime())) {
            return isoDate;
        }
        
        // Si le format contient des tirets mais n'a pas pu être parsé directement, essayer avec l'heure minuit
        if (dateStr.includes('-')) {
            const dateWithTime = new Date(dateStr + 'T00:00:00');
            if (!isNaN(dateWithTime.getTime())) {
                return dateWithTime;
            }
        }
        
        return null;
    };

    const syncWithGoogleSheet = async (): Promise<void> => {
        if (!appData) return;
        
        const googleSheetId = '1drIzPPi6AohCroSyUkF1UmMFxuEtMACBF4XATDjBOcg';
        const sheetsToSync = sheetTabs;
        
        // Filtrer uniquement les dates >= 2026
        const minYear = 2026;
        
        // Fonction pour récupérer les données d'un onglet spécifique avec gestion des erreurs améliorée
        const fetchSheetData = async (sheetInfo: { name: string; gid: string }, retryCount = 3): Promise<any> => {
            const range = 'A2:Z100';
            const url = `https://docs.google.com/spreadsheets/d/${googleSheetId}/gviz/tq?gid=${sheetInfo.gid}&range=${encodeURIComponent(range)}&tqx=out:json`;
            
            let lastError: Error | null = null;
            
            // Tentative avec réessai en cas d'échec
            for (let attempt = 1; attempt <= retryCount; attempt++) {
                try {
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP ${response.status} - ${response.statusText}`);
                    }
                    
                    const rawText = await response.text();
                    const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\((.*)\)/s);
                    
                    if (!jsonMatch) {
                        throw new Error("Format de réponse inattendu de l'API Google Sheets");
                    }
                    
                    const data = JSON.parse(jsonMatch[1]);
                    
                    if (data.status === 'error') {
                        throw new Error(data.errors?.map((e: any) => e.detailed_message || e.message || 'Erreur inconnue').join('; ') || 'Erreur inconnue');
                    }
                    
                    return data;
                } catch (error) {
                    lastError = error as Error;
                    console.warn(`Tentative ${attempt}/${retryCount} échouée pour ${sheetInfo.name}:`, error);
                    
                    // Attendre avant de réessayer (backoff exponentiel)
                    if (attempt < retryCount) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                    }
                }
            }
            
            // Si on arrive ici, toutes les tentatives ont échoué
            throw new Error(`Impossible de récupérer les données de l'onglet "${sheetInfo.name}" après ${retryCount} tentatives: ${lastError?.message}`);
        };

        // Fonction pour valider et formater une visite
        const validateAndFormatVisit = (visit: Partial<Visit>): Visit | null => {
            try {
                if (!visit.nom || !visit.visitDate) {
                    console.warn('Visite invalide: nom ou date manquant', visit);
                    return null;
                }
                
                // Vérifier que la date est valide
                const visitDate = parseDate(visit.visitDate);
                if (!visitDate) {
                    console.warn('Date de visite invalide:', visit.visitDate);
                    return null;
                }
                
                // Formater la date au format YYYY-MM-DD
                const formattedDate = visitDate.toISOString().split('T')[0];
                
                // Créer une visite valide avec des valeurs par défaut
                return {
                    id: visit.id || generateUUID(),
                    visitId: visit.visitId || generateUUID(),
                    nom: visit.nom.trim(),
                    congregation: visit.congregation?.trim() || '',
                    telephone: visit.telephone?.trim() || '',
                    photoUrl: visit.photoUrl?.trim() || '',
                    visitDate: formattedDate,
                    visitTime: visit.visitTime || '14:30',
                    host: visit.host || '',
                    accommodation: visit.accommodation || '',
                    meals: visit.meals || '',
                    status: visit.status || 'confirmed',
                    locationType: visit.locationType || 'physical',
                    talkNoOrType: visit.talkNoOrType || '',
                    talkTheme: visit.talkTheme || '',
                    arrivalDate: visit.arrivalDate || '',
                    departureDate: visit.departureDate || '',
                    notes: visit.notes || '',
                    attachments: visit.attachments || [],
                    expenses: visit.expenses || [],
                    communicationStatus: visit.communicationStatus || {},
                    checklist: visit.checklist || [],
                    feedback: visit.feedback
                };
            } catch (error) {
                console.error('Erreur lors de la validation de la visite:', error);
                return null;
            }
        };

        try {
            addToast('Début de la synchronisation avec Google Sheets...', 'info');
            const allVisits: Visit[] = [];
            const processedSpeakers = new Set<string>();
            let totalProcessed = 0;
            
            // Créer ou trouver l'orateur "À définir"
            let undefinedSpeaker = appData.speakers.find(s => s.nom === 'À définir');
            if (!undefinedSpeaker) {
                undefinedSpeaker = {
                    id: generateUUID(),
                    nom: 'À définir',
                    congregation: '',
                    telephone: '',
                    photoUrl: '',
                    tags: [],
                    talkHistory: []
                };
                updateAppData(prev => ({
                    ...prev,
                    speakers: [...prev.speakers, undefinedSpeaker!]
                }));
            }
            
            // Récupérer les données de tous les onglets en parallèle avec Promise.all
            await Promise.all(sheetsToSync.map(async (sheetInfo) => {
                try {
                    const data = await fetchSheetData(sheetInfo);
                    
                    if (!data.table || !data.table.rows || !Array.isArray(data.table.rows)) {
                        console.warn(`Aucune donnée valide dans l'onglet ${sheetInfo.name}`);
                        return;
                    }
                    
                    const headers = data.table.cols.map((h: any) => 
                        h.label?.toLowerCase().trim()
                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]/g, '') || ''
                    );
                    

                    
                    const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('data'));
                    const speakerIndex = headers.findIndex(h => h.includes('orateur') || h.includes('speaker') || h.includes('orador'));
                    const congregationIndex = headers.findIndex(h => h.includes('congregation') || h.includes('kongregason'));
                    const talkIndex = headers.findIndex(h => h.includes('discours') || h.includes('talk') || h.includes('theme') || h.includes('tema'));
                    
                    if (dateIndex === -1 || speakerIndex === -1) {
                        console.warn(`En-têtes requis manquants dans ${sheetInfo.name}. Colonnes trouvées:`, headers);
                        return;
                    }
                    
                    for (const row of data.table.rows) {
                        try {
                            const dateStr = row.c[dateIndex]?.v;
                            const speaker = row.c[speakerIndex]?.v;
                            const congregation = congregationIndex !== -1 ? row.c[congregationIndex]?.v : '';
                            const talk = talkIndex !== -1 ? row.c[talkIndex]?.v : '';
                            
                            if (!dateStr) continue;
                            
                            const visitDate = parseDate(dateStr);
                            if (!visitDate) continue;
                            
                            // Nettoyer le nom de l'orateur (enlever guillemets et sauts de ligne)
                            const speakerName = speaker 
                                ? speaker.toString().replace(/"/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() 
                                : 'À définir';
                            
                            // Filtrer uniquement les dates >= 2026
                            if (visitDate.getFullYear() < minYear) continue;
                            
                            const maxDate = new Date('2030-12-31T23:59:59');
                            if (visitDate > maxDate) continue;
                            
                            const speakerKey = `${speakerName.toLowerCase()}_${visitDate.toISOString().split('T')[0]}`;
                            if (processedSpeakers.has(speakerKey)) continue;
                            processedSpeakers.add(speakerKey);
                            
                            // Trouver ou créer l'orateur (recherche flexible)
                            let speakerId = undefinedSpeaker!.id;
                            if (speaker) {
                                let existingSpeaker = appData.speakers.find(s => {
                                    const cleanDbName = s.nom.toLowerCase().replace(/\s+/g, ' ').trim();
                                    const cleanSheetName = speakerName.toLowerCase().replace(/\s+/g, ' ').trim();
                                    return cleanDbName === cleanSheetName;
                                });
                                
                                if (!existingSpeaker) {
                                    // Créer un nouvel orateur
                                    existingSpeaker = {
                                        id: generateUUID(),
                                        nom: speakerName,
                                        congregation: congregation?.toString() || '',
                                        telephone: '',
                                        photoUrl: '',
                                        tags: [],
                                        talkHistory: []
                                    };
                                    updateAppData(prev => ({
                                        ...prev,
                                        speakers: [...prev.speakers, existingSpeaker!]
                                    }));
                                }
                                speakerId = existingSpeaker.id;
                            }
                            
                            const visit: Partial<Visit> = {
                                id: speakerId,
                                nom: speakerName,
                                congregation: congregation?.toString() || '',
                                visitDate: visitDate.toISOString().split('T')[0],
                                talkNoOrType: talk?.toString() || '',
                                talkTheme: talk?.toString() || ''
                            };
                            
                            const validVisit = validateAndFormatVisit(visit);
                            if (validVisit) {
                                allVisits.push(validVisit);
                                totalProcessed++;
                            }
                        } catch (error) {
                            console.error(`Erreur lors du traitement d'une ligne dans ${sheetInfo.name}:`, error);
                        }
                    }
                } catch (error) {
                    console.error(`Erreur avec l'onglet ${sheetInfo.name}:`, error);
                    addToast(
                        `Erreur avec l'onglet ${sheetInfo.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                        'error'
                    );
                }
            }));

            if (allVisits.length === 0) {
                addToast("Aucune donnée valide trouvée dans les onglets spécifiés.", 'warning');
                return;
            }
            
            updateAppData(prev => ({
                ...prev,
                visits: [...allVisits, ...prev.visits.filter(v => 
                    !allVisits.some(av => av.visitDate === v.visitDate && av.nom === v.nom)
                )]
            }));
            
            analytics.track('google_sheets_sync', { 
                totalProcessed,
                sheetsCount: sheetsToSync.length
            });
            trackFeatureUsed('google_sheets_sync');
            
            addToast(`Synchronisation réussie : ${totalProcessed} visites chargées.`, 'success');
            
        } catch (error) {
            console.error('Erreur lors de la synchronisation avec Google Sheets:', error);
            logger.error('Erreur synchronisation Google Sheets', error as Error);
            addToast(
                `Erreur lors de la synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                'error'
            );
        }
    };

    const mergeSpeakers = (primarySpeakerId: string, duplicateIds: string[]) => {
        updateAppData(prev => {
            const primarySpeaker = prev.speakers.find(s => s.id === primarySpeakerId);
            if (!primarySpeaker) {
                addToast("Erreur : l'orateur principal n'a pas été trouvé.", 'error');
                return prev;
            }
    
            const newVisits = prev.visits.map(v => {
                if (duplicateIds.includes(v.id)) {
                    return { ...v, id: primarySpeaker.id, nom: primarySpeaker.nom, congregation: primarySpeaker.congregation, telephone: primarySpeaker.telephone, photoUrl: primarySpeaker.photoUrl };
                }
                return v;
            });
    
            const newArchivedVisits = prev.archivedVisits.map(v => {
                if (duplicateIds.includes(v.id)) {
                    return { ...v, id: primarySpeaker.id, nom: primarySpeaker.nom, congregation: primarySpeaker.congregation, telephone: primarySpeaker.telephone, photoUrl: primarySpeaker.photoUrl };
                }
                return v;
            });
    
            const newSpeakers = prev.speakers.filter(s => !duplicateIds.includes(s.id));
    
            analytics.track('speakers_merged', { 
                primarySpeakerId,
                mergedCount: duplicateIds.length
            });
            logger.info('Orateurs fusionnés', { primarySpeakerId, duplicateIds });
    
            return {
                ...prev,
                speakers: newSpeakers,
                visits: newVisits,
                archivedVisits: newArchivedVisits,
            };
        });
        addToast("Orateurs fusionnés avec succès.", "success");
    };

    const mergeHosts = (primaryHostName: string, duplicateNames: string[]) => {
        updateAppData(prev => {
            const newVisits = prev.visits.map(v => {
                if (duplicateNames.includes(v.host)) {
                    return { ...v, host: primaryHostName };
                }
                return v;
            });
    
            const newArchivedVisits = prev.archivedVisits.map(v => {
                if (duplicateNames.includes(v.host)) {
                    return { ...v, host: primaryHostName };
                }
                return v;
            });
    
            const newHosts = prev.hosts.filter(h => !duplicateNames.includes(h.nom));
    
            analytics.track('hosts_merged', { 
                primaryHostName,
                mergedCount: duplicateNames.length
            });
            logger.info('Contacts d\'accueil fusionnés', { primaryHostName, duplicateNames });
    
            return {
                ...prev,
                hosts: newHosts,
                visits: newVisits,
                archivedVisits: newArchivedVisits,
            };
        });
        addToast("Contacts d'accueil fusionnés avec succès.", "success");
    };
    
    const addSpecialDate = (dateData: SpecialDate) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: [...(prev.specialDates || []), dateData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
        
        analytics.track('special_date_added', { type: dateData.type });
        addToast("Date spéciale ajoutée.", 'success');
    };

    const updateSpecialDate = (dateData: SpecialDate) => {
        updateAppData(prev => ({
            ...prev,
            specialDates: (prev.specialDates || []).map(d => d.id === dateData.id ? dateData : d).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        }));
        
        analytics.track('special_date_updated', { type: dateData.type });
        addToast("Date spéciale mise à jour.", 'success');
    };

    const deleteSpecialDate = (dateId: string) => {
        const dateToDelete = appData?.specialDates?.find(d => d.id === dateId);
        
        updateAppData(prev => ({
            ...prev,
            specialDates: (prev.specialDates || []).filter(d => d.id !== dateId)
        }));
        
        if (dateToDelete) {
            analytics.track('special_date_deleted', { type: dateToDelete.type });
        }
        addToast("Date spéciale supprimée.", 'success');
    };
    
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