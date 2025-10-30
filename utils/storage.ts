export function checkStorageWarning(dataSize: number): { warning: boolean; message?: string } {
    const threshold = 5 * 1024 * 1024; // 5MB
    if (dataSize > threshold) {
        return {
            warning: true,
            message: `Les données occupent ${formatSize(dataSize)}. Envisagez d'archiver les anciennes visites.`
        };
    }
    return { warning: false };
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
