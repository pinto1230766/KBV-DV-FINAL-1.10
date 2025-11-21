import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateUUID } from '../utils/uuid';
import { Speaker, Visit, Host, SpecialDate, Expense } from '../types';
import { XIcon, PlusIcon, PaperclipIcon, TrashIcon, InformationCircleIcon, SparklesIcon, ExclamationTriangleIcon, SpinnerIcon, CheckIcon, ReceiptIcon, CameraIcon, EyeIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { UNASSIGNED_HOST, NO_HOST_NEEDED } from '../constants';
import { useData } from '../contexts/DataContext';
import { GoogleGenAI, Type } from '@google/genai';
import { resizeImage } from '../utils/image';

// Form Data Interface
interface VisitFormData {
    visitDate: string;
    arrivalDate: string;
    departureDate: string;
    visitTime: string;
    host: string;
    accommodation: string;
    meals: string;
    notes: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    attachments: { name: string; dataUrl: string; size: number }[];
    expenses: Expense[];
    talkNoOrType: string | null;
    talkTheme: string | null;
    locationType: 'physical' | 'zoom' | 'streaming';
    checklist: { text: string; completed: boolean }[];
}

interface AISuggestion {
  host: Host;
  reason: string;
}

const isHostAvailable = (host: Host, visitDate: string): boolean => {
    if (!visitDate || !host.unavailabilities || host.unavailabilities.length === 0) {
        return true;
    }
    const checkDate = new Date(visitDate + 'T00:00:00');
    return !host.unavailabilities.some(period => {
        const start = new Date(period.start + 'T00:00:00');
        const end = new Date(period.end + 'T00:00:00');
        return checkDate >= start && checkDate <= end;
    });
};

const detectConflicts = (speaker: Speaker, host: Host): string[] => {
    const warnings: string[] = [];
    if (!speaker || !host) return warnings;

    const speakerTags = speaker.tags?.map(t => t.toLowerCase()) || [];
    const hostTags = host.tags?.map(t => t.toLowerCase()) || [];
    const hostNotes = host.notes?.toLowerCase() || '';

    // Allergy conflicts
    if (speakerTags.includes('allergie-chat') && (hostTags.includes('chat') || hostTags.includes('animaux') || hostNotes.includes('chat'))) {
        warnings.push(`L'orateur est allergique aux chats et l'hôte possède un chat.`);
    }
    if (speakerTags.includes('allergie-animaux') && hostTags.includes('animaux')) {
        warnings.push(`L'orateur est allergique aux animaux et l'hôte en possède.`);
    }

    // Accessibility conflicts
    if (speakerTags.includes('sans escaliers') && hostTags.includes('escaliers')) {
        warnings.push(`L'orateur a besoin d'un accès sans escaliers et le logement de l'hôte en possède.`);
    }

    // Preference conflicts
    if ((speakerTags.includes('calme') || speakerTags.includes('calme souhaité')) && hostTags.includes('enfants')) {
        warnings.push(`L'orateur préfère un environnement calme et l'hôte a de jeunes enfants.`);
    }
    
    // Couple vs Single host
    if (speaker.maritalStatus === 'couple' && hostNotes.includes('orateur seul')) {
        warnings.push(`L'orateur vient en couple, mais l'accueil est noté comme "idéal pour un orateur seul".`);
    }

    // Transportation conflicts
    if (speaker.isVehiculed === false && !hostTags.includes('centre-ville') && !hostTags.includes('proche salle') && !hostNotes.includes('centre-ville') && !hostNotes.includes('sans voiture')) {
        warnings.push(`L'orateur n'est pas véhiculé et l'hôte ne semble pas être en centre-ville ou facilement accessible.`);
    }

    return warnings;
};

// Sub-component for managing expenses
const ExpenseManager: React.FC<{
    expenses: Expense[];
    onExpensesChange: (expenses: Expense[]) => void;
    visitDate: string;
}> = ({ expenses, onExpensesChange, visitDate }) => {
    const { addToast } = useToast();
    const [newExpense, setNewExpense] = useState({ date: visitDate, description: '', amount: '', category: 'transport' as Expense['category'] });
    const [receiptFile, setReceiptFile] = useState<string | null>(null);

    const totalExpenses = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addToast('Veuillez sélectionner un fichier image.', 'error');
            return;
        }

        try {
            const resizedDataUrl = await resizeImage(file);
            setReceiptFile(resizedDataUrl);
        } catch (error) {
            addToast("Erreur lors du traitement de l'image.", 'error');
        }
    };

    const handleAddExpense = () => {
        const amount = parseFloat(newExpense.amount);
        if (!newExpense.description || isNaN(amount) || amount <= 0) {
            addToast("Veuillez remplir la description et un montant valide.", 'warning');
            return;
        }

        const expenseToAdd: Expense = {
            id: generateUUID(),
            date: newExpense.date || visitDate,
            description: newExpense.description,
            amount,
            category: newExpense.category,
            receiptUrl: receiptFile || undefined,
        };

        onExpensesChange([...expenses, expenseToAdd]);
        setNewExpense({ date: visitDate, description: '', amount: '', category: 'transport' });
        setReceiptFile(null);
    };

    const handleDeleteExpense = (id: string) => {
        onExpensesChange(expenses.filter(exp => exp.id !== id));
    };

    return (
        <div className="pt-4 border-t border-border-light dark:border-border-dark">
            <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-2 flex items-center gap-2">
                <ReceiptIcon className="w-6 h-6"/>
                Notes de Frais
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4">
                {expenses.length === 0 ? (
                    <p className="text-sm text-text-muted dark:text-text-muted-dark text-center py-2">Aucune dépense enregistrée.</p>
                ) : (
                    expenses.map(exp => (
                        <div key={exp.id} className="p-2 bg-gray-50 dark:bg-primary-light/10 rounded-md flex items-center gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold">{exp.description} <span className="text-xs text-text-muted dark:text-text-muted-dark capitalize">({exp.category})</span></p>
                                <p className="text-sm">{exp.amount.toFixed(2)} € - {new Date(exp.date + 'T00:00:00').toLocaleDateString('fr-FR')}</p>
                            </div>
                            {exp.receiptUrl && <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-primary dark:text-primary-light hover:bg-primary/10 rounded-full"><EyeIcon className="w-5 h-5"/></a>}
                            <button type="button" onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))
                )}
            </div>
            <div className="font-bold text-right pr-2">Total : {totalExpenses.toFixed(2)} €</div>
            
            <div className="mt-4 p-3 bg-gray-100 dark:bg-primary-light/10 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Ajouter une dépense</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder="Description (ex: Billet de train)" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full border border-border-light dark:border-border-dark rounded-md py-1 px-2 text-sm bg-card-light dark:bg-card-dark"/>
                    <input type="number" placeholder="Montant (€)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full border border-border-light dark:border-border-dark rounded-md py-1 px-2 text-sm bg-card-light dark:bg-card-dark"/>
                    <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full border border-border-light dark:border-border-dark rounded-md py-1 px-2 text-sm bg-card-light dark:bg-card-dark"/>
                    <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as Expense['category']})} className="w-full border border-border-light dark:border-border-dark rounded-md py-1 px-2 text-sm bg-card-light dark:bg-card-dark">
                        <option value="transport">Transport</option>
                        <option value="repas">Repas</option>
                        <option value="hébergement">Hébergement</option>
                        <option value="autre">Autre</option>
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="receipt-upload" className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary dark:text-primary-light">
                        <CameraIcon className="w-5 h-5"/>
                        {receiptFile ? 'Justificatif ajouté' : 'Joindre un justificatif'}
                    </label>
                    <input id="receipt-upload" type="file" accept="image/*" className="sr-only" onChange={handleReceiptUpload}/>
                    {receiptFile && <button type="button" onClick={() => setReceiptFile(null)} className="text-xs text-red-500">Annuler</button>}
                </div>
                <button type="button" onClick={handleAddExpense} className="w-full px-4 py-2 bg-primary/20 text-primary dark:text-primary-light font-bold rounded-lg transition-transform active:scale-95 text-sm">Ajouter</button>
            </div>
        </div>
    );
};

// Sub-component for the form itself
const VisitForm: React.FC<{
    formData: VisitFormData;
    onFormChange: <K extends keyof VisitFormData>(key: K, value: VisitFormData[K]) => void;
    speakerForVisit: Speaker | null;
    hosts: Host[];
    isLocalSpeaker: boolean;
    onAddNewHost: () => void;
    isGeneratingNotes: boolean;
    onGenerateNotes: () => void;
    isSuggestingHosts: boolean;
    onSuggestHosts: () => void;
    isGeneratingChecklist: boolean;
    onGenerateChecklist: () => void;
    repetitionWarning: string | null;
    specialDateWarning: string | null;
    apiKey: string;
    isOnline: boolean;
    isEditing: boolean;
}> = ({ 
    formData, onFormChange, speakerForVisit, hosts, isLocalSpeaker, onAddNewHost, 
    isGeneratingNotes, onGenerateNotes, 
    isSuggestingHosts, onSuggestHosts,
    isGeneratingChecklist, onGenerateChecklist,
    repetitionWarning,
    specialDateWarning,
    apiKey, isOnline, isEditing
}) => {
    const { addToast } = useToast();
    const { publicTalks } = useData();
    const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);

    useEffect(() => {
        if (speakerForVisit && formData.host && formData.host !== UNASSIGNED_HOST && formData.host !== NO_HOST_NEEDED) {
            const selectedHost = hosts.find(h => h.nom === formData.host);
            if (selectedHost) {
                const warnings = detectConflicts(speakerForVisit, selectedHost);
                setConflictWarnings(warnings);
            } else {
                setConflictWarnings([]);
            }
        } else {
            setConflictWarnings([]);
        }
    }, [formData.host, speakerForVisit, hosts]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.type !== 'application/pdf') {
            addToast("Seuls les fichiers PDF sont autorisés.", 'error');
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            addToast(`Le fichier est trop volumineux. La taille maximale est de ${MAX_FILE_SIZE / 1024 / 1024} Mo.`, 'error');
            e.target.value = '';
            return;
        }

        const totalAttachmentsSize = formData.attachments.reduce((acc, curr) => acc + curr.size, 0);
        if (totalAttachmentsSize + file.size > 5 * 1024 * 1024) { // 5MB total limit for localStorage
            addToast("L'ajout de ce fichier dépasserait la limite de stockage totale.", 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const newAttachments = [...formData.attachments, { name: file.name, dataUrl: reader.result as string, size: file.size }];
            onFormChange('attachments', newAttachments);
            addToast(`"${file.name}" a été ajouté.`, 'success');
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input
    };
    
    const removeAttachment = (indexToRemove: number) => {
        const fileName = formData.attachments[indexToRemove]?.name;
        const newAttachments = formData.attachments.filter((_, index) => index !== indexToRemove);
        onFormChange('attachments', newAttachments);
        addToast(`"${fileName}" a été supprimé.`, 'info');
    };

    const toggleChecklistItem = (index: number) => {
        const newChecklist = [...formData.checklist];
        newChecklist[index].completed = !newChecklist[index].completed;
        onFormChange('checklist', newChecklist);
    };

    const removeChecklistItem = (index: number) => {
        const newChecklist = formData.checklist.filter((_, i) => i !== index);
        onFormChange('checklist', newChecklist);
    };
    
    // Automatically handle accommodation/meals when host status changes
    useEffect(() => {
        if (formData.host === NO_HOST_NEEDED) {
            onFormChange('accommodation', 'N/A');
            onFormChange('meals', 'N/A');
        }
    }, [formData.host]);

    const getAITitle = () => {
        if (!isOnline) return "Connexion Internet requise.";
        if (!apiKey) return "Clé API non configurée.";
        return "Suggérer avec l'IA";
    }

    return (
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
            {/* ... other form fields ... */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="visitDate" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Date du discours</label>
                    <input type="date" id="visitDate" value={formData.visitDate} onChange={(e) => onFormChange('visitDate', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" required />
                </div>
                <div>
                    <label htmlFor="visitTime" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Heure</label>
                    <input type="time" id="visitTime" value={formData.visitTime} onChange={(e) => onFormChange('visitTime', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" required />
                </div>
            </div>
            {specialDateWarning && (
                <div className={`-mt-2 p-3 rounded-md text-sm flex items-start space-x-3 ${specialDateWarning.startsWith('Attention') ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
                    <InformationCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5"/>
                    <p>{specialDateWarning}</p>
                </div>
            )}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="arrivalDate" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Date d'arrivée (optionnel)</label>
                    <input type="date" id="arrivalDate" value={formData.arrivalDate} onChange={(e) => onFormChange('arrivalDate', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" />
                </div>
                <div>
                    <label htmlFor="departureDate" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Date de départ (optionnel)</label>
                    <input type="date" id="departureDate" value={formData.departureDate} onChange={(e) => onFormChange('departureDate', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label htmlFor="talkNoOrType" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">N° Discours</label>
                    <input type="text" id="talkNoOrType" value={formData.talkNoOrType || ''} onChange={(e) => onFormChange('talkNoOrType', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" placeholder="Ex: 123 ou DS"/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="talkTheme" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Thème du discours</label>
                    <input 
                        type="text" 
                        id="talkTheme" 
                        value={formData.talkTheme || ''} 
                        onChange={(e) => onFormChange('talkTheme', e.target.value)} 
                        className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" 
                        placeholder="Le thème s'affiche automatiquement"
                        list="talk-themes"
                    />
                    <datalist id="talk-themes">
                        {publicTalks.map(talk => <option key={talk.number} value={talk.theme} />)}
                    </datalist>
                    {repetitionWarning && (
                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                            <InformationCircleIcon className="w-4 h-4 mt-px shrink-0"/>
                            <span>{repetitionWarning}</span>
                        </div>
                    )}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Type de visite</label>
                <div className="mt-2 flex space-x-4">
                    {['physical', 'zoom', 'streaming'].map(type => (
                        <div key={type} className="flex items-center">
                            <input id={`type-${type}`} name="locationType" type="radio" value={type} checked={formData.locationType === type} onChange={() => onFormChange('locationType', type as any)} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600" />
                            <label htmlFor={`type-${type}`} className="ml-3 block text-sm font-medium text-text-main dark:text-text-main-dark capitalize">{type === 'physical' ? 'Présentiel' : type}</label>
                        </div>
                    ))}
                </div>
            </div>
            {formData.locationType === 'physical' && (
                <>
                    <div>
                        <label htmlFor="host" className="flex justify-between items-center text-sm font-medium text-text-muted dark:text-text-muted-dark">
                          <span>Accueil par</span>
                          <button type="button" onClick={onSuggestHosts} disabled={isSuggestingHosts || !isOnline || !apiKey || formData.host === NO_HOST_NEEDED} className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary dark:text-primary-light font-semibold rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title={getAITitle()}>
                              {isSuggestingHosts ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                              {isSuggestingHosts ? 'Analyse...' : 'Suggérer avec IA'}
                          </button>
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                            <select id="host" value={formData.host} onChange={(e) => onFormChange('host', e.target.value)} className="block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark">
                                <option value={UNASSIGNED_HOST}>{UNASSIGNED_HOST}</option>
                                <option value={NO_HOST_NEEDED}>{NO_HOST_NEEDED}</option>
                                <option disabled>──────────</option>
                                {hosts.map(h => {
                                    const available = isHostAvailable(h, formData.visitDate);
                                    return (
                                        <option key={h.nom} value={h.nom} disabled={!available}>
                                            {h.nom} {!available ? '(Non disponible)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <button type="button" onClick={onAddNewHost} className="p-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 flex-shrink-0" title="Ajouter un nouveau contact pour l'accueil">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                         {conflictWarnings.length > 0 && (
                            <div className="mt-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm flex items-start space-x-3">
                                <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5"/>
                                <div>
                                    <p className="font-semibold">Conflits potentiels détectés :</p>
                                    <ul className="list-disc pl-5 mt-1">
                                        {conflictWarnings.map((warning, index) => (
                                            <li key={index}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                    {!isLocalSpeaker ? (
                        <>
                            <div>
                                <label htmlFor="accommodation" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Hébergement</label>
                                <input type="text" id="accommodation" value={formData.accommodation} onChange={(e) => onFormChange('accommodation', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark disabled:bg-gray-100 dark:disabled:bg-gray-800" placeholder="Ex: Chez l'hôte, hôtel, pas nécessaire..." disabled={formData.host === NO_HOST_NEEDED} />
                            </div>
                            <div>
                                <label htmlFor="meals" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Repas</label>
                                <input type="text" id="meals" value={formData.meals} onChange={(e) => onFormChange('meals', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark disabled:bg-gray-100 dark:disabled:bg-gray-800" placeholder="Ex: Samedi soir, Dimanche midi..." disabled={formData.host === NO_HOST_NEEDED} />
                            </div>
                        </>
                    ) : (
                        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm flex items-start space-x-3">
                            <InformationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                            <p>L'hébergement et les repas sont automatiquement définis sur "Sur place" pour les orateurs de Lyon.</p>
                        </div>
                    )}
                </>
            )}
             <div>
                <label htmlFor="notes" className="flex justify-between items-center text-sm font-medium text-text-muted dark:text-text-muted-dark">
                    <span>Notes</span>
                    <button type="button" onClick={onGenerateNotes} disabled={isGeneratingNotes || !isOnline || !apiKey} className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary dark:text-primary-light font-semibold rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title={getAITitle()}>
                        {isGeneratingNotes ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                        {isGeneratingNotes ? 'Génération...' : 'Suggérer avec IA'}
                    </button>
                </label>
                <textarea id="notes" rows={3} value={formData.notes} onChange={(e) => onFormChange('notes', e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark" placeholder="Toute information supplémentaire..."></textarea>
            </div>
             <div className="pt-4 border-t border-border-light dark:border-border-dark">
                <label className="flex justify-between items-center text-sm font-medium text-text-muted dark:text-text-muted-dark">
                    <span>Check-list de préparation</span>
                    <button type="button" onClick={onGenerateChecklist} disabled={isGeneratingChecklist || !isOnline || !apiKey} className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary dark:text-primary-light font-semibold rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title={getAITitle()}>
                        {isGeneratingChecklist ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                        {isGeneratingChecklist ? 'Génération...' : 'Générer avec IA'}
                    </button>
                </label>
                <div className="mt-2 space-y-2">
                    {formData.checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-primary-light/10 rounded-md">
                            <input type="checkbox" checked={item.completed} onChange={() => toggleChecklistItem(index)} className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary" />
                            <span className={`flex-grow text-sm ${item.completed ? 'line-through text-text-muted dark:text-text-muted-dark' : ''}`}>{item.text}</span>
                            <button type="button" onClick={() => removeChecklistItem(index)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {formData.checklist.length === 0 && <p className="text-xs text-center text-text-muted dark:text-text-muted-dark py-2">Aucune tâche. Utilisez le générateur IA ou ajoutez-en manuellement.</p>}
                </div>
            </div>
             <div>
                <label htmlFor="status" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Statut</label>
                <select id="status" value={formData.status} onChange={(e) => onFormChange('status', e.target.value as any)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark">
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulé</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Pièces jointes (PDF, max 2Mo/fichier)</label>
                <div className="mt-2"><label htmlFor="file-upload" className="w-full flex justify-center px-4 py-2 border-2 border-border-light dark:border-border-dark border-dashed rounded-md cursor-pointer hover:border-primary dark:hover:border-primary-light"><div className="space-y-1 text-center"><PaperclipIcon className="mx-auto h-8 w-8 text-gray-400" /><div className="flex text-sm text-gray-600 dark:text-gray-400"><span>Ajouter un fichier</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="application/pdf" /></div></div></label></div>
                {formData.attachments.length > 0 && <div className="mt-3 space-y-2">{formData.attachments.map((file, index) => <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-primary-light/10 rounded-md text-sm"><a href={file.dataUrl} download={file.name} className="truncate text-primary dark:text-primary-light hover:underline" title={file.name}>{file.name}</a><button type="button" onClick={() => removeAttachment(index)} className="ml-3 p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button></div>)}</div>}
            </div>
             {isEditing && (
                <ExpenseManager 
                    expenses={formData.expenses}
                    onExpensesChange={(newExpenses) => onFormChange('expenses', newExpenses)}
                    visitDate={formData.visitDate}
                />
            )}
        </div>
    );
};


interface ScheduleVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: Visit | null;
    speaker: Speaker | null;
    onComplete: (visit: Visit) => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ isOpen, onClose, visit, speaker, onComplete }) => {
    const { hosts, visits, addHost, addVisit, updateVisit, apiKey, speakers: allSpeakers, archivedVisits, congregationProfile, publicTalks, isOnline, specialDates } = useData();
    const [formData, setFormData] = useState<VisitFormData>({
        visitDate: '', arrivalDate: '', departureDate: '', visitTime: '14:30', host: '', accommodation: '',
        meals: '', notes: '', status: 'pending', attachments: [], expenses: [], talkNoOrType: '', talkTheme: '',
        locationType: 'physical', checklist: []
    });
    const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
    const [isSuggestingHosts, setIsSuggestingHosts] = useState(false);
    const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
    const [hostSuggestions, setHostSuggestions] = useState<AISuggestion[] | null>(null);

    const [isFindingReplacement, setIsFindingReplacement] = useState(false);
    const [replacementSuggestions, setReplacementSuggestions] = useState<{ speaker: Speaker; reason: string }[] | null>(null);

    const [dateConflict, setDateConflict] = useState<Visit | null>(null);
    const [repetitionWarning, setRepetitionWarning] = useState<string | null>(null);
    const [specialDateWarning, setSpecialDateWarning] = useState<string | null>(null);
    const { addToast } = useToast();
    
    const currentSpeaker = visit || speaker;
    const isEditing = !!visit;
    
    const speakerForVisit = useMemo(() => {
        if (speaker) return speaker;
        if (visit) return allSpeakers.find(s => s.id === visit.id);
        return null;
    }, [speaker, visit, allSpeakers]);

    const isLocalSpeaker = useMemo(() => 
        currentSpeaker?.congregation.toLowerCase().includes('lyon'),
        [currentSpeaker]
    );

    const hostForVisit = useMemo(() => {
        if (!visit || !hosts) return null;
        return hosts.find(h => h.nom === visit.host) || null;
    }, [visit, hosts]);

    const handleFormChange = useCallback(<K extends keyof VisitFormData>(key: K, value: VisitFormData[K]) => {
        setFormData(prev => {
            let newFormData = { ...prev, [key]: value };
    
            if (key === 'talkNoOrType') {
                const talkNumberStr = String(value).trim();
                const talkNumber = parseInt(talkNumberStr, 10);
                const foundTalk = !isNaN(talkNumber) 
                    ? publicTalks.find(t => t.number === talkNumber) 
                    : publicTalks.find(t => String(t.number).toLowerCase() === talkNumberStr.toLowerCase());
                newFormData.talkTheme = foundTalk ? foundTalk.theme : (prev.talkTheme || '');
            }
    
            if (key === 'talkTheme') {
                const themeValue = String(value).trim();
                const foundTalk = publicTalks.find(t => t.theme.toLowerCase() === themeValue.toLowerCase());
                newFormData.talkNoOrType = foundTalk ? String(foundTalk.number) : (prev.talkNoOrType || null);
            }
            
            return newFormData;
        });
    }, [publicTalks]);
    
    useEffect(() => {
        if (!isOpen) return;
        
        setHostSuggestions(null);
        setReplacementSuggestions(null);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const initialData = {
            visitDate: visit?.visitDate || `${year}-${month}-${day}`,
            arrivalDate: visit?.arrivalDate || '',
            departureDate: visit?.departureDate || '',
            visitTime: visit?.visitTime || congregationProfile.defaultTime,
            host: visit?.host || UNASSIGNED_HOST,
            accommodation: visit?.accommodation || (isLocalSpeaker ? 'Sur place' : ''),
            meals: visit?.meals || (isLocalSpeaker ? 'Sur place' : ''),
            notes: visit?.notes || '',
            status: visit?.status || 'pending',
            attachments: visit?.attachments || [],
            expenses: visit?.expenses || [],
            talkNoOrType: visit?.talkNoOrType || '',
            talkTheme: visit?.talkTheme || '',
            locationType: visit?.locationType || 'physical',
            checklist: visit?.checklist || [],
        };
        setFormData(initialData);
    }, [visit, speaker, isOpen, isLocalSpeaker, congregationProfile]);
    
     useEffect(() => {
        if (!formData.visitDate) {
            setDateConflict(null);
            setSpecialDateWarning(null);
            return;
        }

        const conflictingVisit = visits.find(v => 
            v.visitDate === formData.visitDate &&
            v.visitId !== (visit?.visitId || '')
        );
        setDateConflict(conflictingVisit || null);
        
        const specialDate = specialDates.find(d => d.date === formData.visitDate);
        if (specialDate) {
            if (['assembly', 'no_meeting'].includes(specialDate.type)) {
                setSpecialDateWarning(`Attention : Cette date correspond à l'événement "${specialDate.name}". Il n'y a probablement pas de discours visiteur ce jour-là.`);
            } else if (['co_visit'].includes(specialDate.type)) {
                 setSpecialDateWarning(`Info : Cette date correspond à l'événement "${specialDate.name}".`);
            } else {
                setSpecialDateWarning(null);
            }
        } else {
            setSpecialDateWarning(null);
        }
    }, [formData.visitDate, visits, visit, specialDates]);

    useEffect(() => {
        if (!formData.talkTheme) {
            setRepetitionWarning(null);
            return;
        }
    
        const allVisits = [...visits, ...archivedVisits];
        let lastPresentation: { date: Date, speaker: string } | null = null;
        
        for(const v of allVisits) {
            if (visit && v.visitId === visit.visitId) continue;
            
            if (v.talkTheme?.trim().toLowerCase() === formData.talkTheme.trim().toLowerCase()) {
                const visitDate = new Date(v.visitDate + 'T00:00:00');
                if (!lastPresentation || visitDate > lastPresentation.date) {
                    lastPresentation = { date: visitDate, speaker: v.nom };
                }
            }
        }
        
        if (lastPresentation) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = today.getTime() - lastPresentation.date.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
            if (diffDays >= 0 && diffDays <= 365) {
                const monthsAgo = Math.round(diffDays / 30.44);
                setRepetitionWarning(`Attention : Discours donné il y a ~${monthsAgo} mois par ${lastPresentation.speaker}.`);
            } else {
                setRepetitionWarning(null);
            }
        } else {
            setRepetitionWarning(null);
        }
    
    }, [formData.talkTheme, visits, archivedVisits, visit]);

    if (!isOpen) return null;

    const handleSuggestHosts = async () => {
        if (!speakerForVisit || !formData.visitDate) return;
        if (!isOnline) { addToast("Connexion Internet requise.", 'info'); return; }
        if (!apiKey) { addToast("Veuillez configurer votre clé API pour utiliser l'IA.", 'error'); return; }

        setIsSuggestingHosts(true);
        setHostSuggestions(null);
        try {
            const ai = new GoogleGenAI({ apiKey });
            
            const availableHosts = hosts.filter(h => isHostAvailable(h, formData.visitDate));
            const hostListString = availableHosts
                .map(h => `- ${h.nom}: Notes: ${h.notes || 'Aucune note'}. Tags: ${(h.tags || []).join(', ')}. Genre: ${h.gender}.`)
                .join('\n');
            
            const speakerDetails = `Nom: ${speakerForVisit.nom}. Statut marital: ${speakerForVisit.maritalStatus === 'couple' ? 'en couple' : 'célibataire'}. Notes: ${speakerForVisit.notes || 'Aucune'}. Tags: ${(speakerForVisit.tags || []).join(', ')}`;
            
            const prompt = `Tu es un assistant intelligent pour un responsable d'accueil. Ton but est de trouver le meilleur foyer pour un orateur visiteur en tenant compte des compatibilités.
    
            **Contexte de la visite :**
            - **Date de la visite :** ${formData.visitDate}
            - **Orateur :** ${speakerDetails}
    
            **Liste des foyers d'accueil disponibles ce jour-là :**
            ${hostListString}
    
            **Ta mission :**
            1. Analyse attentivement les "Notes", "Tags", et "Genre" de l'orateur et de chaque foyer.
            2. Identifie les 3 meilleurs foyers. Prends en compte les points de compatibilité (ex: orateur en couple et accueil adapté aux couples) et les incompatibilités (ex: allergie aux chats vs présence de chat).
            3. Pour chaque suggestion, fournis une justification claire, amicale et concise en français. Commence ta justification par "Suggestion : " pour un bon choix, ou "Avertissement : " si il y a une incompatibilité majeure mais que le choix reste possible pour d'autres raisons. Sois précis.
    
            **Exemples de justifications :**
            - "Suggestion : Idéal, car l'orateur a besoin d'un logement sans escaliers et ce contact est en rez-de-chaussée."
            - "Suggestion : Bon choix, car l'orateur vient en couple et cet accueil est adapté."
            - "Avertissement : Incompatible. L'orateur est allergique aux chats et ce contact en possède un."
    
            **Format de sortie OBLIGATOIRE :**
            Retourne un tableau JSON contenant jusqu'à 3 objets. Chaque objet doit avoir deux clés : "hostName" (le nom exact du foyer) et "reason" (ta justification). Ne renvoie que le tableau JSON, sans texte supplémentaire.`;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                hostName: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ["hostName", "reason"]
                        }
                    }
                }
            });
    
            const parsedSuggestions = JSON.parse(response.text?.trim() || '[]');
            const matchedSuggestions = parsedSuggestions
                .map((s: { hostName: string; reason: string }) => ({
                    host: hosts.find(h => h.nom === s.hostName),
                    reason: s.reason,
                }))
                .filter((s: any): s is AISuggestion => s.host);
    
            setHostSuggestions(matchedSuggestions);
        } catch (error) {
            console.error("Error suggesting hosts:", error);
            addToast("Erreur lors de la suggestion d'hôtes.", 'error');
        } finally {
            setIsSuggestingHosts(false);
        }
    };
    
    const handleGenerateChecklist = async () => {
        if (!isOnline) { addToast("Connexion Internet requise.", 'info'); return; }
        if (!apiKey) { addToast("Veuillez configurer votre clé API pour utiliser l'IA.", 'error'); return; }
        setIsGeneratingChecklist(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Génère une check-list de préparation pour une visite d'orateur en français. Visite: ${formData.locationType}, Hébergement: ${formData.accommodation || 'Non'}, Repas: ${formData.meals || 'Non'}. Réponds en JSON: [{text: string, completed: false}]. Inclue 3-5 tâches pertinentes.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, completed: { type: Type.BOOLEAN } }, required: ["text", "completed"] }
                }}
            });
            const newItems = JSON.parse(response.text?.trim() || '[]');
            handleFormChange('checklist', [...formData.checklist, ...newItems]);
        } catch (error) { addToast("Erreur lors de la génération de la checklist.", 'error'); } finally { setIsGeneratingChecklist(false); }
    };

    const handleGenerateNotes = async () => {
        if (!speakerForVisit) return;
        if (!isOnline) { addToast("Connexion Internet requise.", 'info'); return; }
        if (!apiKey) { addToast("Veuillez configurer votre clé API pour utiliser l'IA.", 'error'); return; }
        setIsGeneratingNotes(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `Génère des notes de préparation pour une visite d'un orateur. Orateur: ${speakerForVisit.nom} de ${speakerForVisit.congregation}. Préférences: ${speakerForVisit.notes || 'Aucune'}. Notes existantes: ${formData.notes || 'Aucune'}. Rédige quelques points clés.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const newNotes = formData.notes ? `${formData.notes}\n\n---\n${response.text || ''}` : (response.text || '');
            handleFormChange('notes', newNotes);
        } catch (error) { addToast("Erreur lors de la génération des notes.", 'error'); } finally { setIsGeneratingNotes(false); }
    };

    const handleFindReplacement = async () => {
        if (!visit || !speakerForVisit) return;
        if (!isOnline) { addToast("Connexion Internet requise.", 'info'); return; }
        if (!apiKey) { addToast("Veuillez configurer votre clé API pour utiliser l'IA.", 'error'); return; }
        
        setIsFindingReplacement(true);
        setReplacementSuggestions(null);

        try {
            const ai = new GoogleGenAI({ apiKey });
            const availableSpeakers = allSpeakers.filter(s => s.id !== speakerForVisit.id && !visits.some(v => v.visitDate === visit.visitDate && v.id === s.id));
            const speakerListString = availableSpeakers.map(s => `- ${s.nom} de ${s.congregation}. Notes: ${s.notes || 'Aucune'}. Tags: ${(s.tags || []).join(', ')}`).join('\n');
            const hostDetails = hostForVisit ? `Hôte: ${hostForVisit.nom}. Notes: ${hostForVisit.notes || 'Aucune'}. Tags: ${(hostForVisit.tags || []).join(', ')}` : "Pas d'hôte assigné.";

            const prompt = `Trouve les 3 meilleurs remplaçants pour une visite annulée le ${visit.visitDate}. ${hostDetails}. Orateurs disponibles:\n${speakerListString}\n\nAnalyse la compatibilité entre les orateurs et l'hôte (allergies, etc.). Réponds en JSON: [{speakerName: string, reason: string}]. Ne renvoie que le JSON.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { speakerName: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["speakerName", "reason"] }
                }}
            });
            const parsed = JSON.parse(response.text?.trim() || '[]');
            const matched = parsed.map((s: { speakerName: string, reason: string }) => ({ speaker: allSpeakers.find(sp => sp.nom === s.speakerName), reason: s.reason })).filter((s: any) => s.speaker);
            setReplacementSuggestions(matched);

        } catch (error) { addToast("Erreur lors de la recherche de remplaçants.", 'error'); } finally { setIsFindingReplacement(false); }
    };

    const handleSelectReplacement = (replacementSpeaker: Speaker) => {
        if (!visit) return;
        updateVisit({ ...visit, status: 'cancelled' });
        const newVisit: Visit = { ...visit, id: replacementSpeaker.id, nom: replacementSpeaker.nom, congregation: replacementSpeaker.congregation, telephone: replacementSpeaker.telephone, photoUrl: replacementSpeaker.photoUrl, visitId: generateUUID(), status: 'pending', communicationStatus: {}, notes: `Remplacement pour ${visit.nom}. Notes originales: ${visit.notes || 'Aucune'}` };
        addVisit(newVisit);
        addToast(`Visite de ${visit.nom} annulée et remplacée par ${replacementSpeaker.nom}.`, 'success', 7000);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const visitData = { ...formData, arrivalDate: formData.arrivalDate || undefined, departureDate: formData.departureDate || undefined, host: formData.locationType !== 'physical' ? UNASSIGNED_HOST : formData.host, accommodation: formData.host === NO_HOST_NEEDED ? 'N/A' : (formData.locationType !== 'physical' ? (formData.locationType === 'zoom' ? 'Zoom' : 'Streaming') : (isLocalSpeaker ? 'Sur place' : formData.accommodation)), meals: formData.host === NO_HOST_NEEDED ? 'N/A' : (formData.locationType !== 'physical' ? 'N/A' : (isLocalSpeaker ? 'Sur place' : formData.meals)) };

        if (formData.status === 'completed') {
            const visitToComplete: Visit = isEditing && visit ? { ...visit, ...visitData, status: 'confirmed' } : { ...speaker!, ...visitData, visitId: generateUUID(), status: 'confirmed', communicationStatus: {} };
            onComplete(visitToComplete);
        } else {
            if (isEditing && visit) { updateVisit({ ...visit, ...visitData }); } 
            else if (speaker) { addVisit({ ...speaker!, ...visitData, visitId: generateUUID(), communicationStatus: {} }); }
        }
        onClose();
    };


    const handleAddNewHost = () => {
        const newHostName = window.prompt("Entrez le nom du nouveau contact pour l'accueil :");
        if (newHostName && newHostName.trim() !== '') {
            const trimmedHost = newHostName.trim();
            if (addHost({ nom: trimmedHost, telephone: '', address: '', gender: 'male', unavailabilities: [] })) {
                handleFormChange('host', trimmedHost);
                addToast(`"${trimmedHost}" ajouté. Pensez à compléter les infos dans les paramètres.`, 'info');
            } else {
                addToast(`"${trimmedHost}" existe déjà.`, 'warning');
                handleFormChange('host', trimmedHost);
            }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
                <div className="p-6 bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white rounded-t-xl flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">{isEditing ? 'Modifier la visite' : 'Programmer une visite'}</h2>
                            <p className="opacity-80 mt-1">pour <span className="font-semibold">{currentSpeaker?.nom}</span></p>
                        </div>
                        <button type="button" onClick={onClose} className="p-3 -mt-2 -mr-2 rounded-full text-white/70 hover:bg-white/20"><XIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
                    {dateConflict && <div className="p-3 mx-6 mt-4 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm flex items-start space-x-3"><ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/><p><strong>Attention :</strong> Une autre visite est déjà programmée ce jour-là pour <strong>{dateConflict.nom}</strong>. Vous ne pouvez pas enregistrer.</p></div>}
                    {hostSuggestions && <div className="p-4 mx-6 mt-4 rounded-md bg-primary/10 dark:bg-primary/20 text-sm"><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-primary dark:text-primary-light">Suggestions d'accueil (IA)</h3><button type="button" onClick={() => setHostSuggestions(null)}><XIcon className="w-5 h-5"/></button></div><div className="space-y-2">{hostSuggestions.map(({ host, reason }) => (<div key={host.nom} className="p-2 bg-white/50 dark:bg-card-dark/50 rounded-md"><div className="flex justify-between items-center"><p className="font-semibold">{host.nom}</p><button type="button" onClick={() => { handleFormChange('host', host.nom); addToast(`${host.nom} sélectionné.`, 'success'); }} className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold">Choisir</button></div><p className="text-xs italic text-text-muted dark:text-text-muted-dark mt-1">"{reason}"</p></div>))}</div></div>}
                    <VisitForm formData={formData} onFormChange={handleFormChange} speakerForVisit={speakerForVisit || null} hosts={hosts} isLocalSpeaker={isLocalSpeaker || false} onAddNewHost={handleAddNewHost} isGeneratingNotes={isGeneratingNotes} onGenerateNotes={handleGenerateNotes} isSuggestingHosts={isSuggestingHosts} onSuggestHosts={handleSuggestHosts} isGeneratingChecklist={isGeneratingChecklist} onGenerateChecklist={handleGenerateChecklist} repetitionWarning={repetitionWarning} specialDateWarning={specialDateWarning} apiKey={apiKey} isOnline={isOnline} isEditing={isEditing} />
                    
                    {isEditing && formData.status === 'cancelled' && (
                        <div className="px-6 pb-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <h4 className="font-bold text-blue-800 dark:text-blue-300">Assistant de Remplacement</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">La visite est annulée. Souhaitez-vous trouver un remplaçant ?</p>
                                <button type="button" onClick={handleFindReplacement} disabled={isFindingReplacement || !isOnline || !apiKey} className="mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light transition-transform active:scale-95 disabled:opacity-50">
                                    {isFindingReplacement ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                                    {isFindingReplacement ? 'Recherche en cours...' : "Trouver un remplaçant avec l'IA"}
                                </button>
                                {replacementSuggestions && (
                                    <div className="mt-4 space-y-2">
                                        {replacementSuggestions.length > 0 ? replacementSuggestions.map(({ speaker, reason }) => {
                                            const conflicts = hostForVisit ? detectConflicts(speaker, hostForVisit) : [];
                                            return (
                                                <div key={speaker.id} className={`p-3 rounded-lg ${conflicts.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500' : 'bg-white/50 dark:bg-card-dark/50'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold">{speaker.nom}</p>
                                                        <button type="button" onClick={() => handleSelectReplacement(speaker)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700">Choisir</button>
                                                    </div>
                                                    <p className="text-xs italic text-text-muted dark:text-text-muted-dark mt-1">IA: "{reason}"</p>
                                                    {conflicts.length > 0 && (
                                                        <div className="mt-2 text-xs text-amber-800 dark:text-amber-300">
                                                            <p className="font-semibold flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4" /> Conflits potentiels:</p>
                                                            <ul className="list-disc pl-5">
                                                                {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }) : <p className="text-sm text-text-muted dark:text-text-muted-dark">Aucun remplaçant idéal n'a été trouvé.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex justify-end space-x-3 border-t border-border-light dark:border-border-dark rounded-b-xl flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20 transition-transform active:scale-95">Annuler</button>
                        <button type="submit" disabled={!!dateConflict || !!specialDateWarning?.startsWith('Attention')} className="px-4 py-2 bg-primary hover:bg-primary-light border border-transparent rounded-md text-sm font-medium text-white transition-transform active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">{isEditing ? 'Enregistrer' : 'Programmer'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};