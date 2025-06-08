import { databases, config, generateId } from './appwrite';
import { Query } from 'appwrite';
import { logger } from './logger';
import type { Song, Section } from '../types/song';

// Re-export types for compatibility
export type { Song, Section } from '../types/song';

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
  try {
    const processedTags = Array.isArray(song.tags) 
      ? song.tags
          .map(tag => String(tag).trim())
          .filter(tag => tag.length > 0)
      : [];
    
    const songId = generateId();
    const now = new Date().toISOString();
    
    // Create clean object with only allowed fields
    const songWithMetadata: Omit<AppwriteSong, '$id'> = {
      id: songId,
      title: song.title,
      artist: song.artist,
      sections: JSON.stringify(song.sections), // Convert sections to JSON string
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
  try {
    const processedTags = Array.isArray(song.tags) 
      ? song.tags
          .map(tag => String(tag).trim())
          .filter(tag => tag.length > 0)
      : [];
    
    const updateData: Partial<AppwriteSong> = {
      title: song.title,
      artist: song.artist,
      sections: JSON.stringify(song.sections), // Convert sections to JSON string
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
  const songs = await getAllSongs();
  return JSON.stringify(songs, null, 2);
}

export async function importDB(json: string): Promise<void> {
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