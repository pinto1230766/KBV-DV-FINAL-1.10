import React, { useState } from 'react';
import { Visit } from '../types';
import { XIcon, StarIcon } from './Icons';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { TagInput } from './TagInput';
import { Avatar } from './Avatar';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: Visit;
}

const StarRating: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center items-center space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    aria-label={`Noter ${star} sur 5`}
                >
                    {/* FIX: Replaced unsupported `style` prop with `fill-current` Tailwind class to control fill color. */}
                    <StarIcon
                        className={`w-10 h-10 transition-colors ${
                            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};


export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, visit }) => {
    const { addFeedbackToVisit } = useData();
    const { addToast } = useToast();

    const [rating, setRating] = useState(0);
    const [tags, setTags] = useState<string[]>([]);
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            addToast("Veuillez donner une note.", 'warning');
            return;
        }

        addFeedbackToVisit(visit.visitId, {
            rating,
            tags,
            comment,
            date: new Date().toISOString(),
        });
        
        addToast("Avis enregistré, merci !", 'success');
        onClose();
    };
    
    const suggestionTags = ["Bon communicant", "Encourageant", "Bien préparé", "Ponctuel", "Aimable", "Adaptable"];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
                <div className="p-6 bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white rounded-t-xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">Laisser un avis</h2>
                             <p className="opacity-80 mt-1 flex items-center gap-2">
                                <Avatar item={visit} size="w-6 h-6"/>
                                pour {visit.nom}
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full text-white/70 hover:bg-white/20">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                     <div>
                        <label className="block text-center text-sm font-medium text-text-muted dark:text-text-muted-dark mb-2">Note globale de l'accueil</label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Tags (optionnel)</label>
                        <div className="mt-1">
                            <TagInput 
                                tags={tags}
                                setTags={setTags}
                                suggestions={suggestionTags}
                                placeholder="Ajouter un tag..."
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="feedback-comment" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Commentaire (optionnel)</label>
                        <textarea
                            id="feedback-comment"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Comment s'est passée la visite ? Y a-t-il des points à noter pour la prochaine fois ?"
                            className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex justify-end space-x-3 border-t border-border-light dark:border-border-dark rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                        Annuler
                    </button>
                    <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark border border-transparent rounded-md text-sm font-medium text-white">
                        Enregistrer l'avis
                    </button>
                </div>
            </form>
        </div>
    );
};