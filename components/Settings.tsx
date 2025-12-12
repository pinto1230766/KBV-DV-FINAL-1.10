import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    UploadIcon, SpinnerIcon, ExclamationTriangleIcon,
    ExternalLinkIcon, ShieldCheckIcon, PodiumIcon, BookOpenIcon, ServerStackIcon, LockClosedIcon, LockOpenIcon, CloudArrowDownIcon, InformationCircleIcon, SparklesIcon, DownloadIcon, ChevronDownIcon, ClockIcon, SunIcon, MoonIcon, ComputerDesktopIcon, PaintBrushIcon, EnvelopeIcon, SaveIcon, ArrowUturnLeftIcon, MapPinIcon, EyeIcon, EyeSlashIcon, BellIcon, CogIcon, ChartBarIcon, WifiIcon, UserGroupIcon, AdjustmentsHorizontalIcon
} from './Icons';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { ArchivedVisits } from './ArchivedVisits';
import { EncryptionPrompt } from './EncryptionPrompt';
import { CongregationProfile, Visit, Language, MessageType, MessageRole } from '../types';

type MessageTemplate = {
    id: string;
    title: string;
    content: string;
    type: MessageType;
    isDefault: boolean;
};
import useOnlineStatus from '../hooks/useOnlineStatus';
import { DuplicateFinderModal } from './DuplicateFinderModal';
import { messageTemplates, hostRequestMessageTemplates } from '../constants';
import { processTemplate, validateTemplate, getAvailableVariables } from '../utils/templateProcessor';
import { validateAndRepairImportedData, createBackupBeforeImport } from '../utils/dataValidator';
import { ResetConfirmationModal } from './ResetConfirmationModal';

interface SettingsProps {
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onResetData: () => Promise<void>;
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
            <div
                className="p-4 cursor-pointer flex justify-between items-center"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
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
    processTemplate?: (template: string) => string;
}> = ({ title, template, onSave, onRestore, isCustom, processTemplate }) => {
    const [text, setText] = useState(template);
    const [showPreview, setShowPreview] = useState(false);
    const [showVariables, setShowVariables] = useState(false);
    const { addToast } = useToast();
    const confirm = useConfirm();
    const isDirty = text !== template;
    const validationIssues = validateTemplate(text);
    const availableVariables = getAvailableVariables();

    useEffect(() => {
        setText(template);
    }, [template]);

    const handleSave = async () => {
        if (validationIssues.length > 0) {
            addToast(`Erreurs dans le modèle: ${validationIssues.join(', ')}`, 'error');
            return;
        }
        
        try {
            await onSave(text);
            addToast('Modèle sauvegardé avec succès', 'success');
        } catch (error) {
            addToast('Erreur lors de la sauvegarde', 'error');
        }
    };

    const handleRestore = async () => {
        const confirmed = await confirm('Êtes-vous sûr de vouloir restaurer le modèle par défaut ?');
        if (!confirmed) return;
        
        try {
            await onRestore();
            addToast('Modèle par défaut restauré', 'info');
        } catch (error) {
            addToast('Erreur lors de la restauration', 'error');
        }
    };

    return (
        <div className="p-4 bg-gray-50 dark:bg-primary-light/10 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-text-main dark:text-text-main-dark">{title}</h4>
                <div className="flex items-center gap-2">
                    <button 
                        type="button" 
                        onClick={() => setShowVariables(!showVariables)} 
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4"/> Variables
                    </button>
                    {processTemplate && (
                        <button 
                            type="button" 
                            onClick={() => setShowPreview(!showPreview)} 
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                            <EyeIcon className="w-4 h-4"/> {showPreview ? 'Masquer' : 'Aperçu'}
                        </button>
                    )}
                    {isCustom && (
                        <button type="button" onClick={handleRestore} className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 hover:underline">
                            <ArrowUturnLeftIcon className="w-4 h-4" /> Rétablir
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={handleSave} 
                        disabled={!isDirty || validationIssues.length > 0} 
                        className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 ${
                            validationIssues.length > 0 
                                ? 'bg-red-600 text-white' 
                                : 'bg-primary text-white'
                        }`}
                    >
                        <SaveIcon className="w-4 h-4"/> 
                        {validationIssues.length > 0 ? 'Erreurs' : 'Enregistrer'}
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {validationIssues.length > 0 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">Erreurs détectées :</p>
                        <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
                            {validationIssues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {showVariables && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <h5 className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-300">Variables disponibles :</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {Object.entries(availableVariables).map(([variable, description]) => (
                                <div key={variable} className="flex items-center gap-2">
                                    <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs font-mono">
                                        {'{' + variable + '}'}
                                    </code>
                                    <span className="text-blue-600 dark:text-blue-400">{description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className={`w-full p-2 border rounded-md bg-card-light dark:bg-card-dark font-mono text-sm ${
                        validationIssues.length > 0 
                            ? 'border-red-300 dark:border-red-700' 
                            : 'border-border-light dark:border-border-dark'
                    }`}
                    placeholder="Saisissez votre modèle de message ici..."
                />
                
                {showPreview && processTemplate && (
                    <div className="border-t pt-3">
                        <h5 className="text-sm font-medium mb-2 text-text-muted dark:text-text-muted-dark">Aperçu avec variables remplacées :</h5>
                        <div className="p-3 bg-white dark:bg-gray-800 border rounded-md text-sm whitespace-pre-wrap">
                            {processTemplate(text)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TemplateEditorContent: React.FC = () => {
    const { customTemplates, customHostRequestTemplates, saveCustomTemplate, deleteCustomTemplate, saveCustomHostRequestTemplate, deleteCustomHostRequestTemplate } = useData();
    const { settings } = useSettings();
    const { addToast } = useToast();
    const confirm = useConfirm();
    const language = settings.language;
    const [previewData, setPreviewData] = useState({
        speakerName: 'João Silva',
        hostName: 'Maria Santos',
        visitDate: '15 janvier 2024',
        visitTime: '14:30',
        hospitalityOverseer: 'Francisco Pinto',
        hospitalityOverseerPhone: '+33777388914'
    });
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    
    // Validation des templates
    const validateTemplateContent = (content: string) => {
        const errors: string[] = [];
        
        // Vérification des variables non fermées
        const openVars = content.match(/\{[^{}]*$/g);
        if (openVars) {
            errors.push('Variable non fermée détectée. Assurez-vous que toutes les accolades sont correctement fermées.');
        }
        
        // Vérification des variables inconnues
        const allowedVars = ['speakerName', 'hostName', 'visitDate', 'visitTime', 'hospitalityOverseer', 'hospitalityOverseerPhone'];
        const usedVars = content.match(/\{([^}]+)\}/g) || [];
        const unknownVars = usedVars
            .map(v => v.replace(/[{}]/g, ''))
            .filter(v => !allowedVars.includes(v));
            
        if (unknownVars.length > 0) {
            errors.push(`Variables inconnues détectées : ${unknownVars.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    };
    
    // Gestion de la sauvegarde avec validation
    const handleSaveTemplate = async (type: MessageType, role: MessageRole, content: string) => {
        const validation = validateTemplateContent(content);
        if (!validation.isValid) {
            addToast(`Erreur de validation : ${validation.errors[0]}`, 'error');
            return false;
        }
        
        try {
            await saveCustomTemplate(language, type, role, content);
            addToast('Modèle enregistré avec succès', 'success');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde :', error);
            addToast('Erreur lors de la sauvegarde du modèle', 'error');
            return false;
        }
    };
    
    // Gestion de la restauration avec confirmation
    const handleRestoreTemplate = async (type: MessageType, role: MessageRole) => {
        if (await confirm('Êtes-vous sûr de vouloir restaurer le modèle par défaut ?')) {
            try {
                await deleteCustomTemplate(language, type, role);
                addToast('Modèle restauré avec succès', 'success');
                return true;
            } catch (error) {
                console.error('Erreur lors de la restauration :', error);
                addToast('Erreur lors de la restauration du modèle', 'error');
                return false;
            }
        }
        return false;
    };

    // Gestion de la restauration des modèles de demande d'accueil
    const handleRestoreHostRequestTemplate = async (type: 'singular' | 'plural') => {
        const confirmed = await confirm('Êtes-vous sûr de vouloir restaurer le modèle par défaut ?');
        if (!confirmed) return;
        
        try {
            await deleteCustomHostRequestTemplate(language, type);
            addToast('Modèle restauré avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la restauration :', error);
            addToast('Erreur lors de la restauration du modèle', 'error');
        }
    };

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

    const processTemplatePreview = useCallback((template: string): string => {
        return processTemplate(template, {
            ...previewData,
            firstTimeIntroduction: '\n\nC\'est la première fois que nous nous contactons.',
            hostPhone: '+33612345678',
            hostAddress: '123 Rue Example, Lyon',
            speakerPhone: '+33687654321',
            visitList: '1. **João Silva** (Porto KBV)\n   📅 15 janvier 2024 à 14:30\n   📞 +33687654321'
        });
    }, [previewData]);

    const visitMessageTypes: { type: MessageType, label: string }[] = [
        { type: 'confirmation', label: 'Confirmation' },
        { type: 'preparation', label: 'Préparation' },
        { type: 'reminder-7', label: 'Rappel J-7' },
        { type: 'reminder-2', label: 'Rappel J-2' },
        { type: 'thanks', label: 'Remerciements' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm text-text-muted dark:text-text-muted-dark">
                    <p>Les modèles sont affichés pour la langue sélectionnée dans les paramètres de l'interface (<span className="font-semibold">{language === 'fr' ? 'Français' : language === 'cv' ? 'Cap-verdien' : language === 'en' ? 'Anglais' : 'Espagnol'}</span>).</p>
                    <p className="text-xs mt-1">Variables disponibles : {'{speakerName}'}, {'{hostName}'}, {'{visitDate}'}, {'{visitTime}'}, {'{hospitalityOverseer}'}, {'{hospitalityOverseerPhone}'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => {
                            const templates = { customTemplates, customHostRequestTemplates };
                            const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `message-templates-${new Date().toISOString().slice(0, 10)}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            addToast('Modèles exportés', 'success');
                        }}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-1"
                    >
                        <DownloadIcon className="w-4 h-4"/> Exporter
                    </button>
                    <label className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 cursor-pointer">
                        <UploadIcon className="w-4 h-4"/> Importer
                        <input
                            type="file"
                            accept=".json"
                            className="sr-only"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        try {
                                            const imported = JSON.parse(event.target?.result as string);
                                            if (imported.customTemplates) {
                                                Object.entries(imported.customTemplates).forEach(([lang, templates]: [string, any]) => {
                                                    Object.entries(templates).forEach(([type, typeTemplates]: [string, any]) => {
                                                        Object.entries(typeTemplates).forEach(([role, template]: [string, any]) => {
                                                            saveCustomTemplate(lang as Language, type as MessageType, role as MessageRole, template);
                                                        });
                                                    });
                                                });
                                            }
                                            if (imported.customHostRequestTemplates) {
                                                Object.entries(imported.customHostRequestTemplates).forEach(([lang, templates]: [string, any]) => {
                                                    Object.entries(templates).forEach(([type, template]: [string, any]) => {
                                                        saveCustomHostRequestTemplate(lang as Language, type as 'singular' | 'plural', template);
                                                    });
                                                });
                                            }
                                            addToast('Modèles importés avec succès', 'success');
                                        } catch (error) {
                                            addToast('Erreur lors de l\'importation', 'error');
                                        }
                                    };
                                    reader.readAsText(file);
                                }
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>
            </div>
            
            <div className="text-xs text-text-muted dark:text-text-muted-dark bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p className="font-medium mb-1">📝 Conseils d'utilisation :</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>💾 Les modifications sont automatiquement sauvegardées</li>
                    <li>👁️ Utilisez l'aperçu pour voir le rendu final avec les variables</li>
                    <li>📁 Exportez vos modèles pour les sauvegarder ou les partager</li>
                    <li>⚠️ Les variables en rouge indiquent des erreurs de syntaxe</li>
                </ul>
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
                                    onRestore={() => handleRestoreTemplate(type, 'speaker')}
                                    processTemplate={processTemplatePreview}
                                />
                                <TemplateItem
                                    title="Pour l'accueil"
                                    template={getVisitTemplate(type, 'host').template}
                                    isCustom={getVisitTemplate(type, 'host').isCustom}
                                    onSave={(text) => saveCustomTemplate(language, type, 'host', text)}
                                    onRestore={() => handleRestoreTemplate(type, 'host')}
                                    processTemplate={processTemplatePreview}
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
                        onRestore={() => handleRestoreHostRequestTemplate('singular')}
                        processTemplate={processTemplatePreview}
                    />
                    <TemplateItem
                        title="Modèle pour plusieurs personnes"
                        template={getHostRequestTemplate('plural').template}
                        isCustom={getHostRequestTemplate('plural').isCustom}
                        onSave={(text) => saveCustomHostRequestTemplate(language, 'plural', text)}
                        onRestore={() => handleRestoreHostRequestTemplate('plural')}
                        processTemplate={processTemplatePreview}
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
    const { addToast } = useToast();
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [promptMode, setPromptMode] = useState<'setup' | 'disable'>('setup');
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    
    // Paramètres de sécurité locaux
    const [securitySettings, setSecuritySettings] = useState(() => {
        const stored = localStorage.getItem('securitySettings');
        return stored ? JSON.parse(stored) : {
            autoLockTimeout: 30,
            requirePasswordOnStart: true,
            encryptSensitiveData: true,
            clearClipboardAfter: 30,
            hidePhoneNumbers: false,
            hideAddresses: false,
            logSecurityEvents: true,
            allowScreenshots: true,
            sessionTimeout: 120
        };
    });

    const isEnvKeySet = useMemo(() => (typeof process !== 'undefined' && !!process.env?.API_KEY), []);

    useEffect(() => {
        setKeyInput(apiKey);
    }, [apiKey]);

    // Sauvegarder et appliquer les paramètres de sécurité
    const saveSecuritySettings = (newSettings: any) => {
        const updated = { ...securitySettings, ...newSettings };
        setSecuritySettings(updated);
        localStorage.setItem('securitySettings', JSON.stringify(updated));
        
        // Appliquer les paramètres immédiatement
        applySecuritySettings(updated);
        addToast('Paramètres de sécurité appliqués', 'success');
    };

    // Appliquer les paramètres de sécurité
    const applySecuritySettings = (settings: any) => {
        // Masquer les captures d'écran
        if (!settings.allowScreenshots) {
            document.body.style.setProperty('-webkit-user-select', 'none');
            document.body.style.setProperty('user-select', 'none');
        } else {
            document.body.style.removeProperty('-webkit-user-select');
            document.body.style.removeProperty('user-select');
        }

        // Configurer le timeout de session
        if (settings.sessionTimeout > 0) {
            localStorage.setItem('sessionTimeout', settings.sessionTimeout.toString());
        }
    };

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
            
            {/* Paramètres de confidentialité */}
            <div className="pt-6 mt-6 border-t border-border-light dark:border-border-dark">
                <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-4">Paramètres de confidentialité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={securitySettings.hidePhoneNumbers} 
                                onChange={(e) => saveSecuritySettings({ hidePhoneNumbers: e.target.checked })}
                                className="rounded" 
                            />
                            <span className="text-sm">Masquer les numéros de téléphone</span>
                        </label>
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 ml-6">Affiche ****1234 au lieu du numéro complet</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={securitySettings.hideAddresses} 
                                onChange={(e) => saveSecuritySettings({ hideAddresses: e.target.checked })}
                                className="rounded" 
                            />
                            <span className="text-sm">Masquer les adresses</span>
                        </label>
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 ml-6">Masque les numéros de rue</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={securitySettings.allowScreenshots} 
                                onChange={(e) => saveSecuritySettings({ allowScreenshots: e.target.checked })}
                                className="rounded" 
                            />
                            <span className="text-sm">Autoriser les captures d'écran</span>
                        </label>
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 ml-6">Désactiver pour plus de sécurité</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                checked={securitySettings.logSecurityEvents} 
                                onChange={(e) => saveSecuritySettings({ logSecurityEvents: e.target.checked })}
                                className="rounded" 
                            />
                            <span className="text-sm">Journaliser les événements de sécurité</span>
                        </label>
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 ml-6">Enregistre les tentatives d'accès</p>
                    </div>
                </div>
            </div>
            
            {/* Paramètres de session */}
            <div className="pt-6 mt-6 border-t border-border-light dark:border-border-dark">
                <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-4">Gestion de session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Verrouillage automatique (minutes)</label>
                    <input
                        type="number"
                        id="autoLockTimeout"
                        name="autoLockTimeout"
                        aria-label="Délai de verrouillage automatique en minutes"
                        title="Délai de verrouillage automatique en minutes"
                        placeholder="Entrez le délai en minutes"
                        value={securitySettings.autoLockTimeout}
                        onChange={(e) => saveSecuritySettings({ autoLockTimeout: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-lg"
                        min="5"
                        max="120"
                    />
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">0 = désactivé</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Timeout de session (minutes)</label>
                        <input
                            type="number"
                            id="sessionTimeout"
                            name="sessionTimeout"
                            aria-label="Délai d'expiration de la session en minutes"
                            title="Délai d'expiration de la session en minutes"
                            placeholder="Entrez le délai en minutes"
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => saveSecuritySettings({ sessionTimeout: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded-lg"
                            min="30"
                            max="480"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Effacer le presse-papiers après (secondes)</label>
                        <input
                            type="number"
                            id="clearClipboardAfter"
                            name="clearClipboardAfter"
                            aria-label="Délai de vidage du presse-papiers en secondes"
                            title="Délai de vidage du presse-papiers en secondes"
                            placeholder="Entrez le délai en secondes"
                            value={securitySettings.clearClipboardAfter}
                            onChange={(e) => saveSecuritySettings({ clearClipboardAfter: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded-lg"
                            min="0"
                            max="300"
                        />
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">0 = jamais</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="requirePasswordOnStart"
                                name="requirePasswordOnStart"
                                aria-label="Mot de passe requis au démarrage"
                                checked={securitySettings.requirePasswordOnStart}
                                onChange={(e) => saveSecuritySettings({ requirePasswordOnStart: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="requirePasswordOnStart" className="text-sm cursor-pointer">Mot de passe requis au démarrage</label>
                        </label>
                    </div>
                </div>
            </div>
            
            <div className="pt-6 mt-6 border-t border-border-light dark:border-border-dark">
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
    const { exportData, appData, importData } = useData();
    const { addToast } = useToast();
    const [usage, setUsage] = useState({ bytes: 0, percent: 0 });
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isImportingLocal, setIsImportingLocal] = useState(false);
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

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImportingLocal(true);
        
        try {
            const backupKey = createBackupBeforeImport(appData);
            addToast('Sauvegarde de sécurité créée', 'info');

            const text = await file.text();
            const data = JSON.parse(text);
            
            const validation = validateAndRepairImportedData(data);
            
            if (!validation.isValid) {
                throw new Error(`Fichier invalide: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                addToast(`Import avec avertissements: ${validation.warnings.length} problème(s) corrigé(s)`, 'warning', 8000);
            }

            await importData(validation.repairedData!);
            addToast('Données importées avec succès', 'success');
            
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            addToast(`Échec de l'import: ${message}`, 'error', 10000);
        } finally {
            setIsImportingLocal(false);
            event.target.value = '';
        }
    };

    const handleResetConfirm = async () => {
        await onResetData();
        setIsResetModalOpen(false);
    };

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
                        <div className={`${progressBarColor} h-2.5 rounded-full w-[${Math.min(usage.percent, 100)}%]`}></div>
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
                        {isImportingLocal ? (
                            <>
                                <SpinnerIcon className="w-8 h-8 mb-2 text-secondary" />
                                <span className="font-semibold">Importation...</span>
                                <span className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Validation et réparation en cours</span>
                            </>
                        ) : (
                            <>
                                <UploadIcon className="w-8 h-8 mb-2 text-secondary" />
                                <span className="font-semibold">Importer les données</span>
                                <span className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Restaurer depuis un fichier (avec validation)</span>
                            </>
                        )}
                        <input id="import-file" type="file" className="sr-only" onChange={handleImportFile} accept=".json" disabled={isImportingLocal} />
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
                     <button onClick={() => setIsResetModalOpen(true)} className="w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        Réinitialiser
                    </button>
                </div>
            </div>
            
            {/* Informations sur la sauvegarde automatique */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Conseils de sauvegarde</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Effectuez une sauvegarde avant toute modification importante</li>
                    <li>L'import crée automatiquement une sauvegarde de sécurité</li>
                    <li>Les fichiers corrompus sont automatiquement réparés lors de l'import</li>
                    <li>Conservez plusieurs sauvegardes à différentes dates</li>
                </ul>
            </div>
            
            <ResetConfirmationModal 
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetConfirm}
            />
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

            {/* Nouvelles sections */}
            <SettingsSection title="Personnalisation de l'interface" description="Configurez l'apparence et le comportement de l'application." icon={PaintBrushIcon}>
                <InterfaceCustomizationContent />
            </SettingsSection>

            <SettingsSection title="Notifications et Rappels" description="Gérez les alertes et les rappels automatiques." icon={BellIcon}>
                <NotificationSettingsContent />
            </SettingsSection>

            <SettingsSection title="Paramètres avancés" description="Options techniques pour les utilisateurs expérimentés." icon={CogIcon}>
                <AdvancedSettingsContent />
            </SettingsSection>

            <SettingsSection title="Tableau de bord et Statistiques" description="Personnalisez l'affichage des données et des rapports." icon={ChartBarIcon}>
                <DashboardSettingsContent />
            </SettingsSection>

            <SettingsSection title="Configuration IA et Automatisation" description="Gérez les fonctionnalités d'intelligence artificielle." icon={SparklesIcon}>
                <AISettingsContent />
            </SettingsSection>

            <SettingsSection title="Connectivité et Réseau" description="Paramètres de synchronisation et de gestion réseau." icon={WifiIcon}>
                <ConnectivitySettingsContent />
            </SettingsSection>

            <SettingsSection title="Communication avancée" description="Configuration avancée des messages et communications." icon={EnvelopeIcon}>
                <AdvancedCommunicationContent />
            </SettingsSection>
        </div>
    );
};

import { useSettings } from '../contexts/SettingsContext';
import { Switch } from '@headlessui/react';

type Theme = 'light' | 'dark' | 'auto';
type FontSize = 'small' | 'medium' | 'large';

// Composants pour les nouvelles sections
const InterfaceCustomizationContent: React.FC = () => {
    const { addToast } = useToast();
    const { settings, setTheme, setFontSize, setLanguage, setAnimations, setCompactMode } = useSettings();
    
    // Charger les paramètres sauvegardés au montage
    useEffect(() => {
        const savedSettings = localStorage.getItem('interfaceSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.theme) setTheme(parsed.theme);
                if (parsed.fontSize) setFontSize(parsed.fontSize);
                if (parsed.language) setLanguage(parsed.language);
                if (parsed.animations !== undefined) setAnimations(parsed.animations);
                if (parsed.compactMode !== undefined) setCompactMode(parsed.compactMode);
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres:', error);
            }
        }
    }, []);
    
    // Sauvegarder les paramètres à chaque modification
    useEffect(() => {
        const settingsToSave = {
            theme: settings.theme,
            fontSize: settings.fontSize,
            language: settings.language,
            animations: settings.animations,
            compactMode: settings.compactMode
        };
        
        localStorage.setItem('interfaceSettings', JSON.stringify(settingsToSave));
    }, [settings]);
    
    const handleThemeChange = (theme: Theme) => {
        setTheme(theme);
        addToast(`Thème ${theme} appliqué`, 'info');
    };
    
    const handleFontSizeChange = (size: FontSize) => {
        setFontSize(size);
        addToast(`Taille de police ${size} appliquée`, 'info');
    };
    
    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        addToast(`Langue définie sur ${lang === 'fr' ? 'Français' : 'Cap-verdien'}`, 'info');
    };
    
    const handleCompactModeChange = (isCompact: boolean) => {
        setCompactMode(isCompact);
        addToast(`Mode ${isCompact ? 'compact' : 'normal'} activé`, 'info');
    };
    
    const handleAnimationsChange = (enabled: boolean) => {
        setAnimations(enabled);
        addToast(`Animations ${enabled ? 'activées' : 'désactivées'}`, 'info');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Thème visuel</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => handleThemeChange('light')}
                            className={`p-3 rounded-lg border-2 transition-all ${settings.theme === 'light' ? 'border-primary bg-primary/10' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}
                            title="Thème clair"
                        >
                            <div className="h-3 bg-white rounded-sm shadow-inner"></div>
                            <div className="mt-1 text-xs text-center">Clair</div>
                        </button>
                        <button 
                            onClick={() => handleThemeChange('dark')}
                            className={`p-3 rounded-lg border-2 transition-all ${settings.theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}
                            title="Thème sombre"
                        >
                            <div className="h-3 bg-gray-800 rounded-sm shadow-inner"></div>
                            <div className="mt-1 text-xs text-center">Sombre</div>
                        </button>
                        <button 
                            onClick={() => handleThemeChange('auto')}
                            className={`p-3 rounded-lg border-2 transition-all ${settings.theme === 'auto' ? 'border-primary bg-primary/10' : 'border-border-light dark:border-border-dark hover:border-primary/50'}`}
                            title="Automatique (système)"
                        >
                            <div className="h-3 bg-gradient-to-r from-white to-gray-800 rounded-sm shadow-inner"></div>
                            <div className="mt-1 text-xs text-center">Auto</div>
                        </button>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Taille du texte</label>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleFontSizeChange('small')}
                            className={`flex-1 py-2 rounded-lg border transition-all ${settings.fontSize === 'small' ? 'border-primary bg-primary/10 text-primary' : 'border-border-light dark:border-border-dark'}`}
                        >
                            <span className="text-xs">A</span>
                        </button>
                        <button 
                            onClick={() => handleFontSizeChange('medium')}
                            className={`flex-1 py-2 rounded-lg border transition-all ${settings.fontSize === 'medium' ? 'border-primary bg-primary/10 text-primary' : 'border-border-light dark:border-border-dark'}`}
                        >
                            <span className="text-base">A</span>
                        </button>
                        <button 
                            onClick={() => handleFontSizeChange('large')}
                            className={`flex-1 py-2 rounded-lg border transition-all ${settings.fontSize === 'large' ? 'border-primary bg-primary/10 text-primary' : 'border-border-light dark:border-border-dark'}`}
                        >
                            <span className="text-lg font-bold">A</span>
                        </button>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Langue</label>
                    <select
                        value={settings.language}
                        onChange={(e) => handleLanguageChange(e.target.value as Language)}
                        className="w-full p-2 border rounded-lg bg-card-light dark:bg-primary-light/10 hover:border-primary/50 transition-colors"
                        aria-label="Sélectionner la langue de l'interface"
                    >
                        <option value="fr">Français</option>
                        <option value="cv">Cap-verdien</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Mode d'affichage</label>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleCompactModeChange(false)}
                            className={`flex-1 py-2 px-3 rounded-lg border transition-all ${!settings.compactMode ? 'border-primary bg-primary/10 text-primary' : 'border-border-light dark:border-border-dark'}`}
                        >
                            <span className="text-sm">Normal</span>
                        </button>
                        <button 
                            onClick={() => handleCompactModeChange(true)}
                            className={`flex-1 py-2 px-3 rounded-lg border transition-all ${settings.compactMode ? 'border-primary bg-primary/10 text-primary' : 'border-border-light dark:border-border-dark'}`}
                        >
                            <span className="text-sm">Compact</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={settings.animations}
                            onChange={handleAnimationsChange}
                            className={`${settings.animations ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        >
                            <span className="sr-only">Activer les animations</span>
                            <span
                                className={`${settings.animations ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                        <span className="text-sm font-medium">Activer les animations</span>
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Améliore l'expérience utilisateur mais peut ralentir l'application</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            // Réinitialiser tous les paramètres
                            setTheme('auto');
                            setFontSize('medium');
                            setCompactMode(false);
                            setAnimations(true);
                            addToast('Paramètres réinitialisés', 'success');
                        }}
                        className="px-3 py-1.5 text-sm text-text-muted dark:text-text-muted-dark hover:text-primary dark:hover:text-primary-light transition-colors"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
                <h4 className="font-medium mb-2">💡 Astre</h4>
                <p>Les modifications sont appliquées automatiquement. Vos préférences sont enregistrées pour votre prochaine visite.</p>
            </div>
        </div>
    );
};

const NotificationSettingsContent: React.FC = () => {
    const { settings, setNotificationSettings } = useSettings();
    const { notificationSettings } = settings;

    const handleNotificationChange = (key: keyof typeof notificationSettings, value: any) => {
        setNotificationSettings({ [key]: value } as any);
    };

    const handleQuietHoursChange = (key: keyof typeof notificationSettings.quietHours, value: any) => {
        setNotificationSettings({
            quietHours: {
                ...notificationSettings.quietHours,
                [key]: value,
            },
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Types de notifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries({
                        reminder7: 'Rappel J-7',
                        reminder2: 'Rappel J-2',
                        confirmation: 'Confirmation de visite',
                        thanks: 'Remerciements',
                        email: 'Notifications par email',
                        push: 'Notifications push'
                    }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`notification-${key}`}
                                name={`notification-${key}`}
                                aria-label={label}
                                checked={(notificationSettings as any)[key]}
                                onChange={(e) => handleNotificationChange(key as any, e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor={`notification-${key}`} className="text-sm cursor-pointer">{label}</label>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">Horaires</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Heure par défaut</label>
                        <input 
                            type="time" 
                            id="notification-time"
                            name="notificationTime"
                            aria-label="Heure de notification par défaut"
                            title="Heure de notification par défaut"
                            value={notificationSettings.notificationTime} 
                            onChange={(e) => handleNotificationChange('notificationTime', e.target.value)} 
                            className="w-full p-2 border rounded-lg" 
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="quiet-hours-enabled"
                                name="quietHoursEnabled"
                                aria-label="Activer les heures de silence"
                                checked={notificationSettings.quietHours.enabled} 
                                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)} 
                                className="rounded" 
                            />
                            <label htmlFor="quiet-hours-enabled" className="text-sm font-medium cursor-pointer">Heures de silence</label>
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="time" 
                                id="quiet-hours-start"
                                name="quietHoursStart"
                                aria-label="Heure de début des heures de silence"
                                value={notificationSettings.quietHours.start} 
                                onChange={(e) => handleQuietHoursChange('start', e.target.value)} 
                                className="flex-1 p-2 border rounded-lg" 
                                disabled={!notificationSettings.quietHours.enabled} 
                            />
                            <span className="self-center" aria-hidden="true">à</span>
                            <input 
                                type="time" 
                                id="quiet-hours-end"
                                name="quietHoursEnd"
                                aria-label="Heure de fin des heures de silence"
                                value={notificationSettings.quietHours.end} 
                                onChange={(e) => handleQuietHoursChange('end', e.target.value)} 
                                className="flex-1 p-2 border rounded-lg" 
                                disabled={!notificationSettings.quietHours.enabled} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdvancedSettingsContent: React.FC = () => {
    const { settings, setAdvancedSettings } = useSettings();
    const { addToast } = useToast();
    const { advancedSettings } = settings;

    const handleAdvancedSettingChange = (key: keyof typeof advancedSettings, value: any) => {
        setAdvancedSettings({ [key]: value } as any);
    };

    const handleClearCache = () => {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        addToast("Cache vidé", 'success');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="offline-mode"
                            name="offlineMode"
                            aria-label="Activer le mode hors-ligne"
                            checked={advancedSettings.offlineMode} 
                            onChange={(e) => handleAdvancedSettingChange('offlineMode', e.target.checked)} 
                            className="rounded" 
                        />
                        <label htmlFor="offline-mode" className="text-sm cursor-pointer">Mode hors-ligne</label>
                    </label>
                    <p className="text-xs text-text-muted mt-1">Limite l'utilisation des données mobiles</p>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="debug-mode"
                            name="debugMode"
                            aria-label="Activer le mode débogage"
                            checked={advancedSettings.debugMode} 
                            onChange={(e) => handleAdvancedSettingChange('debugMode', e.target.checked)} 
                            className="rounded" 
                        />
                        <label htmlFor="debug-mode" className="text-sm cursor-pointer">Mode débogage</label>
                    </label>
                    <p className="text-xs text-text-muted mt-1">Affiche les logs détaillés</p>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="auto-backup"
                            name="autoBackup"
                            aria-label="Activer la sauvegarde automatique"
                            checked={advancedSettings.autoBackup} 
                            onChange={(e) => handleAdvancedSettingChange('autoBackup', e.target.checked)} 
                            className="rounded" 
                        />
                        <label htmlFor="auto-backup" className="text-sm cursor-pointer">Sauvegarde automatique</label>
                    </label>
                    <p className="text-xs text-text-muted mt-1">Sauvegarde quotidienne des données</p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Niveau de log</label>
                    <select 
                        id="log-level"
                        name="logLevel"
                        aria-label="Niveau de journalisation"
                        title="Niveau de journalisation"
                        value={advancedSettings.logLevel} 
                        onChange={(e) => handleAdvancedSettingChange('logLevel', e.target.value)} 
                        className="w-full p-2 border rounded-lg"
                    >
                        <option value="error">Erreur</option>
                        <option value="warn">Avertissement</option>
                        <option value="info">Info</option>
                        <option value="debug">Débogage</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={handleClearCache} 
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg"
                    aria-label="Vider le cache de l'application"
                >
                    Vider le cache
                </button>
            </div>
        </div>
    );
};

const DashboardSettingsContent: React.FC = () => {
    const { settings, setDashboardSettings } = useSettings();
    const { dashboardSettings } = settings;

    const handleDashboardSettingChange = (key: keyof typeof dashboardSettings, value: any) => {
        setDashboardSettings({ [key]: value } as any);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Période par défaut</label>
                    <select value={dashboardSettings.defaultPeriod} onChange={(e) => handleDashboardSettingChange('defaultPeriod', e.target.value)} className="w-full p-2 border rounded-lg" aria-label="Sélectionner la période par défaut pour le tableau de bord">
                        <option value="week">Semaine</option>
                        <option value="month">Mois</option>
                        <option value="quarter">Trimestre</option>
                        <option value="year">Année</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Graphique par défaut</label>
                    <select value={dashboardSettings.defaultChart} onChange={(e) => handleDashboardSettingChange('defaultChart', e.target.value)} className="w-full p-2 border rounded-lg" aria-label="Sélectionner le type de graphique par défaut">
                        <option value="bar">Barres</option>
                        <option value="line">Lignes</option>
                        <option value="pie">Camembert</option>
                        <option value="area">Aires</option>
                    </select>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="auto-refresh" name="autoRefresh" checked={dashboardSettings.autoRefresh} onChange={(e) => handleDashboardSettingChange('autoRefresh', e.target.checked)} className="rounded" aria-label="Activer l'actualisation automatique du tableau de bord" />
                        <label htmlFor="auto-refresh" className="text-sm cursor-pointer">Actualisation automatique</label>
                    </label>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Format d'export</label>
                    <select value={dashboardSettings.exportFormat} onChange={(e) => handleDashboardSettingChange('exportFormat', e.target.value)} className="w-full p-2 border rounded-lg" aria-label="Sélectionner le format d'export par défaut">
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Intervalle d'actualisation (secondes)</label>
                <input type="number" value={dashboardSettings.refreshInterval} onChange={(e) => handleDashboardSettingChange('refreshInterval', parseInt(e.target.value))} className="w-full p-2 border rounded-lg" min="30" max="3600" aria-label="Intervalle d'actualisation automatique du tableau de bord en secondes" />
            </div>
        </div>
    );
};

const AISettingsContent: React.FC = () => {
    const { settings, setAISettings } = useSettings();
    const { aiSettings } = settings;

    const handleAISettingChange = (key: keyof typeof aiSettings, value: any) => {
        setAISettings({ [key]: value } as any);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">Modèle IA</label>
                    <select value={aiSettings.model} onChange={(e) => handleAISettingChange('model', e.target.value)} className="w-full p-2 border rounded-lg" aria-label="Sélectionner le modèle d'IA à utiliser">
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Température (créativité)</label>
                    <input type="range" min="0" max="1" step="0.1" value={aiSettings.temperature} onChange={(e) => handleAISettingChange('temperature', parseFloat(e.target.value))} className="w-full" aria-label="Ajuster le niveau de créativité de l'IA" />
                    <span className="text-sm text-text-muted">{aiSettings.temperature}</span>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Tokens maximum</label>
                    <input type="number" value={aiSettings.maxTokens} onChange={(e) => handleAISettingChange('maxTokens', parseInt(e.target.value))} className="w-full p-2 border rounded-lg" min="100" max="4000" aria-label="Définir le nombre maximum de tokens pour les réponses IA" />
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="auto-generate" name="autoGenerate" checked={aiSettings.autoGenerate} onChange={(e) => handleAISettingChange('autoGenerate', e.target.checked)} className="rounded" aria-label="Activer la génération automatique de contenu par IA" />
                        <label htmlFor="auto-generate" className="text-sm cursor-pointer">Génération automatique</label>
                    </label>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="smart-suggestions" name="smartSuggestions" checked={aiSettings.smartSuggestions} onChange={(e) => handleAISettingChange('smartSuggestions', e.target.checked)} className="rounded" aria-label="Activer les suggestions intelligentes de l'IA" />
                        <label htmlFor="smart-suggestions" className="text-sm cursor-pointer">Suggestions intelligentes</label>
                    </label>
                </div>
            </div>
        </div>
    );
};

const ConnectivitySettingsContent: React.FC = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('connectivitySettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            autoSync: true,
            syncInterval: 3600,
            offlineMode: false,
            dataUsage: 'wifi',
            retryAttempts: 3
        };
    });

    const handleSave = () => {
        localStorage.setItem('connectivitySettings', JSON.stringify(settings));
        addToast("Paramètres de connectivité sauvegardés", 'success');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="auto-sync" name="autoSync" checked={settings.autoSync} onChange={(e) => setSettings({...settings, autoSync: e.target.checked})} className="rounded" aria-label="Activer la synchronisation automatique" />
                        <label htmlFor="auto-sync" className="text-sm cursor-pointer">Synchronisation automatique</label>
                    </label>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="offline-mode" name="offlineMode" checked={settings.offlineMode} onChange={(e) => setSettings({...settings, offlineMode: e.target.checked})} className="rounded" aria-label="Activer le mode hors-ligne" />
                        <label htmlFor="offline-mode" className="text-sm cursor-pointer">Mode hors-ligne</label>
                    </label>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Intervalle de sync (secondes)</label>
                    <input type="number" value={settings.syncInterval} onChange={(e) => setSettings({...settings, syncInterval: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg" min="300" max="86400" aria-label="Intervalle de synchronisation en secondes" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Utilisation des données</label>
                    <select value={settings.dataUsage} onChange={(e) => setSettings({...settings, dataUsage: e.target.value})} className="w-full p-2 border rounded-lg" aria-label="Sélectionner l'utilisation des données">
                        <option value="wifi">WiFi uniquement</option>
                        <option value="mobile">WiFi + Mobile</option>
                        <option value="unlimited">Illimité</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Tentatives de retry</label>
                    <input type="number" value={settings.retryAttempts} onChange={(e) => setSettings({...settings, retryAttempts: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg" min="1" max="10" aria-label="Nombre de tentatives de retry" />
                </div>
            </div>
            <button onClick={handleSave} className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg">
                Sauvegarder
            </button>
        </div>
    );
};

const AdvancedCommunicationContent: React.FC = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('communicationSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            emailSignature: '',
            autoReply: false,
            replyDelay: 24,
            trackOpens: true,
            customHeaders: false
        };
    });

    const handleSave = () => {
        localStorage.setItem('communicationSettings', JSON.stringify(settings));
        addToast("Paramètres de communication sauvegardés", 'success');
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Signature email</label>
                <textarea id="email-signature" name="emailSignature" value={settings.emailSignature} onChange={(e) => setSettings({...settings, emailSignature: e.target.value})} className="w-full p-2 border rounded-lg" rows={4} placeholder="Cordialement, Votre Nom" aria-label="Signature email personnalisée" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="auto-reply" name="autoReply" checked={settings.autoReply} onChange={(e) => setSettings({...settings, autoReply: e.target.checked})} className="rounded" aria-label="Activer les réponses automatiques" />
                        <label htmlFor="auto-reply" className="text-sm cursor-pointer">Réponse automatique</label>
                    </label>
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="track-opens" name="trackOpens" checked={settings.trackOpens} onChange={(e) => setSettings({...settings, trackOpens: e.target.checked})} className="rounded" aria-label="Activer le suivi des ouvertures d'email" />
                        <label htmlFor="track-opens" className="text-sm cursor-pointer">Suivi des ouvertures</label>
                    </label>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Délai de réponse (heures)</label>
                    <input type="number" id="reply-delay" name="replyDelay" value={settings.replyDelay} onChange={(e) => setSettings({...settings, replyDelay: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg" min="1" max="168" aria-label="Délai de réponse automatique en heures" />
                </div>
                <div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" id="custom-headers" name="customHeaders" checked={settings.customHeaders} onChange={(e) => setSettings({...settings, customHeaders: e.target.checked})} className="rounded" aria-label="Activer les en-têtes personnalisés" />
                        <label htmlFor="custom-headers" className="text-sm cursor-pointer">En-têtes personnalisés</label>
                    </label>
                </div>
            </div>
            <button onClick={handleSave} className="px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg">
                Sauvegarder
            </button>
        </div>
    );
};
