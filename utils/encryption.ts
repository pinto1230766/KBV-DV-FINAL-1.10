// Utilitaires de chiffrement AES256 pour les documents sensibles
// Utilise Web Crypto API pour le chiffrement côté client

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Génère une clé AES256 à partir d'un mot de passe
export async function generateKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Chiffre des données avec AES256-GCM
export async function encryptData(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await generateKeyFromPassword(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(data)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

// Déchiffre des données avec AES256-GCM
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await generateKeyFromPassword(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch {
    throw new Error('Échec du déchiffrement - mot de passe incorrect ou données corrompues');
  }
}

// Génère un mot de passe fort pour le chiffrement
export function generateEncryptionPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Hash un mot de passe pour le stockage sécurisé (unidirectionnel)
export async function hashPassword(password: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Vérifie si un mot de passe correspond à un hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}