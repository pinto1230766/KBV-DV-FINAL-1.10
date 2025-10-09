import React, { useState, useEffect, useMemo } from 'react';
import { Host, Visit } from '../types';
import { XIcon, ExclamationTriangleIcon, TrashIcon, CameraIcon, UserGroupIcon, ClockIcon, CalendarDaysIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { Avatar } from './Avatar';
import { resizeImage } from '../utils/image';
import { TagInput } from './TagInput';

interface HostDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    host: Host | null;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<any> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-100 dark:bg-primary-light/10 p-4 rounded-lg flex items-center gap-3">
        <Icon className="w-6 h-6 text-secondary" />
        <div>
            <p className="font-bold text-xl text-text-main dark:text-text-main-dark">{value}</p>
            <p className="text-xs font-medium text-text-muted dark:text-text-muted-dark">{title}</p>
        </div>
    </div>
);

const VisitHistoryItem: React.FC<{ visit: Visit }> = ({ visit }) => (
    <div className="p-3 bg-gray-50 dark:bg-primary-light/10 rounded-md flex justify-between items-center">
        <div>
            <p className="font-semibold text-sm">{visit.nom}</p>
            <p className="text-xs text-text-muted dark:text-text-muted-dark">{visit.congregation}</p>
        </div>
        <p className="text-xs font-bold text-text-main dark:text-text-main-dark">
            {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR')}
        </p>
    </div>
);


export const HostDetailsModal: React.FC<HostDetailsModalProps> = ({ isOpen, onClose, host }) => {
    const { hosts, addHost, updateHost, upcomingVisits, archivedVisits } = useData();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    
    // Form state
    const [nom, setNom] = useState('');
    const [telephone, setTelephone] = useState('');
    const [address, setAddress] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'couple'>('male');
    const [photoUrl, setPhotoUrl] = useState<string | undefined | null>(null);
    const [notes, setNotes] = useState('');
    const [unavailabilities, setUnavailabilities] = useState<{ start: string; end: string }[]>([]);
    const [newUnavailability, setNewUnavailability] = useState({ start: '', end: '' });
    const [tags, setTags] = useState<string[]>([]);

    const isAdding = host === null;

    const hostHistory = useMemo(() => {
        if (!host) return null;

        const allHostedVisits = [...upcomingVisits, ...archivedVisits].filter(v => v.host === host.nom);

        const past = allHostedVisits
            .filter(v => new Date(v.visitDate + 'T00:00:00') < new Date())
            .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

        const upcoming = allHostedVisits
            .filter(v => new Date(v.visitDate + 'T00:00:00') >= new Date())
            .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

        return {
            total: allHostedVisits.length,
            last: past[0] ? new Date(past[0].visitDate + 'T00:00:00').toLocaleDateString('fr-FR') : 'Jamais',
            next: upcoming[0] ? new Date(upcoming[0].visitDate + 'T00:00:00').toLocaleDateString('fr-FR') : 'Aucun',
            pastVisits: past,
            upcomingVisits: upcoming,
        };
    }, [host, upcomingVisits, archivedVisits]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            if (isAdding) {
                setNom('');
                setTelephone('');
                setAddress('');
                setGender('male');
                setPhotoUrl(null);
                setNotes('');
                setUnavailabilities([]);
                setTags([]);
            } else if (host) {
                setNom(host.nom);
                setTelephone(host.telephone);
                setAddress(host.address || '');
                setGender(host.gender || 'male');
                setPhotoUrl(host.photoUrl);
                setNotes(host.notes || '');
                setUnavailabilities(host.unavailabilities || []);
                setTags(host.tags || []);
            }
            setNewUnavailability({ start: '', end: '' });
        }
    }, [host, isOpen, isAdding]);

    if (!isOpen) return null;
    
    const handleAddUnavailability = () => {
        if (newUnavailability.start && newUnavailability.end) {
            if (new Date(newUnavailability.start) > new Date(newUnavailability.end)) {
                addToast("La date de début ne peut pas être après la date de fin.", 'error');
                return;
            }
            setUnavailabilities([...unavailabilities, newUnavailability].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
            setNewUnavailability({ start: '', end: '' });
        } else {
            addToast("Veuillez remplir les deux dates.", 'warning');
        }
    };

    const handleRemoveUnavailability = (indexToRemove: number) => {
        setUnavailabilities(unavailabilities.filter((_, index) => index !== indexToRemove));
    };


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
        
        const trimmedNom = nom.trim();
        if (!trimmedNom) {
            addToast("Le nom est obligatoire.", 'error');
            return;
        }

        if (isAdding) {
            if (hosts.some(h => h.nom.toLowerCase() === trimmedNom.toLowerCase())) {
                addToast(`Un contact d'accueil nommé "${trimmedNom}" existe déjà.`, 'error');
                return;
            }
            
            const success = addHost({
                nom: trimmedNom,
                telephone: telephone.trim(),
                address: address.trim(),
                gender,
                photoUrl: photoUrl || undefined,
                notes: notes.trim() || undefined,
                unavailabilities,
                tags,
            });

            if(success) {
                addToast(`"${trimmedNom}" ajouté à la liste d'accueil.`, 'success');
                onClose();
            } else {
                addToast(`"${trimmedNom}" existe déjà.`, 'error');
            }
        } else if(host) {
             if (trimmedNom !== host.nom && hosts.some(h => h.nom.toLowerCase() === trimmedNom.toLowerCase())) {
                addToast(`Un contact d'accueil nommé "${trimmedNom}" existe déjà.`, 'error');
                return;
            }
            updateHost(host.nom, {
                nom: trimmedNom,
                telephone: telephone.trim(),
                address: address.trim(),
                gender,
                photoUrl: photoUrl || undefined,
                notes: notes.trim() || undefined,
                unavailabilities,
                tags,
            });
            onClose();
        }
    };

    const renderDetailsForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Photo</label>
                <div className="mt-2 flex items-center space-x-4">
                    <Avatar item={{ nom: nom || '?', photoUrl: photoUrl }} size="w-16 h-16" />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <label htmlFor="photo-upload-host" className="cursor-pointer px-3 py-2 bg-card-light dark:bg-primary-light/10 border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                            Galerie
                        </label>
                        <input id="photo-upload-host" name="photo-upload-host" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                        <label htmlFor="camera-upload-host" className="cursor-pointer px-3 py-2 flex items-center gap-2 bg-card-light dark:bg-primary-light/10 border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                            <CameraIcon className="w-4 h-4" />
                            Prendre
                        </label>
                        <input id="camera-upload-host" name="camera-upload-host" type="file" className="sr-only" accept="image/*" capture onChange={handlePhotoChange} />
                        {photoUrl && (
                            <button type="button" onClick={removePhoto} className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50">
                                Supprimer
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="nom-host" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Nom complet</label>
                <input type="text" id="nom-host" value={nom} onChange={(e) => setNom(e.target.value)} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" required />
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
                    <div className="flex items-center">
                        <input id="gender-couple" name="gender" type="radio" value="couple" checked={gender === 'couple'} onChange={() => setGender('couple')} className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600" />
                        <label htmlFor="gender-couple" className="ml-3 block text-sm font-medium text-text-main dark:text-text-main-dark">Couple</label>
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="telephone-host" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Téléphone</label>
                <input type="tel" id="telephone-host" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+33612345678" className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
                {!telephone && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                        <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p>Le numéro de téléphone est important pour la coordination. Pensez à l'ajouter.</p>
                    </div>
                )}
            </div>
            <div>
                <label htmlFor="address-host" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Adresse</label>
                <textarea id="address-host" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Rue de l'Exemple, 69000 Lyon" className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
            </div>
            <div>
                <label htmlFor="notes-host" className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Notes (pour suggestions IA)</label>
                <textarea id="notes-host" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: possède un chat, famille avec jeunes enfants, idéal pour couples..." className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
            </div>
            <div>
                 <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Tags</label>
                 <div className="mt-1">
                     <TagInput
                         tags={tags}
                         setTags={setTags}
                         suggestions={['centre-ville', 'proche salle', 'sans escaliers', 'escaliers', 'animaux', 'chat', 'calme', 'enfants']}
                         placeholder="Ajouter un tag..."
                     />
                 </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-muted dark:text-text-muted-dark">Périodes d'indisponibilité</label>
                <div className="mt-2 space-y-2">
                    {unavailabilities.map((period, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-primary-light/10 rounded-md text-sm">
                            <span>Du <strong>{new Date(period.start + 'T00:00:00').toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(period.end + 'T00:00:00').toLocaleDateString('fr-FR')}</strong></span>
                            <button type="button" onClick={() => handleRemoveUnavailability(index)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-end gap-2 p-2 border-t border-border-light dark:border-border-dark">
                     <div className="flex-1">
                        <label htmlFor="unavailability-start" className="text-xs font-medium text-text-muted dark:text-text-muted-dark">Début</label>
                        <input type="date" id="unavailability-start" value={newUnavailability.start} onChange={(e) => setNewUnavailability({ ...newUnavailability, start: e.target.value })} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
                    </div>
                    <div className="flex-1">
                         <label htmlFor="unavailability-end" className="text-xs font-medium text-text-muted dark:text-text-muted-dark">Fin</label>
                        <input type="date" id="unavailability-end" value={newUnavailability.end} onChange={(e) => setNewUnavailability({ ...newUnavailability, end: e.target.value })} className="mt-1 block w-full border border-border-light dark:border-border-dark rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-primary focus:border-primary bg-card-light dark:bg-primary-light/10" />
                    </div>
                    <button type="button" onClick={handleAddUnavailability} className="px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-semibold hover:bg-primary/20">Ajouter</button>
                </div>
            </div>
        </div>
    );

    const renderHistory = () => {
        if (!hostHistory) return null;

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Accueils au total" value={hostHistory.total} icon={UserGroupIcon} />
                    <StatCard title="Dernier accueil" value={hostHistory.last} icon={ClockIcon} />
                    <StatCard title="Prochain accueil" value={hostHistory.next} icon={CalendarDaysIcon} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div>
                        <h4 className="font-bold mb-2">Prochains accueils ({hostHistory.upcomingVisits.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {hostHistory.upcomingVisits.length > 0 ? (
                                hostHistory.upcomingVisits.map(v => <VisitHistoryItem key={v.visitId} visit={v} />)
                            ) : (
                                <p className="text-sm text-text-muted dark:text-text-muted-dark text-center py-4">Aucun accueil programmé.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Accueils passés ({hostHistory.pastVisits.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {hostHistory.pastVisits.length > 0 ? (
                                hostHistory.pastVisits.map(v => <VisitHistoryItem key={v.visitId} visit={v} />)
                            ) : (
                                <p className="text-sm text-text-muted dark:text-text-muted-dark text-center py-4">Aucun historique d'accueil.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white rounded-t-xl flex-shrink-0">
                    <div className="flex justify-between items-start">
                         <h2 className="text-2xl font-bold">{isAdding ? "Ajouter un contact" : `Profil de ${host?.nom}`}</h2>
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
                                    onClick={() => setActiveTab('history')}
                                    className={`${ activeTab === 'history' ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white' } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Historique d'accueil
                                </button>
                            </nav>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    {activeTab === 'details' ? renderDetailsForm() : renderHistory()}
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex justify-end space-x-3 border-t border-border-light dark:border-border-dark rounded-b-xl flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-border-dark rounded-md text-sm font-medium text-text-main dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-primary-light/20">
                        Annuler
                    </button>
                    {activeTab === 'details' && (
                        <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark border border-transparent rounded-md text-sm font-medium text-white">
                            Enregistrer
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};