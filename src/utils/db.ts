import { logger } from './logger';

const DB_NAME = 'songbuilder';
const DB_VERSION = 2;
let db: IDBDatabase | null = null;

export interface Song {
  id: string;
  title: string;
  artist: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // Array of tags for categorizing songs
}

export interface Section {
  type: 'verse' | 'chorus' | 'bridge' | 'tag';
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
      
      // Handle version upgrade
      if (!database.objectStoreNames.contains('songs')) {
        logger.log('Creating songs store');
        database.createObjectStore('songs', { keyPath: 'id' });
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

      const songWithMetadata: Song = {
        ...song,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: song.tags || [] // Initialize with empty array if not provided
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

      const updatedSong = {
        ...song,
        updatedAt: new Date().toISOString()
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