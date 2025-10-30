/**
 * Composant de gestion des backups
 */
import React, { useState, useEffect } from 'react';
import { backupManager } from '../utils/backup';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { CloudArrowDownIcon, CloudArrowUpIcon, TrashIcon, DocumentIcon } from './Icons';

interface BackupInfo {
  name: string;
  date: string;
  manual: boolean;
  size?: number;
}

export const BackupManager: React.FC = () => {
  const { appData, importData } = useData();
  const { addToast } = useToast();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const backupList = await backupManager.listBackups();
      setBackups(backupList);
    } catch (error) {
      addToast('Erreur lors du chargement des backups', 'error');
    }
  };

  const createManualBackup = async () => {
    if (!appData) return;
    
    setLoading(true);
    try {
      const success = await backupManager.createBackup(appData, true);
      if (success) {
        addToast('Backup créé avec succès', 'success');
        await loadBackups();
      } else {
        addToast('Erreur lors de la création du backup', 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la création du backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (fileName: string) => {
    setLoading(true);
    try {
      const result = await backupManager.restoreBackup(fileName);
      if (result.success && result.data) {
        await importData(result.data);
        addToast('Backup restauré avec succès', 'success');
      } else {
        addToast(result.error || 'Erreur lors de la restauration', 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la restauration du backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (fileName: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce backup ?')) return;
    
    try {
      const success = await backupManager.deleteBackup(fileName);
      if (success) {
        addToast('Backup supprimé', 'success');
        await loadBackups();
      } else {
        addToast('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la suppression du backup', 'error');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-main dark:text-text-main-dark">
          Gestion des Backups
        </h3>
        <button
          onClick={createManualBackup}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50"
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          Créer un backup
        </button>
      </div>

      <div className="bg-card-light dark:bg-card-dark rounded-lg p-4">
        <p className="text-sm text-text-muted dark:text-text-muted-dark mb-4">
          Les backups automatiques sont créés quotidiennement. Vous pouvez également créer des backups manuels.
        </p>

        {backups.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-muted-dark">
            <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun backup disponible</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <DocumentIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-text-main dark:text-text-main-dark">
                      {backup.manual ? 'Backup Manuel' : 'Backup Automatique'}
                    </p>
                    <p className="text-xs text-text-muted dark:text-text-muted-dark">
                      {formatDate(backup.date)} • {formatFileSize(backup.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreBackup(backup.name)}
                    disabled={loading}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Restaurer"
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                  </button>
                  
                  {backup.manual && (
                    <button
                      onClick={() => deleteBackup(backup.name)}
                      disabled={loading}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
          ⚠️ Important
        </h4>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li>• Les backups automatiques sont conservés pendant 10 jours maximum</li>
          <li>• Les backups manuels doivent être supprimés manuellement</li>
          <li>• La restauration remplacera toutes vos données actuelles</li>
        </ul>
      </div>
    </div>
  );
};