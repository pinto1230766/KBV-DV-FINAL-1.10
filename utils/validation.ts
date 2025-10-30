/**
 * Schémas de validation avec Zod
 */
import { z } from 'zod';

// Validation des données de base
export const SpeakerSchema = z.object({
  id: z.string().min(1),
  nom: z.string().min(1).max(100),
  congregation: z.string().max(100),
  telephone: z.string().optional(),
  notes: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  tags: z.array(z.string().max(50)).optional(),
  isVehiculed: z.boolean().optional(),
  talkHistory: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    talkNo: z.string().optional(),
    theme: z.string().optional()
  })).optional()
});

export const HostSchema = z.object({
  nom: z.string().min(1).max(100),
  telephone: z.string().max(20),
  gender: z.enum(['male', 'female', 'couple']),
  adresse: z.string().max(200).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).optional(),
  unavailabilities: z.array(z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })).optional()
});

export const VisitSchema = z.object({
  id: z.string().min(1),
  visitId: z.string().min(1),
  nom: z.string().min(1).max(100),
  congregation: z.string().max(100),
  telephone: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  host: z.string().max(100),
  accommodation: z.string().max(500),
  meals: z.string().max(500),
  notes: z.string().max(1000).optional(),
  status: z.enum(['confirmed', 'pending', 'cancelled', 'completed']),
  locationType: z.enum(['physical', 'zoom', 'streaming']),
  talkNoOrType: z.string().optional(),
  talkTheme: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string().max(255),
    dataUrl: z.string(),
    size: z.number().positive()
  })).optional(),
  expenses: z.array(z.any()).optional(),
  communicationStatus: z.record(z.any()).optional(),
  checklist: z.array(z.object({
    text: z.string().max(200),
    completed: z.boolean()
  })).optional(),
  feedback: z.object({
    rating: z.number().min(1).max(5),
    tags: z.array(z.string()),
    comment: z.string().max(1000),
    date: z.string()
  }).optional()
});

// Fonction utilitaire pour valider les données
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Erreur de validation inconnue'] };
  }
};

// Validation des entrées utilisateur
export const sanitizeAndValidate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = validateData(schema, data);
  if (!result.success) {
    throw new Error(`Données invalides: ${result.errors.join(', ')}`);
  }
  return result.data;
};