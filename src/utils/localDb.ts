// Local IndexedDB implementation for public users (temporary storage)
import type { Song } from '../types/song';
import type { StorageService } from './storageInterface';
import { logger } from './logger';

const DB_NAME = 'songbuilder-local';
const DB_VERSION = 1;
let db: IDBDatabase | null = null;

async function initLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close();
      db = null;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Local database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      logger.log('Local database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target ? (event.target as IDBOpenDBRequest).result : request.result;
      
      if (!database.objectStoreNames.contains('songs')) {
        database.createObjectStore('songs', { keyPath: 'id' });
      }
    };
  });
}

export class LocalStorageService implements StorageService {
  async saveSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const database = await initLocalDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');

      const songWithMetadata: Song = {
        ...song,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: song.tags || [],
        notes: song.notes || ''
      };

      const request = store.add(songWithMetadata);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.log('Song saved locally:', songWithMetadata.id);
        resolve(songWithMetadata.id);
      };
    });
  }

  async getAllSongs(): Promise<Song[]> {
    const database = await initLocalDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.log('Retrieved local songs:', request.result?.length || 0);
        resolve(request.result || []);
      };
    });
  }

  async getSong(id: string): Promise<Song | null> {
    const database = await initLocalDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async updateSong(song: Song): Promise<void> {
    const database = await initLocalDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');

      const updatedSong = {
        ...song,
        updatedAt: new Date().toISOString()
      };

      const request = store.put(updatedSong);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.log('Song updated locally:', song.id);
        resolve();
      };
    });
  }

  async deleteSong(id: string): Promise<void> {
    const database = await initLocalDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.log('Song deleted locally:', id);
        resolve();
      };
    });
  }

  async clearDatabase(): Promise<void> {
    const database = await initLocalDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['songs'], 'readwrite');
      const store = transaction.objectStore('songs');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.log('Local database cleared');
        resolve();
      };
    });
  }

  async exportDB(): Promise<string> {
    const songs = await this.getAllSongs();
    return JSON.stringify(songs, null, 2);
  }

  async importDB(json: string): Promise<void> {
    const songs = JSON.parse(json) as Song[];
    
    for (const song of songs) {
      const { id, createdAt, updatedAt, ...songData } = song;
      await this.saveSong(songData);
    }
  }
}