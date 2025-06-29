import { databases, config, generateId, account } from './appwrite';
import { Query } from 'appwrite';
import { logger } from './logger';
import type { Song } from '../types/song';
import type { StorageService } from './storageInterface';

// Check if user is authenticated before database operations
async function ensureAuthenticated(): Promise<void> {
  try {
    await account.get();
  } catch (error) {
    throw new Error('User must be authenticated to access cloud database');
  }
}

// Quick authentication check without throwing
async function isAuthenticated(): Promise<boolean> {
  try {
    await account.get();
    return true;
  } catch (error) {
    return false;
  }
}

// Re-export types for compatibility
export type { Song } from '../types/song';

// Appwrite document interface
interface AppwriteDocument {
  $id?: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
}

// Song interface for Appwrite (sections as JSON string)
interface AppwriteSong extends AppwriteDocument {
  id: string;
  title: string;
  artist: string;
  sections: string; // JSON string in database
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

export async function saveSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await ensureAuthenticated();
  try {
    const processedTags = Array.isArray(song.tags) 
      ? song.tags
          .map(tag => String(tag).trim())
          .filter(tag => tag.length > 0)
      : [];
    
    const songId = generateId();
    const now = new Date().toISOString();
    
    // Function to progressively truncate sections until they fit
    const truncateSections = (sections: typeof song.sections, maxLength: number = 10000): string => {
      let json = JSON.stringify(sections);
      if (json.length <= maxLength) return json;
      
      // First attempt: Remove all whitespace from content
      let trimmedSections = sections.map(section => ({
        ...section,
        content: section.content.replace(/\s+/g, ' ').trim(),
        chords: section.chords || []
      }));
      json = JSON.stringify(trimmedSections);
      if (json.length <= maxLength) {
        logger.warn(`Compressed sections by removing whitespace: ${json.length} chars`);
        return json;
      }
      
      // Second attempt: Limit content length progressively
      const maxContentLengths = [2000, 1500, 1000, 750, 500, 300, 200, 100];
      for (const maxLen of maxContentLengths) {
        trimmedSections = sections.map(section => ({
          ...section,
          content: section.content.substring(0, maxLen).trim(),
          chords: (section.chords || []).slice(0, 50) // Also limit chords
        }));
        json = JSON.stringify(trimmedSections);
        if (json.length <= maxLength) {
          logger.warn(`Truncated sections to ${maxLen} chars per section: total ${json.length} chars`);
          return json;
        }
      }
      
      // Final attempt: Keep only essential data
      trimmedSections = sections.slice(0, 10).map(section => ({
        type: section.type,
        content: section.content.substring(0, 100).trim(),
        chords: []
      }));
      json = JSON.stringify(trimmedSections);
      
      if (json.length > maxLength) {
        throw new Error(`Song content is too large even after aggressive truncation. Please split into multiple songs.`);
      }
      
      logger.warn(`Aggressively truncated to first 10 sections with 100 chars each: ${json.length} chars`);
      return json;
    };
    
    // Create clean object with only allowed fields
    const songWithMetadata: Omit<AppwriteSong, '$id'> = {
      id: songId,
      title: song.title,
      artist: song.artist,
      sections: truncateSections(song.sections),
      createdAt: now,
      updatedAt: now,
      tags: processedTags,
      notes: song.notes || ''
    };

    console.log('Saving song with data:', songWithMetadata); // Debug log

    const result = await databases.createDocument(
      config.databaseId,
      config.songsCollectionId,
      songId,
      songWithMetadata
    );

    logger.log('Song saved successfully:', result.$id);
    return result.$id;
  } catch (error) {
    console.error('Error in saveSong:', error);
    throw error;
  }
}

export async function getAllSongs(): Promise<Song[]> {
  await ensureAuthenticated();
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.songsCollectionId,
      [Query.orderDesc('createdAt')]
    );

    logger.log('Retrieved songs:', result.documents.length);
    
    // Convert Appwrite documents to Song objects
    const songs: Song[] = result.documents.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      artist: doc.artist,
      sections: typeof doc.sections === 'string' ? JSON.parse(doc.sections) : doc.sections,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      tags: doc.tags || [],
      notes: doc.notes || ''
    }));
    
    return songs;
  } catch (error) {
    console.error('Error in getAllSongs:', error);
    throw error;
  }
}

export async function getSong(id: string): Promise<Song | null> {
  await ensureAuthenticated();
  try {
    const result = await databases.getDocument(
      config.databaseId,
      config.songsCollectionId,
      id
    );

    logger.log('Retrieved song:', id, result ? 'found' : 'not found');
    
    // Convert Appwrite document to Song object
    const song: Song = {
      id: result.id,
      title: result.title,
      artist: result.artist,
      sections: typeof result.sections === 'string' ? JSON.parse(result.sections) : result.sections,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      tags: result.tags || [],
      notes: result.notes || ''
    };
    
    return song;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    console.error('Error in getSong:', error);
    throw error;
  }
}

export async function updateSong(song: Song): Promise<void> {
  await ensureAuthenticated();
  try {
    const processedTags = Array.isArray(song.tags) 
      ? song.tags
          .map(tag => String(tag).trim())
          .filter(tag => tag.length > 0)
      : [];
    
    // Function to progressively truncate sections until they fit
    const truncateSections = (sections: typeof song.sections, maxLength: number = 10000): string => {
      let json = JSON.stringify(sections);
      if (json.length <= maxLength) return json;
      
      // First attempt: Remove all whitespace from content
      let trimmedSections = sections.map(section => ({
        ...section,
        content: section.content.replace(/\s+/g, ' ').trim(),
        chords: section.chords || []
      }));
      json = JSON.stringify(trimmedSections);
      if (json.length <= maxLength) {
        logger.warn(`Compressed sections by removing whitespace: ${json.length} chars`);
        return json;
      }
      
      // Second attempt: Limit content length progressively
      const maxContentLengths = [2000, 1500, 1000, 750, 500, 300, 200, 100];
      for (const maxLen of maxContentLengths) {
        trimmedSections = sections.map(section => ({
          ...section,
          content: section.content.substring(0, maxLen).trim(),
          chords: (section.chords || []).slice(0, 50) // Also limit chords
        }));
        json = JSON.stringify(trimmedSections);
        if (json.length <= maxLength) {
          logger.warn(`Truncated sections to ${maxLen} chars per section: total ${json.length} chars`);
          return json;
        }
      }
      
      // Final attempt: Keep only essential data
      trimmedSections = sections.slice(0, 10).map(section => ({
        type: section.type,
        content: section.content.substring(0, 100).trim(),
        chords: []
      }));
      json = JSON.stringify(trimmedSections);
      
      if (json.length > maxLength) {
        throw new Error(`Song content is too large even after aggressive truncation. Please split into multiple songs.`);
      }
      
      logger.warn(`Aggressively truncated to first 10 sections with 100 chars each: ${json.length} chars`);
      return json;
    };
    
    const updateData: Partial<AppwriteSong> = {
      title: song.title,
      artist: song.artist,
      sections: truncateSections(song.sections),
      updatedAt: new Date().toISOString(),
      tags: processedTags,
      notes: song.notes || ''
    };

    await databases.updateDocument(
      config.databaseId,
      config.songsCollectionId,
      song.id!,
      updateData
    );

    logger.log('Song updated successfully:', song.id);
  } catch (error) {
    console.error('Error in updateSong:', error);
    throw error;
  }
}

export async function deleteSong(id: string): Promise<void> {
  await ensureAuthenticated();
  try {
    await databases.deleteDocument(
      config.databaseId,
      config.songsCollectionId,
      id
    );

    logger.log('Song deleted successfully:', id);
  } catch (error) {
    console.error('Error in deleteSong:', error);
    throw error;
  }
}

export async function clearDatabase(): Promise<void> {
  await ensureAuthenticated();
  try {
    const songs = await getAllSongs();
    
    for (const song of songs) {
      await deleteSong(song.id!);
    }

    logger.log('Database cleared successfully');
  } catch (error) {
    console.error('Error in clearDatabase:', error);
    throw error;
  }
}

export async function exportDB(): Promise<string> {
  await ensureAuthenticated();
  const songs = await getAllSongs();
  return JSON.stringify(songs, null, 2);
}

export async function importDB(json: string): Promise<void> {
  await ensureAuthenticated();
  const songs = JSON.parse(json) as any[];
  
  for (const song of songs) {
    // Only keep the fields we need for Appwrite schema
    const cleanSong = {
      title: song.title || 'Untitled',
      artist: song.artist || 'Unknown Artist',
      sections: typeof song.sections === 'string' ? JSON.parse(song.sections) : (song.sections || []),
      tags: Array.isArray(song.tags) ? song.tags : [],
      notes: song.notes || ''
    };
    
    await saveSong(cleanSong);
  }
}

// Cloud storage service class
export class CloudStorageService implements StorageService {
  // Check authentication before any operation
  private async checkAuth(): Promise<void> {
    if (!(await isAuthenticated())) {
      throw new Error('Not authenticated - cannot access cloud storage');
    }
  }

  async saveSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.checkAuth();
    return saveSong(song);
  }

  async getAllSongs(): Promise<Song[]> {
    await this.checkAuth();
    return getAllSongs();
  }

  async getSong(id: string): Promise<Song | null> {
    await this.checkAuth();
    return getSong(id);
  }

  async updateSong(song: Song): Promise<void> {
    await this.checkAuth();
    return updateSong(song);
  }

  async deleteSong(id: string): Promise<void> {
    await this.checkAuth();
    return deleteSong(id);
  }

  async clearDatabase(): Promise<void> {
    await this.checkAuth();
    return clearDatabase();
  }

  async exportDB(): Promise<string> {
    await this.checkAuth();
    return exportDB();
  }

  async importDB(json: string): Promise<void> {
    await this.checkAuth();
    return importDB(json);
  }
}