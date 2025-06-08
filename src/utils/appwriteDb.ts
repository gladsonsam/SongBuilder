import { databases, config, generateId } from './appwrite';
import { Query } from 'appwrite';
import { logger } from './logger';

export interface Song {
  $id?: string;
  id: string;
  title: string;
  artist: string;
  sections: Section[] | string; // Can be array in app or JSON string in database
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  notes?: string;
}

export interface Section {
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus';
  content: string;
  number?: number;
  chords: {
    id: string;
    text: string;
    position: number;
    line: number;
  }[];
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
    const songWithMetadata = {
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
    
    // Parse sections from JSON string back to object
    const songs = result.documents.map(doc => ({
      ...doc,
      sections: typeof doc.sections === 'string' ? JSON.parse(doc.sections) : doc.sections
    })) as Song[];
    
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
    
    // Parse sections from JSON string back to object
    const song = {
      ...result,
      sections: typeof result.sections === 'string' ? JSON.parse(result.sections) : result.sections
    } as Song;
    
    return song;
  } catch (error) {
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
    
    const updatedSong = {
      ...song,
      updatedAt: new Date().toISOString(),
      tags: processedTags,
      sections: JSON.stringify(song.sections) // Convert sections to JSON string
    };

    // Remove $id from the update payload
    const { $id, ...updateData } = updatedSong;

    await databases.updateDocument(
      config.databaseId,
      config.songsCollectionId,
      song.$id || song.id,
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
      await deleteSong(song.$id || song.id);
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