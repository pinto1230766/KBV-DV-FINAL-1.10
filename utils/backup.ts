/**
 * Système de backup automatique
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { logger } from './logger';

interface BackupData {
  version: string;
  timestamp: string;
  data: any;
  checksum: string;
}

class BackupManager {
  private readonly BACKUP_DIR = 'backups';
  private readonly MAX_BACKUPS = 10;

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async ensureBackupDirectory(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Filesystem.mkdir({
        path: this.BACKUP_DIR,
        directory: Directory.Documents,
        recursive: true
      });
    } catch (error) {
      // Le dossier existe déjà, c'est normal
      logger.debug('Dossier backup existe déjà');
    }
  }

  async createBackup(data: any, manual: boolean = false): Promise<boolean> {
    try {
      await this.ensureBackupDirectory();

      const timestamp = new Date().toISOString();
      const dataString = JSON.stringify(data, null, 2);
      const checksum = await this.calculateChecksum(dataString);

      const backup: BackupData = {
        version: '1.0.0',
        timestamp,
        data,
        checksum
      };

      const fileName = `backup_${timestamp.replace(/[:.]/g, '-')}${manual ? '_manual' : ''}.json`;
      
      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: `${this.BACKUP_DIR}/${fileName}`,
          data: JSON.stringify(backup, null, 2),
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } else {
        // Fallback pour le web - utiliser localStorage
        const backups = this.getWebBackups();
        backups.push({ fileName, data: backup });
        
        // Garder seulement les derniers backups
        if (backups.length > this.MAX_BACKUPS) {
          backups.splice(0, backups.length - this.MAX_BACKUPS);
        }
        
        localStorage.setItem('app_backups', JSON.stringify(backups));
      }

      await this.cleanOldBackups();
      
      logger.info('Backup créé avec succès', { fileName, manual, size: dataString.length });
      return true;

    } catch (error) {
      logger.error('Erreur création backup', error as Error);
      return false;
    }
  }

  private getWebBackups(): Array<{ fileName: string; data: BackupData }> {
    try {
      const stored = localStorage.getItem('app_backups');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async listBackups(): Promise<Array<{ name: string; date: string; manual: boolean; size?: number }>> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.readdir({
          path: this.BACKUP_DIR,
          directory: Directory.Documents
        });

        return result.files
          .filter(file => file.name.endsWith('.json'))
          .map(file => ({
            name: file.name,
            date: this.extractDateFromFileName(file.name),
            manual: file.name.includes('_manual'),
            size: file.size
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        const backups = this.getWebBackups();
        return backups.map(backup => ({
          name: backup.fileName,
          date: backup.data.timestamp,
          manual: backup.fileName.includes('_manual'),
          size: JSON.stringify(backup.data).length
        }));
      }
    } catch (error) {
      logger.error('Erreur listage backups', error as Error);
      return [];
    }
  }

  private extractDateFromFileName(fileName: string): string {
    const match = fileName.match(/backup_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)/);
    return match ? match[1].replace(/-/g, ':').replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') : '';
  }

  async restoreBackup(fileName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let backupContent: string;

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.readFile({
          path: `${this.BACKUP_DIR}/${fileName}`,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        backupContent = result.data as string;
      } else {
        const backups = this.getWebBackups();
        const backup = backups.find(b => b.fileName === fileName);
        if (!backup) {
          return { success: false, error: 'Backup non trouvé' };
        }
        backupContent = JSON.stringify(backup.data);
      }

      const backup: BackupData = JSON.parse(backupContent);
      
      // Vérifier l'intégrité
      const dataString = JSON.stringify(backup.data);
      const calculatedChecksum = await this.calculateChecksum(dataString);
      
      if (calculatedChecksum !== backup.checksum) {
        logger.error('Checksum backup invalide', undefined, { fileName });
        return { success: false, error: 'Backup corrompu' };
      }

      logger.info('Backup restauré avec succès', { fileName, version: backup.version });
      return { success: true, data: backup.data };

    } catch (error) {
      logger.error('Erreur restauration backup', error as Error, { fileName });
      return { success: false, error: 'Erreur de restauration' };
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const automaticBackups = backups.filter(b => !b.manual);

      if (automaticBackups.length > this.MAX_BACKUPS) {
        const toDelete = automaticBackups.slice(this.MAX_BACKUPS);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.name);
        }
        
        logger.info('Anciens backups supprimés', { count: toDelete.length });
      }
    } catch (error) {
      logger.error('Erreur nettoyage backups', error as Error);
    }
  }

  async deleteBackup(fileName: string): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Filesystem.deleteFile({
          path: `${this.BACKUP_DIR}/${fileName}`,
          directory: Directory.Documents
        });
      } else {
        const backups = this.getWebBackups();
        const filtered = backups.filter(b => b.fileName !== fileName);
        localStorage.setItem('app_backups', JSON.stringify(filtered));
      }

      logger.info('Backup supprimé', { fileName });
      return true;
    } catch (error) {
      logger.error('Erreur suppression backup', error as Error, { fileName });
      return false;
    }
  }

  // Backup automatique quotidien
  async scheduleAutoBackup(data: any): Promise<void> {
    const lastBackup = localStorage.getItem('last_auto_backup');
    const today = new Date().toDateString();

    if (lastBackup !== today) {
      const success = await this.createBackup(data, false);
      if (success) {
        localStorage.setItem('last_auto_backup', today);
      }
    }
  }
}

export const backupManager = new BackupManager();