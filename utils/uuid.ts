export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback sécurisé utilisant crypto.getRandomValues()
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant bits
        
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
    }
    
    // Fallback final pour environnements sans crypto
    const template = '10000000-1000-4000-8000-100000000000';
    let i = 0;
    return template.replace(/[018]/g, () => {
        const r = (Math.random() * 16) | 0;
        const v = i++ % 4 === 0 ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
