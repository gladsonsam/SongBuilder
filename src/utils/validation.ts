import { z } from 'zod';
import DOMPurify from 'dompurify';
import { notifications } from '@mantine/notifications';
import type { Chord, Section, Song } from '../types/song';

// Chord validation schema
export const ChordSchema = z.object({
  id: z.string().min(1, 'Chord ID is required'),
  text: z.string()
    .min(1, 'Chord text is required')
    .max(10, 'Chord text too long')
    .trim()
    .refine(val => !/<script/i.test(val), 'Invalid characters in chord'),
  position: z.number()
    .int('Position must be an integer')
    .min(0, 'Position cannot be negative'),
  line: z.number()
    .int('Line must be an integer')
    .min(0, 'Line cannot be negative')
});

// Section validation schema
export const SectionSchema = z.object({
  type: z.enum(['verse', 'chorus', 'bridge', 'tag', 'break', 'intro', 'outro', 'pre-chorus']),
  content: z.string()
    .max(5000, 'Section content too long')
    .transform(val => DOMPurify.sanitize(val, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    })),
  number: z.number()
    .int('Section number must be an integer')
    .positive('Section number must be positive')
    .optional(),
  chords: z.array(ChordSchema)
    .max(100, 'Too many chords in section')
});

// Song validation schema
export const SongSchema = z.object({
  id: z.string().min(1, 'Song ID is required'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .trim()
    .refine(val => !/<script/i.test(val), 'Invalid characters in title'),
  artist: z.string()
    .min(1, 'Artist is required')
    .max(100, 'Artist name too long')
    .trim()
    .refine(val => !/<script/i.test(val), 'Invalid characters in artist name'),
  sections: z.array(SectionSchema)
    .min(1, 'At least one section is required')
    .max(50, 'Too many sections'),
  createdAt: z.string()
    .datetime('Invalid creation date format'),
  updatedAt: z.string()
    .datetime('Invalid update date format'),
  originalKey: z.string()
    .max(10, 'Original key too long')
    .optional(),
  transposedKey: z.string()
    .max(10, 'Transposed key too long')
    .optional(),
  originalSections: z.array(SectionSchema)
    .optional(),
  tags: z.array(
    z.string()
      .max(50, 'Tag too long')
      .trim()
      .refine(val => !/<script/i.test(val), 'Invalid characters in tag')
  )
    .max(20, 'Too many tags')
    .optional(),
  notes: z.string()
    .max(5000, 'Notes too long')
    .optional()
    .transform(val => val ? DOMPurify.sanitize(val, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p', 'strong', 'em'],
      ALLOWED_ATTR: []
    }) : val),
  currentTranspose: z.string()
    .max(10, 'Current transpose too long')
    .optional()
});

// Partial schemas for updates
export const SongUpdateSchema = SongSchema.partial().omit({ id: true });

// Form-specific schemas
export const SongMetadataSchema = z.object({
  title: SongSchema.shape.title,
  artist: SongSchema.shape.artist,
  tags: SongSchema.shape.tags
});

export const SectionFormSchema = z.object({
  type: SectionSchema.shape.type,
  content: z.string().max(5000, 'Section content too long'), // Don't sanitize during typing
  number: SectionSchema.shape.number
});

// Error handling
export const ValidationErrorType = {
  VALIDATION: 'validation',
  SANITIZATION: 'sanitization',
  UNKNOWN: 'unknown'
} as const;

export type ValidationErrorType = typeof ValidationErrorType[keyof typeof ValidationErrorType];


export class ValidationError extends Error {
  public type: ValidationErrorType;
  public details?: string[];
  
  constructor(
    type: ValidationErrorType,
    message: string,
    details?: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
    this.type = type;
    this.details = details;
  }
}

// Validation hook
export const useValidation = () => {
  const validateSong = (song: unknown): Song | null => {
    try {
      return SongSchema.parse(song);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        notifications.show({
          title: 'Invalid song data',
          message: messages.join(', '),
          color: 'red'
        });
        
        throw new ValidationError(
          ValidationErrorType.VALIDATION,
          'Song validation failed',
          messages
        );
      }
      
      throw new ValidationError(
        ValidationErrorType.UNKNOWN,
        'Unknown validation error'
      );
    }
  };

  const validateSongUpdate = (updates: unknown): Partial<Song> | null => {
    try {
      return SongUpdateSchema.parse(updates);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        notifications.show({
          title: 'Invalid update data',
          message: messages.join(', '),
          color: 'red'
        });
        
        throw new ValidationError(
          ValidationErrorType.VALIDATION,
          'Song update validation failed',
          messages
        );
      }
      
      throw new ValidationError(
        ValidationErrorType.UNKNOWN,
        'Unknown validation error'
      );
    }
  };

  const validateSongMetadata = (metadata: unknown): { title: string; artist: string; tags?: string[] } | null => {
    try {
      return SongMetadataSchema.parse(metadata);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        notifications.show({
          title: 'Invalid metadata',
          message: messages.join(', '),
          color: 'red'
        });
        
        throw new ValidationError(
          ValidationErrorType.VALIDATION,
          'Metadata validation failed',
          messages
        );
      }
      
      throw new ValidationError(
        ValidationErrorType.UNKNOWN,
        'Unknown validation error'
      );
    }
  };

  const validateSection = (section: unknown): Section | null => {
    try {
      // For form validation, we use the form schema and then convert
      const formData = SectionFormSchema.parse(section);
      return {
        ...formData,
        content: DOMPurify.sanitize(formData.content, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        chords: [] // Chords are added separately
      } as Section;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        notifications.show({
          title: 'Invalid section data',
          message: messages.join(', '),
          color: 'red'
        });
        
        throw new ValidationError(
          ValidationErrorType.VALIDATION,
          'Section validation failed',
          messages
        );
      }
      
      throw new ValidationError(
        ValidationErrorType.UNKNOWN,
        'Unknown validation error'
      );
    }
  };

  const validateChord = (chord: unknown): Chord | null => {
    try {
      return ChordSchema.parse(chord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        notifications.show({
          title: 'Invalid chord data',
          message: messages.join(', '),
          color: 'red'
        });
        
        throw new ValidationError(
          ValidationErrorType.VALIDATION,
          'Chord validation failed',
          messages
        );
      }
      
      throw new ValidationError(
        ValidationErrorType.UNKNOWN,
        'Unknown validation error'
      );
    }
  };

  return {
    validateSong,
    validateSongUpdate,
    validateSongMetadata,
    validateSection,
    validateChord
  };
};

// Safe content sanitization utilities
export const sanitizeContent = (content: string, allowedTags: string[] = ['b', 'i', 'u', 'br', 'p']): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
};

export const sanitizeTextContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};