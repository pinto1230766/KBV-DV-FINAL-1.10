import React, { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from './Icons';

interface ResetConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    const [confirmText, setConfirmText] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    
    const requiredText = 'SUPPRIMER TOUT';
    const isConfirmValid = confirmText === requiredText;

    const handleConfirm = async () => {
        if (!isConfirmValid) return;
        
        setIsConfirming(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setIsConfirming(false);
            setConfirmText('');
        }
    };

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Réinitialisation complète
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                            ⚠️ Action irréversible
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Cette action supprimera définitivement :
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 mt-2 list-disc list-inside space-y-1">
                            <li>Tous les orateurs et leurs informations</li>
                            <li>Toutes les visites programmées et archivées</li>
                            <li>Tous les contacts d'accueil</li>
                            <li>Les modèles de messages personnalisés</li>
                            <li>Le profil de la congrégation</li>
                            <li>Tous les paramètres personnalisés</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                            💡 Recommandation
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Avant de continuer, assurez-vous d'avoir téléchargé une sauvegarde récente de vos données.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Pour confirmer, tapez exactement : <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{requiredText}</code>
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Tapez ici..."
                            disabled={isConfirming}
                        />
                    </div>
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClose}
                        disabled={isConfirming}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmValid || isConfirming}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConfirming ? 'Suppression...' : 'Supprimer tout'}
                    </button>
                </div>
            </div>
        </div>
    );
};