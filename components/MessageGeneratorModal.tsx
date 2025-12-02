import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Visit, Language, MessageType, MessageRole, Speaker, Host } from '../types';
import { messageTemplates } from '../constants';
import { XIcon, CopyIcon, WhatsAppIcon, ChevronDownIcon, SaveIcon, ArrowUturnLeftIcon, SparklesIcon, SpinnerIcon, EditIcon, CheckIcon, ArrowUpOnSquareIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { LanguageSelector } from './LanguageSelector';
import { GoogleGenAI } from '@google/genai';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface MessageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit?: Visit;
  speaker?: Speaker;
  host?: Host;
  role: MessageRole;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  messageType?: MessageType;
  initialText?: string;
}

const formatFullDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatPhoneNumber = (phone?: string): string => {
    if (!phone || phone.trim() === '') return '(non renseigné)';
    const cleaned = phone.replace(/[\s.-]/g, '');
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    if (cleaned.startsWith('00')) {
        return `+${cleaned.substring(2)}`;
    }
    if (cleaned.startsWith('0')) {
        return `+33${cleaned.substring(1)}`;
    }
    return `+${cleaned}`;
};

export const MessageGeneratorModal: React.FC<MessageGeneratorModalProps> = ({
  isOpen,
  onClose,
  visit,
  speaker: speakerProp,
  host: hostProp,
  role,
  language,
  onLanguageChange,
  messageType: initialMessageType,
  initialText,
}) => {
  const { speakers, hosts, customTemplates, saveCustomTemplate, deleteCustomTemplate, logCommunication, apiKey, congregationProfile } = useData();
  const { addToast } = useToast();
  const { settings } = useSettings();
  const { aiSettings } = settings;

  const isFreeForm = !visit;

  const speaker = useMemo(() => isFreeForm ? speakerProp : speakers.find(s => s.id === visit.id), [isFreeForm, speakerProp, visit, speakers]);
  const host = useMemo(() => isFreeForm ? hostProp : hosts.find(h => h.nom === visit?.host), [isFreeForm, hostProp, visit, hosts]);
  const currentRecipient = role === 'speaker' ? speaker : host;

  const isLocalSpeaker = useMemo(() => visit?.congregation.toLowerCase().includes('lyon'), [visit]);
  const isRemoteVisit = useMemo(() => visit?.locationType === 'zoom' || visit?.locationType === 'streaming', [visit]);
  const isSpecialVisitType = isLocalSpeaker || isRemoteVisit;
  
  const [messageType, setMessageType] = useState<MessageType>(initialMessageType || 'confirmation');
  const [messageText, setMessageText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplateText, setEditedTemplateText] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  
  const getTemplate = useCallback((lang: Language, type: MessageType, r: MessageRole) => {
      const custom = customTemplates[lang]?.[type]?.[r];
      const defaultTpl = messageTemplates[lang]?.[type]?.[r] || "Modèle non disponible.";
      return { template: custom || defaultTpl, isCustom: !!custom };
  }, [customTemplates]);


  const generateMessage = useCallback((templateText: string) => {
    if (!visit) return '';
    
    let generated = templateText;
    const speakerGender = speaker?.gender || 'male';
    const hostGender = host?.gender || 'male';

    const isFirstCommunication = !visit.communicationStatus || Object.keys(visit.communicationStatus).length === 0;

    if (messageType === 'confirmation' && role === 'speaker' && isFirstCommunication) {
        const introductionFR = "\nJe suis le responsable de l'accueil pour le groupe capverdien de Lyon.";
        const introductionCV = "\nMi é responsavel pa akolhimentu na grupu kabuverdianu di Lyon.";
        const intro = language === 'fr' ? introductionFR : introductionCV;
        generated = generated.replace(/{firstTimeIntroduction}/g, intro);
    } else {
        generated = generated.replace(/{firstTimeIntroduction}/g, '');
    }

    if (speakerGender === 'female') {
        generated = generated.replace(/Bonjour Frère/g, 'Bonjour Sœur');
        generated = generated.replace(/Frère \*{speakerName}\*/g, 'Sœur *{speakerName}*');
        generated = generated.replace(/notre orateur invité, Frère/g, 'notre oratrice invitée, Sœur');
        generated = generated.replace(/Olá, Irmon/g, 'Olá, Irmã');
        generated = generated.replace(/Irmon \*{speakerName}\*/g, 'Irmã *{speakerName}*');
    }
    
    if (host) {
        if (hostGender === 'female') {
            generated = generated.replace(/Bonjour Frère {hostName}/g, 'Bonjour Sœur {hostName}');
            generated = generated.replace(/notre frère/g, 'notre sœur');
            generated = generated.replace(/grâce à des frères comme toi/g, 'grâce à des sœurs comme toi');
            generated = generated.replace(/Olá, Irmon {hostName}/g, 'Olá, Irmã {hostName}');
            generated = generated.replace(/nos irmun/g, 'nos irmã');
            generated = generated.replace(/a irmuns sima bo/g, 'a irmãs sima bo');
        } else if (hostGender === 'couple') {
            generated = generated.replace(/Frère {hostName}/g, '{hostName}');
            generated = generated.replace(/Irmun {hostName}/g, '{hostName}');
            generated = generated.replace(/notre frère/g, 'nos frères');
            generated = generated.replace(/nos irmun/g, 'nos irmuns');
            
            const coupleReplacements = { "J'espère que tu vas bien": "J'espère que vous allez bien", "Je te contacte": "Je vous contacte", "Merci de t'être porté volontaire": "Merci de vous être portés volontaires", "Peux-tu prendre contact": "Pouvez-vous prendre contact", "Fais-moi savoir si tu as": "Faites-moi savoir si vous avez", "ton hospitalité": "votre hospitalité", "ton aide": "votre aide", "Tout est en ordre de ton côté": "Tout est en ordre de votre côté", "N ta spera ma bu sta dretu": "N ta spera ma nhos sta dretu", "N sta kontakta-u": "N sta kontakta-nhos", "Obrigadu pa bu voluntariadu": "Obrigadu pa nhos voluntariadu", "Bu pode entra en kontaktu": "Nhos pode entra en kontaktu", "Aviza-m si bu tiver": "Aviza-m si nhos tiver", "pa bu ospitalidadi": "pa nhos ospitalidadi", "pa bu ajuda": "pa nhos ajuda", "di bu ladu": "di nhos ladu" };
            for (const [key, value] of Object.entries(coupleReplacements)) {
                generated = generated.replace(new RegExp(key, 'g'), value);
            }
        }
    }

    generated = generated.replace(/{speakerName}/g, visit.nom);
    generated = generated.replace(/{hostName}/g, visit.host);
    generated = generated.replace(/{visitDate}/g, formatFullDate(visit.visitDate));
    generated = generated.replace(/{visitTime}/g, visit.visitTime);
    generated = generated.replace(/{speakerPhone}/g, formatPhoneNumber(speaker?.telephone));
    generated = generated.replace(/{hostPhone}/g, formatPhoneNumber(host?.telephone));
    generated = generated.replace(/{hostAddress}/g, host?.address || '(non renseignée)');
    generated = generated.replace(/{hospitalityOverseer}/g, congregationProfile.hospitalityOverseer || '');
    generated = generated.replace(/{hospitalityOverseerPhone}/g, congregationProfile.hospitalityOverseerPhone || '');
    
    return generated;
  }, [visit, speaker, host, messageType, role, language, congregationProfile]);


  const loadMessage = useCallback(() => {
      const { template, isCustom: custom } = getTemplate(language, messageType, role);
      const generated = generateMessage(template);
      setMessageText(generated);
      setEditedTemplateText(template);
      setIsCustom(custom);
  }, [language, messageType, role, getTemplate, generateMessage]);


  useEffect(() => {
    if (isOpen) {
        if (isFreeForm) {
            setMessageText(initialText || '');
        } else {
            const newInitialType = initialMessageType 
                ? initialMessageType 
                : (isSpecialVisitType ? 'thanks' : 'confirmation');
            
            setMessageType(newInitialType);
            setIsEditingTemplate(false);
            loadMessage();
        }
    }
  }, [isOpen, initialMessageType, isSpecialVisitType, isFreeForm, initialText, loadMessage]);

   useEffect(() => {
    if (isOpen && !isFreeForm) {
      loadMessage();
    }
  }, [messageType, language, loadMessage, isOpen, isFreeForm]);
  
  const handleSaveTemplate = () => {
    saveCustomTemplate(language, messageType, role, editedTemplateText);
    setIsEditingTemplate(false);
  };
  
  const handleRestoreDefault = () => {
    deleteCustomTemplate(language, messageType, role);
    setIsEditingTemplate(false);
  };

  const handleActionAndConfirm = () => {
    if (!isFreeForm && visit) {
      logCommunication(visit.visitId, messageType, role);
    }
  };

  const handleShare = () => {
    handleActionAndConfirm();
    if (Capacitor.isNativePlatform()) {
        Share.share({
            text: messageText,
            title: `Message pour ${currentRecipient?.nom}`,
            dialogTitle: 'Partager le message'
        }).catch(err => {
            if (err.message && !err.message.toLowerCase().includes('cancelled')) {
                addToast("Erreur lors du partage.", 'error');
            }
        });
    } else {
        navigator.clipboard.writeText(messageText).then(() => {
            addToast(`Message ${isFreeForm ? 'copié !' : 'copié et marqué comme envoyé !'}`, 'success');
        });
    }
  };
  
  const handleGenerateWithAI = async () => {
        if (!apiKey) {
            addToast("Veuillez configurer votre clé API dans les Paramètres.", 'error');
            return;
        }
        setIsGeneratingAI(true);
        try {
            const ai = new GoogleGenAI({ apiKey });

            const speakerDetails = speaker ? `Nom: ${speaker.nom},Congrégation: ${speaker.congregation}, Notes: ${speaker.notes || 'Aucune'}, Tags: ${(speaker.tags || []).join(', ')}` : 'Non applicable';
            const hostDetails = host ? `Nom: ${host.nom}, Notes: ${host.notes || 'Aucune'}, Tags: ${(host.tags || []).join(', ')}` : 'Non applicable';
            const visitDetails = visit ? `Date: ${formatFullDate(visit.visitDate)}, Hébergement: ${visit.accommodation || 'N/D'}, Repas: ${visit.meals || 'N/D'}` : 'Pas de visite associée.';

            const prompt = `
            Tu es un assistant rédigeant des messages pour un responsable d'accueil. Le ton doit être chaleureux, respectueux et fraternel.
            Ta tâche est de transformer le modèle de message suivant en un brouillon plus naturel et personnalisé.
            Incorpore les détails contextuels de manière fluide. Si les notes ou les tags contiennent des infos pertinentes (allergies, transport...), mentionne-les de manière attentionnée.
            La langue du message doit être: ${language === 'fr' ? 'Français' : 'Capverdien'}.

            **Contexte :**
            - Orateur : ${speakerDetails}
            - Accueil : ${hostDetails}
            - Visite : ${visitDetails}

            **Modèle de message à améliorer :**
            """
            ${messageText}
            """

            **Instructions :**
            1. Analyse les "Notes" et "Tags" pertinents.
            2. Personnalise le message en utilisant ces infos pour montrer de l'attention.
            3. Conserve les infos essentielles (dates, noms, etc.).
            4. **Ne retourne QUE le texte du message final**, sans aucun commentaire ou préambule.
            `;

            const response = await ai.models.generateContent({
                model: aiSettings.model,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: aiSettings.temperature,
                    maxOutputTokens: aiSettings.maxTokens,
                }
            } as any);  // Using type assertion as a last resort

            const refined = typeof response?.text === 'string' ? response.text.trim() : '';
            setMessageText(refined);
            addToast("Message rédigé par l'IA !", 'success');

        } catch (error) {
            console.error("Error generating message with AI:", error);
            addToast(error instanceof Error && error.message.includes("API key") 
                ? "Erreur: La clé API n'est pas configurée ou est invalide."
                : "Erreur lors de la rédaction du message.", 'error');
        } finally {
            setIsGeneratingAI(false);
        }
    };

  const allMessageTypeOptions: { value: MessageType, label: string }[] = [
      { value: 'confirmation', label: language === 'fr' ? 'Confirmation & Besoins' : 'Konfirmason & Nesesidadis' },
      { value: 'preparation', label: language === 'fr' ? 'Préparation' : 'Preparason' },
      { value: 'reminder-7', label: language === 'fr' ? 'Rappel J-7' : 'Lembreti D-7' },
      { value: 'reminder-2', label: language === 'fr' ? 'Rappel J-2' : 'Lembreti D-2' },
      { value: 'thanks', label: language === 'fr' ? 'Remerciements' : 'Agradesimentu' },
  ];

  const messageTypeOptions = isSpecialVisitType
    ? allMessageTypeOptions.filter(opt => opt.value === 'thanks')
    : allMessageTypeOptions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white rounded-t-xl flex-shrink-0">
            <div className="flex justify-between items-start">
                <div>
                     <h2 className="text-2xl font-bold">{isFreeForm ? `Message à ${currentRecipient?.nom}` : 'Générer un message'}</h2>
                     {!isFreeForm && (
                        <p className="opacity-80 mt-1">
                            Pour : <span className="font-semibold">{currentRecipient?.nom}</span> ({role === 'speaker' ? 'Orateur' : 'Accueil'})
                        </p>
                    )}
                </div>
                <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full text-white/70 hover:bg-white/20">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {!isFreeForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Langue</label>
                        <LanguageSelector lang={language} setLang={onLanguageChange} isContained={true} />
                    </div>
                    <div>
                        <label htmlFor="messageType" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Type de message</label>
                        <div className="relative">
                            <select id="messageType" value={messageType} onChange={(e) => setMessageType(e.target.value as MessageType)} className="block w-full appearance-none border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10 text-base">
                                {messageTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDownIcon className="w-5 h-5 text-gray-400" /></div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`pt-4 ${!isFreeForm ? 'mt-4 border-t border-border-light dark:border-border-dark' : ''}`}>
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
                         <textarea id="templateContent" rows={12} value={editedTemplateText} onChange={(e) => setEditedTemplateText(e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-gray-50 dark:bg-primary-light/10 text-base text-text-main dark:text-text-main-dark whitespace-pre-wrap" />
                         <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">Utilisez des variables comme {'{speakerName}'}, {'{hostName}'}, {'{visitDate}'}, etc.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="messageContent" className="block text-sm font-bold text-text-main dark:text-text-main-dark">{isFreeForm ? 'Votre message' : 'Aperçu du message'}</label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateWithAI}
                                    disabled={isGeneratingAI || !apiKey}
                                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary font-semibold rounded-md hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title={!apiKey ? "Veuillez configurer votre clé API dans les Paramètres." : "Rédiger avec l'IA"}
                                >
                                    {isGeneratingAI ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                    {isGeneratingAI ? 'Rédaction...' : "Rédiger avec l'IA"}
                                </button>
                                {!isFreeForm && (
                                    <button onClick={() => setIsEditingTemplate(true)} className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary dark:text-primary-light font-semibold rounded-md hover:bg-primary/10">
                                        <EditIcon className="w-4 h-4" /> Modifier
                                    </button>
                                )}
                            </div>
                        </div>
                        <textarea
                            id="messageContent"
                            rows={12}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-gray-50 dark:bg-primary-light/10 whitespace-pre-wrap"
                            placeholder={isFreeForm ? 'Écrivez votre message ici...' : ''}
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-border-light dark:border-border-dark rounded-b-xl flex-shrink-0">
             <div className="flex items-center gap-2">
                 <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-transform active:scale-95"
                >
                    {Capacitor.isNativePlatform() ? <ArrowUpOnSquareIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />}
                    <span>{Capacitor.isNativePlatform() ? 'Partager' : (isFreeForm ? 'Copier' : 'Copier & Marquer')}</span>
                </button>
             </div>
             <a
                href={`https://wa.me/${formatPhoneNumber(currentRecipient?.telephone)}?text=${encodeURIComponent(messageText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleActionAndConfirm}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-transform active:scale-95 ${!currentRecipient?.telephone ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-disabled={!currentRecipient?.telephone}
            >
                <WhatsAppIcon className="w-5 h-5" />
                <span>Envoyer sur WhatsApp</span>
            </a>
        </div>
      </div>
    </div>
  );
};
