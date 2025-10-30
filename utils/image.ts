export async function resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<string> {
    // Validation du type de fichier pour prévenir XSS
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non autorisé');
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            // Validation du résultat
            if (typeof result !== 'string' || !result.startsWith('data:image/')) {
                reject(new Error('Contenu de fichier invalide'));
                return;
            }
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
