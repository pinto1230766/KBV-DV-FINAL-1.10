import React, { useState, useRef } from 'react';
import { Visit, Expense } from '../types';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { ReceiptIcon, PlusIcon, XIcon, PaperclipIcon, DocumentTextIcon, UploadIcon, CheckCircleIcon, ClockIcon, EyeIcon, LockClosedIcon } from './Icons';
import { generateUUID } from '../utils/uuid';
import { encryptData, decryptData, generateEncryptionPassword } from '../utils/encryption';

interface ExpenseManagementProps {
    visit: Visit;
    onClose: () => void;
    onExpenseStatusChange?: (status: Visit['expenseStatus']) => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ visit, onClose, onExpenseStatusChange }) => {
    const { updateVisit } = useData();
    const { addToast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>(visit.expenses || []);
    const [showAddForm, setShowAddForm] = useState(false);
    const [expenseStatus, setExpenseStatus] = useState<Visit['expenseStatus']>(visit.expenseStatus || 'not_sent');
    const [encryptionEnabled, setEncryptionEnabled] = useState(false);
    const [encryptionPassword, setEncryptionPassword] = useState('');
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'transport' as Expense['category'],
        receiptUrl: '',
        receiptFile: null as File | null,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const expenseFormInputRef = useRef<HTMLInputElement>(null);

    const handleAddExpense = () => {
        if (!newExpense.description.trim() || !newExpense.amount.trim()) {
            addToast("Veuillez remplir tous les champs obligatoires.", 'error');
            return;
        }

        const amount = parseFloat(newExpense.amount);
        if (isNaN(amount) || amount <= 0) {
            addToast("Le montant doit être un nombre positif.", 'error');
            return;
        }

        const expense: Expense = {
            id: generateUUID(),
            date: new Date().toISOString().split('T')[0],
            description: newExpense.description.trim(),
            amount,
            category: newExpense.category,
            receiptUrl: newExpense.receiptUrl || undefined,
        };

        const updatedExpenses = [...expenses, expense];
        setExpenses(updatedExpenses);

        // Update visit with new expenses
        updateVisit({ ...visit, expenses: updatedExpenses });

        // Reset form
        setNewExpense({
            description: '',
            amount: '',
            category: 'transport',
            receiptUrl: '',
            receiptFile: null,
        });
        setShowAddForm(false);
        addToast("Dépense ajoutée avec succès.", 'success');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast("Le fichier ne doit pas dépasser 5MB.", 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setNewExpense(prev => ({
                    ...prev,
                    receiptUrl: dataUrl,
                    receiptFile: file,
                    receiptFileName: file.name,
                    receiptFileSize: file.size,
                    receiptMimeType: file.type
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExpenseFormUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit for forms
                addToast("Le formulaire ne doit pas dépasser 10MB.", 'error');
                return;
            }

            if (!file.type.includes('pdf')) {
                addToast("Le formulaire doit être un fichier PDF.", 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;

                let finalDataUrl = dataUrl;
                let encryptionKey = '';

                // Chiffrement optionnel pour les documents sensibles
                if (encryptionEnabled && encryptionPassword) {
                    try {
                        const encrypted = await encryptData(dataUrl, encryptionPassword);
                        finalDataUrl = `encrypted:${encrypted}`;
                        encryptionKey = await generateEncryptionPassword(); // Clé de déchiffrement
                        addToast("Document chiffré avec AES256.", 'info');
                    } catch {
                        addToast("Erreur lors du chiffrement du document.", 'error');
                        return;
                    }
                }

                const updatedVisit = {
                    ...visit,
                    expenseFormUrl: finalDataUrl,
                    expenseFormFileName: file.name,
                    expenseFormMimeType: file.type,
                    expenseFormEncryptionKey: encryptionKey,
                    expenseFormSubmittedAt: new Date().toISOString(),
                    expenseStatus: 'received' as const
                };
                updateVisit(updatedVisit);
                setExpenseStatus('received');
                onExpenseStatusChange?.('received');
                addToast("Formulaire de frais reçu avec succès.", 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStatusChange = (newStatus: Visit['expenseStatus']) => {
        const updatedVisit = { ...visit, expenseStatus: newStatus };
        updateVisit(updatedVisit);
        setExpenseStatus(newStatus);
        onExpenseStatusChange?.(newStatus);

        const statusMessages = {
            sent: "Statut mis à jour : Formulaire envoyé",
            received: "Statut mis à jour : Formulaire reçu",
            validated: "Statut mis à jour : Formulaire validé",
            reimbursed: "Statut mis à jour : Frais remboursés"
        };
        addToast(statusMessages[newStatus] || "Statut mis à jour", 'success');
    };

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3">
                        <ReceiptIcon className="w-6 h-6 text-primary" />
                        <div>
                            <h2 className="text-xl font-bold text-text-main dark:text-text-main-dark">
                                Gestion des frais - {visit.nom}
                            </h2>
                            <p className="text-sm text-text-muted dark:text-text-muted-dark">
                                Visite du {new Date(visit.visitDate).toLocaleDateString('fr-FR')}
                            </p>
                            {/* Expense Status Badge */}
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    expenseStatus === 'not_sent' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                    expenseStatus === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                    expenseStatus === 'received' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                    expenseStatus === 'validated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                    expenseStatus === 'reimbursed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {expenseStatus === 'not_sent' && <ClockIcon className="w-3 h-3 mr-1" />}
                                    {expenseStatus === 'sent' && <DocumentTextIcon className="w-3 h-3 mr-1" />}
                                    {expenseStatus === 'received' && <UploadIcon className="w-3 h-3 mr-1" />}
                                    {expenseStatus === 'validated' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                                    {expenseStatus === 'reimbursed' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                                    {expenseStatus === 'not_sent' ? 'Non envoyé' :
                                     expenseStatus === 'sent' ? 'Envoyé' :
                                     expenseStatus === 'received' ? 'Reçu' :
                                     expenseStatus === 'validated' ? 'Validé' :
                                     expenseStatus === 'reimbursed' ? 'Remboursé' : 'Statut inconnu'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary-light/20"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Expense Form Management */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-card-dark/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark mb-3">
                            Formulaire de frais
                        </h3>
                        <div className="space-y-3">
                            {visit.expenseFormUrl ? (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-card-dark rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-text-main dark:text-text-main-dark">
                                                {visit.expenseFormFileName || 'formulaire-frais.pdf'}
                                            </p>
                                            <p className="text-sm text-text-muted dark:text-text-muted-dark">
                                                Reçu le {visit.expenseFormSubmittedAt ? new Date(visit.expenseFormSubmittedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {visit.expenseFormUrl?.startsWith('encrypted:') && (
                                            <LockClosedIcon className="w-4 h-4 text-yellow-600" />
                                        )}
                                        <button
                                            onClick={async () => {
                                                let dataUrl = visit.expenseFormUrl;

                                                // Déchiffrement si nécessaire
                                                if (dataUrl?.startsWith('encrypted:')) {
                                                    const password = prompt('Entrez le mot de passe pour déchiffrer le document:');
                                                    if (!password) return;

                                                    try {
                                                        const encryptedData = dataUrl.replace('encrypted:', '');
                                                        dataUrl = await decryptData(encryptedData, password);
                                                        addToast("Document déchiffré avec succès.", 'success');
                                                    } catch {
                                                        addToast("Mot de passe incorrect ou document corrompu.", 'error');
                                                        return;
                                                    }
                                                }

                                                if (visit.expenseFormMimeType?.startsWith('image/')) {
                                                    // Prévisualisation d'image
                                                    const previewWindow = window.open('', '_blank', 'width=600,height=400');
                                                    if (previewWindow) {
                                                        previewWindow.document.write(`
                                                            <html>
                                                                <head>
                                                                    <title>Formulaire de frais - ${visit.nom}</title>
                                                                    <style>body{margin:0;padding:20px;text-align:center;background:#f5f5f5;}img{max-width:100%;max-height:80vh;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}</style>
                                                                </head>
                                                                <body>
                                                                    <img src="${dataUrl}" alt="Formulaire de frais" />
                                                                    <p style="margin-top:10px;color:#666;">Formulaire de frais - ${visit.nom}</p>
                                                                </body>
                                                            </html>
                                                        `);
                                                    }
                                                } else {
                                                    window.open(dataUrl, '_blank');
                                                }
                                            }}
                                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                                        >
                                            Voir
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-text-muted dark:text-text-muted-dark mb-3">Aucun formulaire reçu</p>
                                    <button
                                        onClick={() => expenseFormInputRef.current?.click()}
                                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
                                    >
                                        Ajouter le PDF signé
                                    </button>
                                </div>
                            )}

                            {/* Security Settings */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="checkbox"
                                        id="encryptionEnabled"
                                        checked={encryptionEnabled}
                                        onChange={(e) => setEncryptionEnabled(e.target.checked)}
                                        className="rounded border-border-light dark:border-border-dark"
                                    />
                                    <label htmlFor="encryptionEnabled" className="text-sm font-medium text-text-main dark:text-text-main-dark flex items-center gap-1">
                                        <LockClosedIcon className="w-4 h-4" />
                                        Chiffrement AES256
                                    </label>
                                </div>
                                {encryptionEnabled && (
                                    <div className="w-full mt-2">
                                        <input
                                            type="password"
                                            placeholder="Mot de passe de chiffrement"
                                            value={encryptionPassword}
                                            onChange={(e) => setEncryptionPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark text-sm"
                                        />
                                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">
                                            ⚠️ Conservez ce mot de passe - il sera nécessaire pour déchiffrer le document
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Status Management */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                                <span className="text-sm font-medium text-text-main dark:text-text-main-dark mr-2">Statut:</span>
                                {(['sent', 'received', 'validated', 'reimbursed'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                            expenseStatus === status
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-200 dark:bg-primary-light/20 text-text-main dark:text-text-main-dark hover:bg-gray-300 dark:hover:bg-primary-light/30'
                                        }`}
                                    >
                                        {status === 'sent' ? 'Envoyé' :
                                         status === 'received' ? 'Reçu' :
                                         status === 'validated' ? 'Validé' :
                                         status === 'reimbursed' ? 'Remboursé' : status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Expenses List */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark">
                                Dépenses enregistrées
                            </h3>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Ajouter
                            </button>
                        </div>

                        {expenses.length === 0 ? (
                            <div className="text-center py-8 text-text-muted dark:text-text-muted-dark">
                                <ReceiptIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Aucune dépense enregistrée</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {expenses.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-card-dark/50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-text-main dark:text-text-main-dark">
                                                    {expense.description}
                                                </p>
                                                {expense.receiptUrl && (
                                                    <div className="flex items-center gap-1">
                                                        {expense.receiptMimeType?.startsWith('image/') ? (
                                                            <button
                                                                onClick={() => {
                                                                    // Ouvrir une modale de prévisualisation d'image
                                                                    const previewWindow = window.open('', '_blank', 'width=600,height=400');
                                                                    if (previewWindow) {
                                                                        previewWindow.document.write(`
                                                                            <html>
                                                                                <head>
                                                                                    <title>Justificatif - ${expense.description}</title>
                                                                                    <style>body{margin:0;padding:20px;text-align:center;background:#f5f5f5;}img{max-width:100%;max-height:80vh;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}</style>
                                                                                </head>
                                                                                <body>
                                                                                    <img src="${expense.receiptUrl}" alt="${expense.description}" />
                                                                                    <p style="margin-top:10px;color:#666;">${expense.receiptFileName || 'Justificatif'}</p>
                                                                                </body>
                                                                            </html>
                                                                        `);
                                                                    }
                                                                }}
                                                                className="text-primary hover:text-primary-dark"
                                                                title="Voir l'image"
                                                            >
                                                                <EyeIcon className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => window.open(expense.receiptUrl, '_blank')}
                                                                className="text-primary hover:text-primary-dark"
                                                                title="Voir le justificatif"
                                                            >
                                                                <PaperclipIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-text-muted dark:text-text-muted-dark">
                                                <span>{expense.category}</span>
                                                <span>{new Date(expense.date).toLocaleDateString('fr-FR')}</span>
                                                {expense.receiptFileName && (
                                                    <span className="text-xs bg-gray-200 dark:bg-primary-light/20 px-2 py-1 rounded">
                                                        {expense.receiptMimeType?.startsWith('image/') ? '📷' : '📄'} {expense.receiptFileName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-text-main dark:text-text-main-dark">
                                                {expense.amount.toFixed(2)} €
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-border-light dark:border-border-dark pt-3 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-text-main dark:text-text-main-dark">Total</span>
                                        <span className="font-bold text-lg text-primary">{totalExpenses.toFixed(2)} €</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add Expense Form */}
                    {showAddForm && (
                        <div className="border-t border-border-light dark:border-border-dark pt-6">
                            <h4 className="text-lg font-semibold mb-4 text-text-main dark:text-text-main-dark">
                                Ajouter une dépense
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-text-main dark:text-text-main-dark">
                                        Description *
                                    </label>
                                    <input
                                        type="text"
                                        value={newExpense.description}
                                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark"
                                        placeholder="Ex: Train Lyon-Paris"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-text-main dark:text-text-main-dark">
                                            Montant (€) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-text-main dark:text-text-main-dark">
                                            Catégorie
                                        </label>
                                        <select
                                            value={newExpense.category}
                                            onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value as Expense['category'] }))}
                                            className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark"
                                        >
                                            <option value="transport">Transport</option>
                                            <option value="repas">Repas</option>
                                            <option value="hébergement">Hébergement</option>
                                            <option value="autre">Autre</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-text-main dark:text-text-main-dark">
                                        Justificatif (photo ou PDF)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-primary-light/20"
                                        >
                                            <DocumentTextIcon className="w-4 h-4" />
                                            {newExpense.receiptFile ? newExpense.receiptFile.name : 'Sélectionner un fichier'}
                                        </button>
                                        {newExpense.receiptFile && (
                                            <button
                                                onClick={() => setNewExpense(prev => ({ ...prev, receiptFile: null, receiptUrl: '' }))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">
                                        Formats acceptés: images, PDF. Taille max: 5MB
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-text-main dark:text-text-main-dark">
                                        Formulaire de frais signé (PDF)
                                    </label>
                                    <input
                                        ref={expenseFormInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleExpenseFormUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => expenseFormInputRef.current?.click()}
                                        className="flex items-center gap-2 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-primary-light/20"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        {visit.expenseFormUrl ? 'Remplacer le formulaire' : 'Ajouter le PDF signé'}
                                    </button>
                                    <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">
                                        Format accepté: PDF. Taille max: 10MB
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleAddExpense}
                                        className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
                                    >
                                        Ajouter la dépense
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setNewExpense({
                                                description: '',
                                                amount: '',
                                                category: 'transport',
                                                receiptUrl: '',
                                                receiptFile: null,
                                            });
                                        }}
                                        className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-primary-light/20"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseManagement;