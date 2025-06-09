// Storage manager that switches between local and cloud storage
import type { StorageService } from './storageInterface';
import { StorageMode } from './storageInterface';
import { LocalStorageService } from './localDb';
import { CloudStorageService } from './appwriteDb';
import type { Song } from '../types/song';

export class StorageManager implements StorageService {
  private localService: LocalStorageService;
  private cloudService: CloudStorageService;
  private currentMode: StorageMode;

  constructor(mode: StorageMode = StorageMode.LOCAL) {
    this.localService = new LocalStorageService();
    this.cloudService = new CloudStorageService();
    this.currentMode = mode;
  }

  // Switch storage mode (e.g., when user logs in/out)
  setMode(mode: StorageMode): void {
    this.currentMode = mode;
  }

  getCurrentMode(): StorageMode {
    return this.currentMode;
  }

  private getService(): StorageService {
    return this.currentMode === StorageMode.CLOUD 
      ? this.cloudService 
      : this.localService;
  }

  // Delegate all storage operations to the current service
  async saveSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.getService().saveSong(song);
  }

  async getAllSongs(): Promise<Song[]> {
    return this.getService().getAllSongs();
  }

  async getSong(id: string): Promise<Song | null> {
    return this.getService().getSong(id);
  }

  async updateSong(song: Song): Promise<void> {
    return this.getService().updateSong(song);
  }

  async deleteSong(id: string): Promise<void> {
    return this.getService().deleteSong(id);
  }

  async clearDatabase(): Promise<void> {
    return this.getService().clearDatabase();
  }

  async exportDB(): Promise<string> {
    return this.getService().exportDB();
  }

  async importDB(json: string): Promise<void> {
    return this.getService().importDB(json);
  }

  // Migration utilities
  async getLocalSongs(): Promise<Song[]> {
    return this.localService.getAllSongs();
  }

  async migrateLocalToCloud(): Promise<{ success: number; failed: number }> {
    try {
      const localSongs = await this.localService.getAllSongs();
      let success = 0;
      let failed = 0;

      for (const song of localSongs) {
        try {
          const { id, createdAt, updatedAt, ...songData } = song;
          await this.cloudService.saveSong(songData);
          success++;
        } catch (error) {
          console.error('Failed to migrate song:', song.title, error);
          failed++;
        }
      }

      // Clear local storage after successful migration
      if (success > 0 && failed === 0) {
        await this.localService.clearDatabase();
      }

      return { success, failed };
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Check if there are local songs that could be migrated
  async hasLocalData(): Promise<boolean> {
    const localSongs = await this.localService.getAllSongs();
    return localSongs.length > 0;
  }
}