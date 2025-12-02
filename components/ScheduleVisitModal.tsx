import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateUUID } from '../utils/uuid';
import { Speaker, Visit, Host, SpecialDate, Expense } from '../types';
import { XIcon, PlusIcon, PaperclipIcon, TrashIcon, InformationCircleIcon, SparklesIcon, ExclamationTriangleIcon, SpinnerIcon, CheckIcon, ReceiptIcon, CameraIcon, EyeIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { UNASSIGNED_HOST, NO_HOST_NEEDED } from '../constants';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
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
        warnings.push(`L'orateur vient en couple, mais l'accueil est noté comme pour un orateur seul.`);
    }

    return warnings;
};

export const ScheduleVisitModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    speaker: Speaker | null;
    onSave: (visit: Visit) => void;
    editingVisit?: Visit;
}> = ({ isOpen, onClose, speaker, onSave, editingVisit }) => {
    if (!isOpen || !speaker) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Planifier une visite</h2>
                <p>Fonctionnalité en cours de développement...</p>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};