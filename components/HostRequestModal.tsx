import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Visit, Language } from '../types';
import { XIcon, CopyIcon, SparklesIcon, SpinnerIcon, ArrowUpOnSquareIcon, EditIcon, SaveIcon, ArrowUturnLeftIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { hostRequestMessageTemplates } from '../constants';
import { LanguageSelector } from './LanguageSelector';
import { GoogleGenAI } from '@google/genai';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';


interface HostRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: Visit[];
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const HostRequestModal: React.FC<HostRequestModalProps> = ({ isOpen, onClose, visits, language, onLanguageChange }) => {
    const { congregationProfile, apiKey, customHostRequestTemplates, saveCustomHostRequestTemplate, deleteCustomHostRequestTemplate } = useData();
    const { addToast } = useToast();
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [showRefineOptions, setShowRefineOptions] = useState(false);
    const refineMenuRef = useRef<HTMLDivElement>(null);
    
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);
    const [editedTemplateText, setEditedTemplateText] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    const getTemplate = useCallback((lang: Language) => {
        const custom = customHostRequestTemplates[lang];
        const defaultTpl = hostRequestMessageTemplates[lang] || "Modèle non disponible.";
        return { template: custom || defaultTpl, isCustom: !!custom };
    }, [customHostRequestTemplates]);

    const generateMessage = useCallback((templateText: string) => {
        const visitList = visits.map(v => 
            `- ${new Date(v.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : Frère ${v.nom}`
        ).join('\n');
        
        let generated = templateText.replace('{visitList}', visitList);
        generated = generated.replace(/{hospitalityOverseer}/g, congregationProfile.hospitalityOverseer || '');
        generated = generated.replace(/{hospitalityOverseerPhone}/g, congregationProfile.hospitalityOverseerPhone || '');

        return generated;
    }, [visits, congregationProfile]);

    const loadMessage = useCallback(() => {
        if (visits.length > 0) {
            const { template, isCustom: custom } = getTemplate(language);
            setMessage(generateMessage(template));
            setEditedTemplateText(template);
            setIsCustom(custom);
        }
    }, [language, getTemplate, generateMessage, visits]);

    useEffect(() => {
        if (isOpen) {
            loadMessage();
            setIsEditingTemplate(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            loadMessage();
        }
    }, [language, loadMessage, isOpen]);


    const handleSaveTemplate = () => {
        saveCustomHostRequestTemplate(language, editedTemplateText);
        setIsEditingTemplate(false);
    };

    const handleRestoreDefault = () => {
        deleteCustomHostRequestTemplate(language);
        setIsEditingTemplate(false);
    };

    const handleShare = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                await Share.share({
                    title: "Demande d'accueil groupée",
                    text: message,
                    dialogTitle: "Partager la demande",
                });
            } catch (error) {
                 if (error.message && !error.message.toLowerCase().includes('cancelled')) {
                    addToast("Erreur lors du partage.", 'error');
                }
            }
        } else {
            // Web fallback
            navigator.clipboard.writeText(message).then(() => {
                setCopied(true);
                addToast("Message copié !", 'success');
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const handleRefineWithAI = async (action: 'correct' | 'friendly' | 'formal') => {
        if (!apiKey) {
            addToast("Veuillez configurer votre clé API dans les Paramètres.", 'error');
            return;
        }
        setIsGenerating(true);
        setShowRefineOptions(false);

        let promptAction = '';
        switch (action) {
            case 'correct':
                promptAction = "Corrige uniquement les fautes d'orthographe et de grammaire du texte suivant. Ne modifie pas le style ou le ton. Retourne uniquement le texte corrigé, sans aucun préambule.";
                break;
            case 'friendly':
                promptAction = "Réécris le texte suivant pour qu'il ait un ton plus chaleureux et amical, tout en conservant les informations essentielles. Retourne uniquement le texte réécrit, sans aucun préambule.";
                break;
            case 'formal':
                promptAction = "Réécris le texte suivant pour qu'il soit plus formel et respectueux. Retourne uniquement le texte réécrit, sans aucun préambule.";
                break;
        }

        const prompt = `${promptAction}\n\n---\n\n${message}`;

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setMessage(response.text.trim());
            addToast("Message amélioré par l'IA !", 'success');
        } catch (error) {
            console.error("Error refining message with AI:", error);
            addToast(error instanceof Error && error.message.includes("API key") 
                ? "Erreur: La clé API n'est pas configurée ou est invalide."
                : "Erreur lors de l'amélioration du message.", 'error');
        } finally {
            setIsGenerating(false);
        }
    };

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (refineMenuRef.current && !refineMenuRef.current.contains(event.target as Node)) {
                setShowRefineOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [refineMenuRef]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                <div className="p-6 bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Demande d'accueil groupée</h2>
                        <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full text-white/70 hover:bg-white/20">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <LanguageSelector lang={language} setLang={onLanguageChange} isContained />
                    
                    {isEditingTemplate ? (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="templateContent" className="block text-sm font-bold text-text-main dark:text-text-main-dark">Modifier le modèle</label>
                                <div className="flex items-center gap-2">
                                    {isCustom && <button type="button" onClick={handleRestoreDefault} className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1"><ArrowUturnLeftIcon className="w-4 h-4" /> Rétablir</button>}
                                    <button type="button" onClick={() => setIsEditingTemplate(false)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-primary-light/20 rounded-md">Annuler</button>
                                    <button type="button" onClick={handleSaveTemplate} className="px-3 py-1 text-xs bg-primary text-white rounded-md flex items-center gap-1"><SaveIcon className="w-4 h-4"/> Enregistrer</button>
                                </div>
                            </div>
                            <textarea id="templateContent" rows={12} value={editedTemplateText} onChange={(e) => setEditedTemplateText(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-primary-light/10 border-border-light dark:border-border-dark whitespace-pre-wrap" />
                            <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Utilisez des variables comme {'{visitList}'}, {'{hospitalityOverseer}'}, etc.</p>
                        </div>
                    ) : (
                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-text-main dark:text-text-main-dark">Aperçu du message</label>
                                <button onClick={() => setIsEditingTemplate(true)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary dark:text-primary-light font-semibold rounded-md hover:bg-primary/10">
                                    <EditIcon className="w-4 h-4" /> Modifier le modèle
                                </button>
                            </div>
                            <div className="relative">
                                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={12} className="w-full p-2 pr-12 border rounded-md bg-gray-50 dark:bg-primary-light/10 border-border-light dark:border-border-dark whitespace-pre-wrap" />
                                <div className="absolute bottom-3 right-3">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowRefineOptions(prev => !prev)}
                                            disabled={!apiKey || isGenerating}
                                            className="p-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={!apiKey ? "Clé API non configurée" : "Améliorer avec l'IA"}
                                        >
                                            {isGenerating ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                                        </button>
                                        {showRefineOptions && (
                                            <div ref={refineMenuRef} className="absolute bottom-full right-0 mb-2 w-48 bg-card-light dark:bg-card-dark rounded-md shadow-lg border border-border-light dark:border-border-dark z-10 animate-fade-in">
                                                <div className="py-1">
                                                    <button onClick={() => handleRefineWithAI('correct')} className="w-full text-left px-4 py-2 text-sm text-text-main dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-primary-light/20">Corriger le texte</button>
                                                    <button onClick={() => handleRefineWithAI('friendly')} className="w-full text-left px-4 py-2 text-sm text-text-main dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-primary-light/20">Rendre plus amical</button>
                                                    <button onClick={() => handleRefineWithAI('formal')} className="w-full text-left px-4 py-2 text-sm text-text-main dark:text-text-main-dark hover:bg-gray-100 dark:hover:bg-primary-light/20">Rendre plus formel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex justify-end items-center border-t border-border-light dark:border-border-dark rounded-b-xl">
                    <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-transform active:scale-95">
                        {Capacitor.isNativePlatform() ? <ArrowUpOnSquareIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                        {Capacitor.isNativePlatform() ? 'Partager' : (copied ? "Copié !" : "Copier le message")}
                    </button>
                </div>
            </div>
        </div>
    );
};
