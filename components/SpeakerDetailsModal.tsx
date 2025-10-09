import React, { useState, useEffect, useMemo } from 'react';
import { generateUUID } from '../utils/uuid';
import { Speaker, TalkHistory, Visit } from '../types';
import { XIcon, CheckCircleIcon, ClockIcon, XCircleIcon, ExclamationTriangleIcon, SparklesIcon, SpinnerIcon, StarIcon, CameraIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { Avatar } from './Avatar';
import { resizeImage } from '../utils/image';
import { GoogleGenAI } from '@google/genai';
import { TagInput } from './TagInput';

interface SpeakerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    speaker: Speaker | null;
}

const DisplayRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);

const AIAnalysis: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none text-text-main dark:text-text-main-dark">
            {lines.map((line, index) => {
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <p key={index} className="ml-4 flex"><span className="mr-2 text-secondary">•</span><span>{line.substring(2)}</span></p>;
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};

export const SpeakerDetailsModal: React.FC<SpeakerDetailsModalProps> = ({ isOpen, onClose, speaker }) => {
    const { visits, addSpeaker, updateSpeaker, deleteSpeaker, apiKey, archivedVisits, isOnline } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'visits' | 'feedback'>('details');
    const { addToast } = useToast();
    const confirm = useConfirm();
    
    // Form state
    const [nom, setNom] = useState('');
    const [congregation, setCongregation] = useState('');
    const [telephone, setTelephone] = useState<string | undefined>('');
    const [notes, setNotes] = useState<string | undefined>('');
    const [photoUrl, setPhotoUrl] = useState<string | undefined | null>(null);
    const [talkHistory, setTalkHistory] = useState<TalkHistory[]>([]);
    const [maritalStatus, setMaritalStatus] = useState<'single' | 'couple'>('single');
    const [isVehiculed, setIsVehiculed] = useState(false);
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [tags, setTags] = useState<string[]>([]);
    
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);


    const isAdding = speaker === null;
    
    const speakerScheduledVisits = useMemo(() => {
        if (!speaker) return [];
        return visits
            .filter(v => v.id === speaker.id)
            .sort((a, b) => new Date(a.visitDate + 'T00:00:00').getTime() - new Date(b.visitDate + 'T00:00:00').getTime());
    }, [speaker, visits]);
    
    const speakerFeedback = useMemo(() => {
        if (!speaker) return [];
        return archivedVisits
            .filter(v => v.id === speaker.id && v.feedback)
            .map(v => ({...v.feedback!, visitDate: v.visitDate }))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [speaker, archivedVisits]);
    
    const averageRating = useMemo(() => {
        if (!speakerFeedback || speakerFeedback.length === 0) return 0;
        const total = speakerFeedback.reduce((sum, fb) => sum + fb.rating, 0);
        return total / speakerFeedback.length;
    }, [speakerFeedback]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            setAiSummary(null);
            if (isAdding) {
                setNom('');
                setCongregation('');
                setTelephone('');
                setNotes('');
                setPhotoUrl(null);
                setTalkHistory([]);
                setMaritalStatus('single');
                setIsVehiculed(false);
                setGender('male');
                setTags([]);
            } else if (speaker) {
                setNom(speaker.nom);
                setCongregation(speaker.congregation);
                setTelephone(speaker.telephone);
                setNotes(speaker.notes);
                setPhotoUrl(speaker.photoUrl);
                setTalkHistory(speaker.talkHistory || []);
                setMaritalStatus(speaker.maritalStatus || 'single');
                setIsVehiculed(speaker.isVehiculed || false);
                setGender(speaker.gender || 'male');
                setTags(speaker.tags || []);
            }
        }
    }, [speaker, isOpen, isAdding]);

    if (!isOpen) return null;

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addToast('Veuillez sélectionner un fichier image.', 'error');
            return;
        }

        try {
            const resizedDataUrl = await resizeImage(file);
            setPhotoUrl(resizedDataUrl);
            addToast('Photo mise à jour.', 'success');
        } catch (error) {
            console.error("Error resizing image", error);
            addToast("Erreur lors du traitement de l'image.", 'error');
        }
    };
    
    const removePhoto = () => {
        setPhotoUrl(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const speakerData: Speaker = {
            id: speaker?.id || generateUUID(),
            nom,
            congregation,
            telephone: telephone || undefined,
            notes: notes || undefined,
            photoUrl: photoUrl || undefined,
            talkHistory,
            maritalStatus,
            isVehiculed,
            gender,
            tags,
        };

        if (isAdding) {
            addSpeaker(speakerData);
        } else {
            updateSpeaker(speakerData);
        }
        onClose();
    };
    
     const handleDelete = async () => {
        if (!speaker) return;

        const upcomingVisitsCount = speakerScheduledVisits.length;
        let confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement "${speaker.nom}" ?`;
        if (upcomingVisitsCount > 0) {
            const visitPlural = upcomingVisitsCount > 1 ? 's' : '';
            confirmMessage += `\n\nATTENTION : Cet orateur a ${upcomingVisitsCount} visite${visitPlural} programmée${visitPlural} qui seron également supprimée${visitPlural}.`;
        }
        confirmMessage += "\n\nCette action est irréversible.";

        if (await confirm(confirmMessage)) {
            deleteSpeaker(speaker.id);
            onClose();
        }
    };

    const formatDateForDisplay = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(`${dateString}T00:00:00`).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const handleGenerateSummary = async () => {
        if (!isOnline) {
            addToast("Une connexion Internet est requise pour l'analyse IA.", 'info');
            return;
        }
        if (!apiKey) {
            addToast("Veuillez configurer votre clé API dans les Paramètres pour utiliser l'IA.", 'error');
            return;
        }
    
        setIsGeneratingSummary(true);
        setAiSummary(null);
        try {
            const historyString = sortedTalkHistory.length > 0
                ? sortedTalkHistory.map(t => `- ${formatDateForDisplay(t.date)}: "${t.theme || 'Thème non spécifié'}"`).join('\n')
                : "Aucun historique.";
            
            const scheduledString = speakerScheduledVisits.length > 0
                ? speakerScheduledVisits.map(v => `- ${formatDateForDisplay(v.visitDate)} (Accueil: ${v.host})`).join('\n')
                : "Aucune.";

            const prompt = `Tu es un assistant pour un responsable d'accueil. Rédige une note de synthèse concise et utile (en français) pour l'orateur suivant. Mets en évidence ses besoins potentiels pour l'accueil, sa fréquence de visite, et toute information pertinente pour une bonne organisation. Formate ta réponse en 2-3 phrases ou une courte liste à puces.

**Informations sur l'orateur :**
- Nom : ${nom}
- Congrégation : ${congregation}
- Statut : ${maritalStatus === 'couple' ? 'En couple' : 'Célibataire'}
- Véhiculé : ${isVehiculed ? 'Oui' : 'Non'}
- Notes/Préférences : ${notes || 'Aucune'}
- Tags : ${(tags || []).join(', ') || 'Aucun'}
- Historique des visites passées :
${historyString}
- Prochaines visites programmées :
${scheduledString}

**Ta tâche :**
Rédige un résumé qui synthétise ces informations pour aider à planifier le prochain accueil. Ne retourne que le résumé, sans aucun préambule comme "Voici une suggestion :".`;
    
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            setAiSummary(response.text.trim());
    
        } catch (error) {
            console.error("Error generating summary:", error);
            addToast(error instanceof Error && error.message.includes("API key") 
                ? "Erreur: La clé API n'est pas configurée ou est invalide."
                : "Erreur lors de la génération du résumé.", 'error');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const sortedTalkHistory = [...talkHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const statusInfo: {[key: string]: { icon: React.FC<any>, color: string }} = {
        confirmed: { icon: CheckCircleIcon, color: 'text-green-500' },
        pending: { icon: ClockIcon, color: 'text-amber-500' },
        cancelled: { icon: XCircleIcon, color: 'text-red-500' },
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white rounded-t-xl flex-shrink-0">
                    <div className="flex justify-between items-start">
                         <h2 className="text-2xl font-bold">{isAdding ? "Ajouter un orateur" : "Détails de l'orateur"}</h2>
                        <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full text-white/70 hover:bg-white/20">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                     {!isAdding && (
                        <div className="border-b border-white/20 mt-4 -mb-6 -mx-6 px-6">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('details')}
                                    className={`${ activeTab === 'details' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white' } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Détails
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('visits')}
                                    className={`${ activeTab === 'visits' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white' } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Visites ({speakerScheduledVisits.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('feedback')}
                                    className={`${ activeTab === 'feedback' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white' } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Avis ({speakerFeedback.length})
                                </button>
                            </nav>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {!isAdding && (
                                <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-primary dark:text-primary-light">Résumé de l'Assistant IA</h3>
                                        <button
                                            type="button"
                                            onClick={handleGenerateSummary}
                                            disabled={isGeneratingSummary || !apiKey || !isOnline}
                                            className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary font-semibold rounded-md hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            title={!apiKey ? "Veuillez configurer votre clé API" : !isOnline ? "Connexion Internet requise" : "Générer un résumé avec l'IA"}
                                        >
                                            {isGeneratingSummary ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                            {isGeneratingSummary ? 'Analyse...' : 'Générer'}
                                        </button>
                                    </div>
                                    <div className="min-h-[4rem] flex items-center justify-center">
                                        {isGeneratingSummary ? (
                                             <div className="space-y-2 w-full">
                                                <div className="h-3 bg-gray-200 dark:bg-primary-light/10 rounded w-3/4 animate-pulse"></div>
                                                <div className="h-3 bg-gray-200 dark:bg-primary-light/10 rounded w-1/2 animate-pulse"></div>
                                            </div>
                                        ) : aiSummary ? (
                                            <AIAnalysis text={aiSummary} />
                                        ) : (
                                            <p className="text-sm text-center text-text-muted dark:text-text-muted-dark">Cliquez sur "Générer" pour obtenir un résumé des informations clés de cet orateur.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Top Section: Photo & Identity */}
                            <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-border-light dark:border-border-dark">
                                <div className="w-full sm:w-auto flex-shrink-0">
                                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Photo</label>
                                    <div className="mt-2 flex items-center space-x-4">
                                        <Avatar item={{ nom: nom || '?', photoUrl: photoUrl }} size="w-24 h-24" />
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <label htmlFor="photo-upload" className="cursor-pointer px-3 py-2 bg-card-light dark:bg-primary-light/10 border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                                                Galerie
                                            </label>
                                            <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                                            <label htmlFor="camera-upload" className="cursor-pointer px-3 py-2 flex items-center gap-2 bg-card-light dark:bg-primary-light/10 border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                                                <CameraIcon className="w-4 h-4" />
                                                Prendre
                                            </label>
                                            <input id="camera-upload" name="camera-upload" type="file" className="sr-only" accept="image/*" capture onChange={handlePhotoChange} />
                                            {photoUrl && (
                                                <button type="button" onClick={removePhoto} className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50">
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow space-y-4">
                                    <div>
                                        <label htmlFor="nom" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Nom complet</label>
                                        <input type="text" id="nom" value={nom} onChange={(e) => setNom(e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" required />
                                    </div>
                                    <div>
                                        <label htmlFor="congregation" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Congrégation</label>
                                        <input type="text" id="congregation" value={congregation} onChange={(e) => setCongregation(e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" required />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Middle Section: Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor="telephone" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Téléphone</label>
                                    <input type="tel" id="telephone" value={telephone || ''} onChange={(e) => setTelephone(e.target.value)} placeholder="+33612345678" className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
                                    {!telephone && (
                                        <div className="mt-2 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                                            <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                            <p>Le numéro de téléphone est crucial pour une bonne coordination. Pensez à l'ajouter.</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Genre</label>
                                    <div className="mt-2 flex space-x-4">
                                        <div className="flex items-center">
                                            <input id="gender-male" name="gender" type="radio" value="male" checked={gender === 'male'} onChange={() => setGender('male')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600" />
                                            <label htmlFor="gender-male" className="ml-3 block text-sm font-medium text-text-main dark:text-text-main-dark">Frère</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input id="gender-female" name="gender" type="radio" value="female" checked={gender === 'female'} onChange={() => setGender('female')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600" />
                                            <label htmlFor="gender-female" className="ml-3 block text-sm font-medium text-text-main dark:text-text-main-dark">Sœur</label>
                                        </div>
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Statut marital</label>
                                    <div className="mt-2 flex space-x-4">
                                        <div className="flex items-center">
                                            <input id="marital-single" name="maritalStatus" type="radio" value="single" checked={maritalStatus === 'single'} onChange={() => setMaritalStatus('single')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600" />
                                            <label htmlFor="marital-single" className="ml-3 block text-sm font-medium text-text-main dark:text-text-main-dark">Célibataire</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input id="marital-couple" name="maritalStatus" type="radio" value="couple" checked={maritalStatus === 'couple'} onChange={() => setMaritalStatus('couple')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600" />
                                            <label htmlFor="marital-couple" className="ml-3 block text-sm font-medium text-text-main dark:text-text-main-dark">En couple</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center pt-2">
                                    <input id="isVehiculed" type="checkbox" checked={isVehiculed} onChange={(e) => setIsVehiculed(e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary" />
                                    <label htmlFor="isVehiculed" className="ml-2 block text-sm font-medium text-text-main dark:text-text-main-dark">Est véhiculé</label>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="notes" className="flex justify-between items-center text-sm font-medium text-text-muted dark:text-text-muted-dark">
                                        <span>Notes / Préférences</span>
                                    </label>
                                    <textarea id="notes" rows={3} value={notes || ''} onChange={(e) => setNotes(e.target.value)} placeholder="Ex. : Allergies, préférences alimentaires, transport..." className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Tags</label>
                                    <div className="mt-1">
                                        <TagInput
                                            tags={tags}
                                            setTags={setTags}
                                            suggestions={['allergie-chat', 'allergie-animaux', 'sans escaliers', 'calme', 'zoom', 'jeunesse', 'illustrations', 'expérimenté', 'disponible semaine', 'thèmes prophétiques']}
                                            placeholder="Ajouter un tag (ex: zoom)..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* History Section */}
                            <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark">Historique des discours passés</h3>
                                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {sortedTalkHistory.length > 0 ? sortedTalkHistory.map((talk, index) => (
                                        <div key={index} className="p-2 bg-gray-50 dark:bg-primary-light/10 rounded-md">
                                            <p className="font-semibold text-sm text-text-main dark:text-text-main-dark">{formatDateForDisplay(talk.date)}</p>
                                            <p className="text-xs text-text-muted dark:text-text-muted-dark">
                                                {talk.talkNo && `(${talk.talkNo})`} {talk.theme || "Thème non spécifié"}
                                            </p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-text-muted dark:text-text-muted-dark text-center py-2">Aucun historique.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'visits' && (
                        <div>
                            {speakerScheduledVisits.length > 0 ? (
                                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {speakerScheduledVisits.map(visit => {
                                        const StatusIcon = statusInfo[visit.status].icon;
                                        const statusColor = statusInfo[visit.status].color;
                                        return (
                                        <li key={visit.visitId} className="p-3 bg-gray-50 dark:bg-primary-light/10 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-text-main dark:text-text-main-dark">{formatDateForDisplay(visit.visitDate)}</p>
                                                    <p className="text-sm text-text-muted dark:text-text-muted-dark">Accueil par : {visit.host}</p>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                                                    <span className={`text-xs font-semibold ${statusColor}`}>{visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}</span>
                                                </div>
                                            </div>
                                        </li>
                                    );})}
                                </ul>
                            ) : (
                                <p className="text-center text-text-muted dark:text-text-muted-dark py-4">Aucune visite programmée pour cet orateur.</p>
                            )}
                        </div>
                    )}
                    {activeTab === 'feedback' && (
                        <div>
                            {speakerFeedback.length > 0 ? (
                                <>
                                    <div className="mb-4 p-3 bg-gray-100 dark:bg-primary-light/10 rounded-lg flex items-center gap-4">
                                        <p className="font-bold text-lg">Note moyenne :</p>
                                        <DisplayRating rating={averageRating} />
                                        <span className="font-bold text-lg ml-2">{averageRating.toFixed(1)} / 5</span>
                                    </div>
                                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                        {speakerFeedback.map((fb, index) => (
                                            <div key={index} className="p-3 bg-gray-50 dark:bg-primary-light/10 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <DisplayRating rating={fb.rating} />
                                                    <p className="text-xs font-medium text-text-muted dark:text-text-muted-dark">
                                                        Visite du {formatDateForDisplay(fb.visitDate)}
                                                    </p>
                                                </div>
                                                {fb.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {fb.tags.map(tag => (
                                                             <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary dark:text-secondary dark:bg-secondary/20 font-medium capitalize">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {fb.comment && (
                                                    <p className="mt-2 text-sm text-text-main dark:text-text-main-dark italic border-l-4 border-border-light dark:border-border-dark pl-3">
                                                        "{fb.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-text-muted dark:text-text-muted-dark py-4">Aucun avis n'a encore été laissé pour cet orateur.</p>
                            )}
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex justify-between items-center border-t border-border-light dark:border-border-dark rounded-b-xl flex-shrink-0">
                    <div>
                        {!isAdding && (
                             <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Supprimer
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                            Annuler
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-light border border-transparent rounded-md text-sm font-medium text-white">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};