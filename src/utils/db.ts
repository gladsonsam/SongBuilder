import { logger } from './logger';

const DB_NAME = 'songbuilder';
const DB_VERSION = 3;
let db: IDBDatabase | null = null;

export interface Song {
  id: string;
  title: string;
  artist: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // Array of tags for categorizing songs
  notes?: string; // Rich text notes for the song
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

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Close existing connection if any
    if (db) {
      db.close();
      db = null;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      logger.log('Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      logger.log('Database upgrade needed');
      const database = event.target ? (event.target as IDBOpenDBRequest).result : request.result;
      const oldVersion = event.oldVersion;
      
      // Handle version upgrade
      if (!database.objectStoreNames.contains('songs')) {
        logger.log('Creating songs store');
        database.createObjectStore('songs', { keyPath: 'id' });
      }
      
      // Add notes field in version 3
      if (oldVersion < 3) {
        logger.log('Upgrading to version 3: Adding notes field');
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const songsStore = transaction.objectStore('songs');
          // Get all existing songs
          songsStore.openCursor().onsuccess = function(cursorEvent) {
            const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue>)?.result;
            if (cursor) {
              // Update each song to include empty notes if not present
              const song = cursor.value;
              if (!song.notes) {
                song.notes = '';
                cursor.update(song);
              }
              cursor.continue();
            }
          };
        }
      }
    };

    request.onblocked = () => {
      console.error('Database blocked. Please close other tabs using the app and reload.');
      reject(new Error('Database blocked'));
    };
  });
}

// Initialize database when the module loads
initDB().catch(error => {
  logger.error('Failed to initialize database:', error);
});

export async function saveSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');

      // Ensure tags are properly formatted as an array of strings
      const processedTags = Array.isArray(song.tags) 
        ? song.tags
            .map(tag => String(tag).trim())
            .filter(tag => tag.length > 0)
        : [];
      
      console.log('saveSong - Processing tags:', { original: song.tags, processed: processedTags });
      
      const songWithMetadata: Song = {
        ...song,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: processedTags, // Use the properly processed tags
        notes: song.notes || '' // Initialize with empty string if not provided
      };

      const request = store.add(songWithMetadata);

      request.onerror = () => {
        console.error('Failed to save song:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('Song saved successfully:', songWithMetadata.id);
        resolve(songWithMetadata.id);
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };

      transaction.oncomplete = () => {
        logger.log('Transaction completed');
      };
    });
  } catch (error) {
    console.error('Error in saveSong:', error);
    throw error;
  }
}

export async function getAllSongs(): Promise<Song[]> {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.getAll();

      request.onerror = () => {
        console.error('Failed to get all songs:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('Retrieved songs:', request.result?.length || 0);
        resolve(request.result || []);
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Error in getAllSongs:', error);
    throw error;
  }
}

export async function getSong(id: string): Promise<Song | null> {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.get(id);

      request.onerror = () => {
        console.error('Failed to get song:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('Retrieved song:', id, request.result ? 'found' : 'not found');
        resolve(request.result || null);
      };
    });
  } catch (error) {
    console.error('Error in getSong:', error);
    throw error;
  }
}

export async function updateSong(song: Song): Promise<void> {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');

      // Ensure tags are properly formatted as an array of strings
      const processedTags = Array.isArray(song.tags) 
        ? song.tags
            .map(tag => String(tag).trim())
            .filter(tag => tag.length > 0)
        : [];
      
      console.log('updateSong - Processing tags:', { original: song.tags, processed: processedTags });
      
      const updatedSong = {
        ...song,
        updatedAt: new Date().toISOString(),
        tags: processedTags // Use the properly processed tags
      };

      const request = store.put(updatedSong);

      request.onerror = () => {
        console.error('Failed to update song:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('Song updated successfully:', song.id);
        resolve();
      };
    });
  } catch (error) {
    console.error('Error in updateSong:', error);
    throw error;
  }
}

export async function deleteSong(id: string): Promise<void> {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.delete(id);

      request.onerror = () => {
        console.error('Failed to delete song:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('Song deleted successfully:', id);
        resolve();
      };
    });
  } catch (error) {
    console.error('Error in deleteSong:', error);
    throw error;
  }
}

// Optional: Clear all data (useful for testing)
export async function clearDatabase(): Promise<void> {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.clear();

      request.onerror = () => {
        console.error('Failed to clear database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        logger.log('Database cleared successfully');
        resolve();
      };
    });
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
  const songs = JSON.parse(json) as Song[];
  const db = await initDB() as IDBDatabase;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('songs', 'readwrite');
    const store = transaction.objectStore('songs');
    
    // Clear existing data
    store.clear();
    
    // Add imported songs
    songs.forEach(song => {
      store.add(song);
    });
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
} 