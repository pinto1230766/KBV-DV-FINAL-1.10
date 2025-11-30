import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    UploadIcon, SpinnerIcon, ExclamationTriangleIcon,
    ExternalLinkIcon, ShieldCheckIcon, PodiumIcon, BookOpenIcon, ServerStackIcon, LockClosedIcon, LockOpenIcon, CloudArrowDownIcon, InformationCircleIcon, SparklesIcon, DownloadIcon, ChevronDownIcon, ClockIcon, SunIcon, MoonIcon, ComputerDesktopIcon, PaintBrushIcon, EnvelopeIcon, SaveIcon, ArrowUturnLeftIcon, MapPinIcon, EyeIcon, EyeSlashIcon
} from './Icons';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { ArchivedVisits } from './ArchivedVisits';
import { EncryptionPrompt } from './EncryptionPrompt';
import { CongregationProfile, Visit, Language, MessageType, MessageRole } from '../types';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { DuplicateFinderModal } from './DuplicateFinderModal';
import { LanguageSelector } from './LanguageSelector';
import { messageTemplates, hostRequestMessageTemplates } from '../constants';

interface SettingsProps {
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onResetData: () => void;
    isImporting: boolean;
    onLeaveFeedback: (visit: Visit) => void;
    archiveSectionRef: React.RefObject<HTMLDivElement>;
}

interface SettingsSectionProps {
    title: string;
    description: string;
    icon: React.FC<any>;
    children: React.ReactNode;
    startsOpen?: boolean;
    containerRef?: React.RefObject<HTMLDivElement>;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon: Icon, children, startsOpen = false, containerRef }) => {
    const [isExpanded, setIsExpanded] = useState(startsOpen);

    return (
        <div ref={containerRef} className="bg-card-light dark:bg-card-dark rounded-xl shadow-soft-lg transition-all duration-300">
            <div className="p-4 cursor-pointer flex justify-between items-center" onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsExpanded(!isExpanded)} aria-expanded={isExpanded}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-full flex-shrink-0">
                       <Icon className="w-6 h-6 text-secondary"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-primary dark:text-white">{title}</h2>
                        <p className="text-sm text-text-muted dark:text-text-muted-dark">{description}</p>
                    </div>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-text-muted dark:text-text-muted-dark transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                    <div className="border-t border-border-light dark:border-border-dark pt-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};


const CongregationProfileContent: React.FC = () => {
    const { congregationProfile, updateCongregationProfile } = useData();
    const { addToast } = useToast();
    const [profile, setProfile] = useState<CongregationProfile>(congregationProfile);
    const [isDirty, setIsDirty] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');

    useEffect(() => {
        setProfile(congregationProfile);
        setIsDirty(false);
    }, [congregationProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
        setIsDirty(true);
    };

    const handleSave = () => {
        updateCongregationProfile(profile);
        setIsDirty(false);
    };

    const handleGetLocation = async () => {
        setIsGettingLocation(true);
        setLocationError('');
        try {
            if (!navigator.geolocation) {
                throw new Error("La géolocalisation n'est pas supportée par cet appareil ou ce navigateur.");
            }
    
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { 
                    timeout: 10000,
                    enableHighAccuracy: true 
                });
            });
            
            setProfile(prev => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }));
            
            setIsDirty(true);
            addToast("Position actuelle récupérée.", 'success');
        } catch (error) {
            console.error("Error getting location", error);
            let errorMessage = 'Impossible de récupérer la position.';
    
            if (error instanceof GeolocationPositionError) {
                switch(error.code) {
                    case 1: // PERMISSION_DENIED
                        errorMessage = "Accès à la localisation bloqué. Veuillez l'autoriser dans les paramètres de votre navigateur/appareil pour ce site.";
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        errorMessage = "Information de localisation non disponible. Vérifiez que le GPS est activé.";
                        break;
                    case 3: // TIMEOUT
                        errorMessage = "La demande de géolocalisation a expiré.";
                        break;
                }
            } else if (error instanceof Error) {
                 if (error.message.includes('not supported')) {
                     errorMessage = "La géolocalisation n'est pas supportée par ce navigateur.";
                } else if (error.message.includes('Only secure origins are allowed')) {
                    errorMessage = "La géolocalisation requiert une connexion sécurisée (HTTPS).";
                }
            }
            setLocationError(errorMessage);
            addToast(errorMessage, 'error', 7000);
        } finally {
            setIsGettingLocation(false);
        }
    };

    return (
        <div className="space-y-4">
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Nom de l'application / Congrégation</label>
                <input type="text" id="name" name="name" value={profile.name} onChange={handleChange} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" />
            </div>
            <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Sous-titre</label>
                <input type="text" id="subtitle" name="subtitle" value={profile.subtitle} onChange={handleChange} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" />
            </div>
             <div>
                <label htmlFor="defaultTime" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Heure par défaut des discours</label>
                <input type="time" id="defaultTime" name="defaultTime" value={profile.defaultTime} onChange={handleChange} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" />
            </div>
            <div>
                <label htmlFor="hospitalityOverseer" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Responsable de l'accueil</label>
                <input type="text" id="hospitalityOverseer" name="hospitalityOverseer" value={profile.hospitalityOverseer || ''} onChange={handleChange} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" />
            </div>
            <div>
                <label htmlFor="hospitalityOverseerPhone" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Téléphone du responsable</label>
                <input type="tel" id="hospitalityOverseerPhone" name="hospitalityOverseerPhone" value={profile.hospitalityOverseerPhone || ''} onChange={handleChange} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" />
            </div>
            <div>
                <label htmlFor="backupPhoneNumber" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Numéro WhatsApp pour sauvegarde (avec indicatif)</label>
                <input type="tel" id="backupPhoneNumber" name="backupPhoneNumber" value={profile.backupPhoneNumber || ''} onChange={handleChange} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" placeholder="+33612345678" />
            </div>
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Ville de la congrégation</label>
                <input 
                    type="text" 
                    id="city" 
                    name="city" 
                    value={profile.city || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10" 
                    placeholder="Ex: Lyon, France"
                />
                <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Utilisée pour les prévisions météo précises.</p>
            </div>
            <div className="pt-4 border-t border-border-light dark:border-border-dark">
                 <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Localisation de la salle du Royaume</label>
                <p className="text-xs text-text-muted dark:text-text-muted-dark mb-2">Utilisée pour la météo et le calcul de trajet.</p>
                <div className="mt-2 flex flex-col sm:flex-row gap-4 items-start">
                    <button type="button" onClick={handleGetLocation} disabled={isGettingLocation} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-text-main-dark font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95">
                        {isGettingLocation ? <SpinnerIcon className="w-5 h-5"/> : <MapPinIcon className="w-5 h-5"/>}
                        {isGettingLocation ? 'Recherche...' : 'Définir avec la position actuelle'}
                    </button>
                    {profile.latitude && profile.longitude ? (
                        <div className="p-3 bg-gray-100 dark:bg-primary-light/20 rounded-md text-sm w-full sm:w-auto">
                            <p className="font-mono">Lat: {profile.latitude.toFixed(5)}</p>
                            <p className="font-mono">Lon: {profile.longitude.toFixed(5)}</p>
                            <a href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-secondary hover:underline text-xs font-semibold mt-1 inline-block">
                                Voir sur la carte
                            </a>
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted dark:text-text-muted-dark pt-2">Aucune position enregistrée.</p>
                    )}
                </div>
                {locationError && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{locationError}</p>}
            </div>
            <div className="text-right pt-4 border-t border-border-light dark:border-border-dark">
                <button onClick={handleSave} disabled={!isDirty} className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95">
                    Enregistrer les modifications
                </button>
            </div>
        </div>
    );
};

const TemplateItem: React.FC<{
    title: string;
    template: string;
    onSave: (newTemplate: string) => void;
    onRestore: () => void;
    isCustom: boolean;
}> = ({ title, template, onSave, onRestore, isCustom }) => {
    const [text, setText] = useState(template);
    const isDirty = text !== template;

    useEffect(() => {
        setText(template);
    }, [template]);

    const handleSave = () => {
        onSave(text);
    };

    return (
        <div className="p-4 bg-gray-50 dark:bg-primary-light/10 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-text-main dark:text-text-main-dark">{title}</h4>
                <div className="flex items-center gap-3">
                    {isCustom && (
                        <button type="button" onClick={onRestore} className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 hover:underline">
                            <ArrowUturnLeftIcon className="w-4 h-4" /> Rétablir
                        </button>
                    )}
                    <button type="button" onClick={handleSave} disabled={!isDirty} className="px-3 py-1 text-xs bg-primary text-white rounded-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95">
                        <SaveIcon className="w-4 h-4"/> Enregistrer
                    </button>
                </div>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="w-full p-2 border rounded-md bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark font-mono text-sm"
            />
        </div>
    );
};

const TemplateEditorContent: React.FC = () => {
    const { customTemplates, customHostRequestTemplates, saveCustomTemplate, deleteCustomTemplate, saveCustomHostRequestTemplate, deleteCustomHostRequestTemplate } = useData();
    const [language, setLanguage] = useState<Language>('fr');

    const getVisitTemplate = useCallback((type: MessageType, role: MessageRole): { template: string, isCustom: boolean } => {
        const custom = customTemplates[language]?.[type]?.[role];
        const defaultTpl = messageTemplates[language]?.[type]?.[role] || "";
        return { template: custom || defaultTpl, isCustom: !!custom };
    }, [customTemplates, language]);

    const getHostRequestTemplate = useCallback((type: 'singular' | 'plural'): { template: string, isCustom: boolean } => {
        const custom = customHostRequestTemplates[language];
        // Data migration: if custom is a string, treat it as the plural template
        if (typeof custom === 'string') {
            const defaultTpl = hostRequestMessageTemplates[language]?.plural || "";
            return { template: type === 'plural' ? custom : (hostRequestMessageTemplates[language]?.singular || ""), isCustom: type === 'plural' };
        }
        
        const customTpl = custom?.[type];
        const defaultTpl = hostRequestMessageTemplates[language]?.[type] || "";
        return { template: customTpl || defaultTpl, isCustom: !!customTpl };
    }, [customHostRequestTemplates, language]);

    const visitMessageTypes: { type: MessageType, label: string }[] = [
        { type: 'confirmation', label: 'Confirmation' },
        { type: 'preparation', label: 'Préparation' },
        { type: 'reminder-7', label: 'Rappel J-7' },
        { type: 'reminder-2', label: 'Rappel J-2' },
        { type: 'thanks', label: 'Remerciements' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <LanguageSelector lang={language} setLang={setLanguage} />
            </div>

            <div>
                <h3 className="text-lg font-bold font-display text-primary dark:text-white mb-3">Messages de visite</h3>
                <div className="space-y-4">
                    {visitMessageTypes.map(({ type, label }) => (
                        <div key={type} className="p-4 border border-border-light dark:border-border-dark rounded-lg">
                            <h4 className="font-bold mb-3">{label}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TemplateItem
                                    title="Pour l'orateur"
                                    template={getVisitTemplate(type, 'speaker').template}
                                    isCustom={getVisitTemplate(type, 'speaker').isCustom}
                                    onSave={(text) => saveCustomTemplate(language, type, 'speaker', text)}
                                    onRestore={() => deleteCustomTemplate(language, type, 'speaker')}
                                />
                                <TemplateItem
                                    title="Pour l'accueil"
                                    template={getVisitTemplate(type, 'host').template}
                                    isCustom={getVisitTemplate(type, 'host').isCustom}
                                    onSave={(text) => saveCustomTemplate(language, type, 'host', text)}
                                    onRestore={() => deleteCustomTemplate(language, type, 'host')}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t border-border-light dark:border-border-dark">
                <h3 className="text-lg font-bold font-display text-primary dark:text-white mb-3">Demande d'accueil groupée</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TemplateItem
                        title="Modèle pour une seule personne"
                        template={getHostRequestTemplate('singular').template}
                        isCustom={getHostRequestTemplate('singular').isCustom}
                        onSave={(text) => saveCustomHostRequestTemplate(language, 'singular', text)}
                        onRestore={() => deleteCustomHostRequestTemplate(language, 'singular')}
                    />
                    <TemplateItem
                        title="Modèle pour plusieurs personnes"
                        template={getHostRequestTemplate('plural').template}
                        isCustom={getHostRequestTemplate('plural').isCustom}
                        onSave={(text) => saveCustomHostRequestTemplate(language, 'plural', text)}
                        onRestore={() => deleteCustomHostRequestTemplate(language, 'plural')}
                    />
                </div>
            </div>
        </div>
    );
};


const GoogleSheetsContent: React.FC<{ onSync: () => Promise<void> }> = ({ onSync }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const isOnline = useOnlineStatus();
    
    useEffect(() => {
        setLastSync(localStorage.getItem('lastGoogleSheetSync'));
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        await onSync();
        setLastSync(new Date().toISOString());
        setIsSyncing(false);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm flex items-start space-x-3">
                <InformationCircleIcon className="w-8 h-8 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Instructions :</p>
                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li>L'application est pré-configurée pour se synchroniser avec le Google Sheet de suivi.</li>
                        <li>Assurez-vous que le Google Sheet est partagé publiquement avec le lien (en mode Lecteur). Allez dans <strong>Partager</strong> &gt; <strong>Accès général</strong> &gt; <strong>"Tous les utilisateurs disposant du lien"</strong>.</li>
                        <li>Vérifiez que la première feuille est nommée "Planning" et contient les colonnes : <strong className="font-mono">Date, Orateur, Congrégation, N° Discours, Thème</strong>.</li>
                        <li>Cliquez sur le bouton "Synchroniser" pour importer les dernières visites.</li>
                    </ol>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                 {lastSync && (
                    <p className="text-xs text-text-muted dark:text-text-muted-dark">
                        Dernière synchro: {new Date(lastSync).toLocaleString('fr-FR')}
                    </p>
                )}
                <button onClick={handleSync} disabled={isSyncing || !isOnline} className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95">
                    {isSyncing ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <CloudArrowDownIcon className="w-5 h-5 mr-2" />}
                    {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                </button>
            </div>
            {!isOnline && <p className="text-right text-xs text-amber-600 dark:text-amber-400 mt-2">La synchronisation est désactivée en mode hors ligne.</p>}
        </div>
    );
};

const SecurityContent: React.FC = () => {
    const { isEncrypted, enableEncryption, disableEncryption, apiKey, updateApiKey } = useData();
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [promptMode, setPromptMode] = useState<'setup' | 'disable'>('setup');
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);

    const isEnvKeySet = useMemo(() => (typeof process !== 'undefined' && !!process.env?.API_KEY), []);

    useEffect(() => {
        setKeyInput(apiKey);
    }, [apiKey]);

    const handleKeySave = () => {
        if (isEnvKeySet) return;
        updateApiKey(keyInput);
    };

    const handleEnableClick = () => {
        setPromptMode('setup');
        setIsPromptOpen(true);
    };

    const handleDisableClick = () => {
        setPromptMode('disable');
        setIsPromptOpen(true);
    };

    const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
        active ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                <LockClosedIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Chiffrement activé</span>
            </div>
        ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                <LockOpenIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Chiffrement désactivé</span>
            </div>
        )
    );

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <StatusBadge active={isEncrypted} />
                   <p className="text-sm text-text-muted dark:text-text-muted-dark mt-2 max-w-md">
                        {isEncrypted 
                            ? "Vos données sont protégées. Un mot de passe est requis à chaque ouverture de l'application."
                            : "Vos données sont stockées en clair. Activez le chiffrement pour plus de sécurité."
                        }
                   </p>
                </div>
                {isEncrypted ? (
                     <button onClick={handleDisableClick} className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-transform active:scale-95">
                        Désactiver
                    </button>
                ) : (
                     <button onClick={handleEnableClick} className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-transform active:scale-95">
                        Activer le chiffrement
                    </button>
                )}
            </div>
            
            <div className="pt-4 mt-4 border-t border-border-light dark:border-border-dark">
                <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-2">Clé API Gemini</h3>
                <p className="text-sm text-text-muted dark:text-text-muted-dark mb-4">
                    Une clé API est requise pour les fonctionnalités d'IA (suggestions, analyse, etc.). Vous pouvez en obtenir une gratuitement sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-secondary hover:underline">Google AI Studio</a>.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <div className="relative flex-grow w-full">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder={isEnvKeySet ? "Clé API définie par l'environnement" : "Collez votre clé API ici"}
                            className="w-full pl-3 pr-10 py-2 border border-border-light dark:border-border-dark rounded-md focus:ring-secondary focus:border-secondary bg-card-light dark:bg-primary-light/10 disabled:opacity-50"
                            disabled={isEnvKeySet}
                        />
                        <button type="button" onClick={() => setShowKey(!showKey)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted dark:text-text-muted-dark">
                            {showKey ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    <button
                        onClick={handleKeySave}
                        disabled={isEnvKeySet}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SaveIcon className="w-5 h-5"/>
                        Enregistrer
                    </button>
                </div>
                 {isEnvKeySet && (
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Note: Une clé API est définie dans l'environnement et sera utilisée en priorité. Elle ne peut pas être modifiée ici.
                    </div>
                )}
            </div>

            {isPromptOpen && (
                <EncryptionPrompt
                    mode={promptMode}
                    onClose={() => setIsPromptOpen(false)}
                    onSetPassword={async (pass) => {
                        const success = await enableEncryption(pass);
                        if (success) setIsPromptOpen(false);
                        return success;
                    }}
                    onDisable={async (pass) => {
                        const success = await disableEncryption(pass);
                        if (success) setIsPromptOpen(false);
                        return success;
                    }}
                />
            )}
        </>
    );
};

const DataManagementContent: React.FC<Omit<SettingsProps, 'onLeaveFeedback' | 'archiveSectionRef'>> = ({ onImport, onResetData, isImporting }) => {
    const { exportData, appData } = useData();
    const [usage, setUsage] = useState({ bytes: 0, percent: 0 });
    const QUOTA = 50 * 1024 * 1024; // 50MB

    useEffect(() => {
        if (appData) {
            const dataString = JSON.stringify(appData);
            const bytes = new TextEncoder().encode(dataString).length;
            setUsage({
                bytes: bytes,
                percent: (bytes / QUOTA) * 100,
            });
        }
    }, [appData]);

    const usageMB = (usage.bytes / 1024 / 1024).toFixed(2);
    const quotaMB = (QUOTA / 1024 / 1024).toFixed(2);
    
    let progressBarColor = 'bg-green-500';
    if (usage.percent > 90) {
        progressBarColor = 'bg-red-500';
    } else if (usage.percent > 75) {
        progressBarColor = 'bg-amber-500';
    }

    return (
        <div className="space-y-6">
            {/* Espace de stockage */}
            <div>
                <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-2">Espace de stockage</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center font-semibold">
                        <span>Espace utilisé</span>
                        <span>{usageMB} Mo / {quotaMB} Mo</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-primary-light/20 rounded-full h-2.5">
                        <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(usage.percent, 100)}%` }}></div>
                    </div>
                    {usage.percent > 75 && (
                        <div className={`p-3 rounded-md text-sm flex items-start space-x-3 ${usage.percent > 90 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}>
                            <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>Attention :</strong> L'espace de stockage est presque plein.
                                Si le stockage est plein, vos nouvelles données ne seront pas sauvegardées.
                            </p>
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold mt-4">Comment libérer de l'espace ?</h4>
                        <ul className="list-disc pl-5 mt-2 text-sm text-text-muted dark:text-text-muted-dark space-y-1">
                            <li>Supprimez les photos des orateurs et contacts d'accueil qui ne sont plus nécessaires.</li>
                            <li>Dans les visites programmées, supprimez les pièces jointes (PDF) qui ne sont plus utiles.</li>
                            <li>Archivez les visites terminées pour alléger la liste active.</li>
                            <li>Supprimez définitivement les visites très anciennes depuis l'archive.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Sauvegarde et Restauration */}
            <div>
                <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-2">Sauvegarde et Restauration</h3>
                <p className="text-sm text-text-muted dark:text-text-muted-dark mb-4">
                    Il est recommandé de faire des sauvegardes régulières. Le fichier sera enregistré dans votre dossier de téléchargements.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={exportData} className="flex flex-col items-center justify-center text-center p-4 bg-gray-100 dark:bg-primary-light/10 rounded-lg hover:bg-gray-200 dark:hover:bg-primary-light/20 transition-colors">
                        <DownloadIcon className="w-8 h-8 mb-2 text-secondary" />
                        <span className="font-semibold">Télécharger la sauvegarde</span>
                        <span className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Enregistrer toutes les données dans un fichier.</span>
                    </button>
                    <label htmlFor="import-file" className="flex flex-col items-center justify-center text-center p-4 bg-gray-100 dark:bg-primary-light/10 rounded-lg hover:bg-gray-200 dark:hover:bg-primary-light/20 transition-colors cursor-pointer">
                        {isImporting ? (
                            <>
                                <SpinnerIcon className="w-8 h-8 mb-2 text-secondary" />
                                <span className="font-semibold">Importation...</span>
                            </>
                        ) : (
                            <>
                                <UploadIcon className="w-8 h-8 mb-2 text-secondary" />
                                <span className="font-semibold">Importer les données</span>
                            </>
                        )}
                         <span className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Restaurer depuis un fichier</span>
                        <input id="import-file" type="file" className="sr-only" onChange={onImport} accept=".json" disabled={isImporting} />
                    </label>
                </div>
             </div>

            {/* Zone de Danger */}
            <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Zone de Danger</h3>
                <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                         <p className="font-semibold text-red-800 dark:text-red-200">Réinitialiser l'application</p>
                         <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Efface définitivement toutes les visites, orateurs et contacts. Cette action est irréversible.
                         </p>
                    </div>
                     <button onClick={onResetData} className="w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};

const UsefulLinksContent: React.FC = () => {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1drIzPPi6AohCroSyUkF1UmMFxuEtMACBF4XATDjBOcg/edit?usp=drivesdk";
    const keaUrl = "https://jw.org/kea";

    return (
        <div className="space-y-4">
            <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-4 bg-gray-100 dark:bg-primary-light/10 rounded-lg hover:bg-gray-200 dark:hover:bg-primary-light/20 transition-colors"
            >
                <ExternalLinkIcon className="w-6 h-6 mr-3 text-green-600" />
                <span className="font-semibold">Ouvrir le Google Sheet de suivi</span>
            </a>
            <a
                href={keaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-4 bg-gray-100 dark:bg-primary-light/10 rounded-lg hover:bg-gray-200 dark:hover:bg-primary-light/20 transition-colors"
            >
                <ExternalLinkIcon className="w-6 h-6 mr-3 text-blue-600" />
                <span className="font-semibold">Accéder à jw.org/kea</span>
            </a>
        </div>
    );
};

const MaintenanceContent: React.FC = () => {
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const { removeDuplicateArchivedVisits, removeDuplicateVisits, cleanDuplicateVisitsByDate } = useData();

    const handleCleanPlanning = () => {
        // D'abord nettoyer les doublons par date (problème Google Sheets)
        cleanDuplicateVisitsByDate();
        // Ensuite nettoyer les doublons traditionnels (nom + date)
        setTimeout(() => {
            removeDuplicateVisits();
        }, 1000); // Attendre 1 seconde entre les deux nettoyages
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <p className="font-semibold text-text-main dark:text-text-main-dark">Rechercher les doublons d'orateurs et contacts</p>
                   <p className="text-sm text-text-muted dark:text-text-muted-dark mt-1 max-w-md">
                        Analysez vos listes d'orateurs et de contacts d'accueil pour trouver et fusionner les entrées en double.
                   </p>
                </div>
                <button onClick={() => setIsDuplicateModalOpen(true)} className="flex-shrink-0 px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-transform active:scale-95">
                    Lancer la recherche
                </button>
            </div>

            <div className="border-t border-border-light dark:border-border-dark pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                       <p className="font-semibold text-text-main dark:text-text-main-dark">Supprimer les doublons d'archives</p>
                       <p className="text-sm text-text-muted dark:text-text-muted-dark mt-1 max-w-md">
                            Si vous voyez des visites en double dans l'archive, utilisez ce bouton pour les supprimer automatiquement.
                       </p>
                    </div>
                    <button onClick={removeDuplicateArchivedVisits} className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-transform active:scale-95">
                        Nettoyer les archives
                    </button>
                </div>
            </div>

            <div className="border-t border-border-light dark:border-border-dark pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                       <p className="font-semibold text-text-main dark:text-text-main-dark">Supprimer les doublons du planning</p>
                       <p className="text-sm text-text-muted dark:text-text-muted-dark mt-1 max-w-md">
                            Nettoie tous les types de doublons : visites multiples par date (problème Google Sheets) et doublons traditionnels (même orateur, même date).
                       </p>
                    </div>
                    <button onClick={handleCleanPlanning} className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-transform active:scale-95">
                        Nettoyer le planning
                    </button>
                </div>
            </div>

            {isDuplicateModalOpen && (
                <DuplicateFinderModal 
                    isOpen={isDuplicateModalOpen} 
                    onClose={() => setIsDuplicateModalOpen(false)} 
                />
            )}
        </div>
    );
};

export const Settings: React.FC<SettingsProps> = ({ onImport, onResetData, isImporting, onLeaveFeedback, archiveSectionRef }) => {
    const { syncWithGoogleSheet, archivedVisits } = useData();
    return (
        <div className="space-y-6">
            <SettingsSection title="Profil de la Congrégation" description="Personnalisez les informations de l'application." icon={PodiumIcon}>
                <CongregationProfileContent />
            </SettingsSection>

            <SettingsSection title="Modèles de Messages" description="Personnalisez les messages par défaut pour l'envoi." icon={EnvelopeIcon}>
                <TemplateEditorContent />
            </SettingsSection>

            <SettingsSection title="Synchronisation Google Sheets" description="Importez et mettez à jour les visites depuis un Google Sheet." icon={CloudArrowDownIcon}>
                <GoogleSheetsContent onSync={syncWithGoogleSheet} />
            </SettingsSection>

            <SettingsSection title="Sécurité et Confidentialité" description="Protégez vos données avec un mot de passe." icon={ShieldCheckIcon}>
                <SecurityContent />
            </SettingsSection>

            <SettingsSection title="Maintenance" description="Outils pour maintenir la qualité des données." icon={SparklesIcon}>
                 <MaintenanceContent />
            </SettingsSection>

            <SettingsSection title="Gestion des données" description="Sauvegardez, restaurez ou réinitialisez les données." icon={DownloadIcon}>
                <DataManagementContent onImport={onImport} onResetData={onResetData} isImporting={isImporting} />
            </SettingsSection>

            <SettingsSection title="Liens Utiles" description="Accédez rapidement à vos ressources externes." icon={BookOpenIcon}>
                <UsefulLinksContent />
            </SettingsSection>
            
            <SettingsSection containerRef={archiveSectionRef} title="Archive des visites" description={`Consultez l'historique des visites terminées (${archivedVisits.length}).`} icon={ClockIcon}>
                <ArchivedVisits onLeaveFeedback={onLeaveFeedback} />
            </SettingsSection>
        </div>
    );
};