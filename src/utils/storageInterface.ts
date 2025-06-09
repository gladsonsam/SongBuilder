import type { Song } from '../types/song';

// Storage interface that both local and cloud storage implement
export interface StorageService {
  saveSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getAllSongs(): Promise<Song[]>;
  getSong(id: string): Promise<Song | null>;
  updateSong(song: Song): Promise<void>;
  deleteSong(id: string): Promise<void>;
  clearDatabase(): Promise<void>;
  exportDB(): Promise<string>;
  importDB(json: string): Promise<void>;
}

// Storage modes
export const StorageMode = {
  LOCAL: 'local' as const,   // Browser IndexedDB - temporary
  CLOUD: 'cloud' as const    // Appwrite - persistent
};

export type StorageMode = typeof StorageMode[keyof typeof StorageMode];