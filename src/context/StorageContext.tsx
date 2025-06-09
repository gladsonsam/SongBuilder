import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Song } from '../types/song';
import { StorageManager } from '../utils/storageManager';
import { StorageMode } from '../utils/storageInterface';
import { useAuth } from './AuthContext';
import { notifications } from '@mantine/notifications';

interface StorageContextType {
  songs: Song[];
  isLoading: boolean;
  storageMode: StorageMode;
  saveSong: (song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSong: (song: Song) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  getSong: (id: string) => Promise<Song | null>;
  refreshSongs: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  clearData: () => Promise<void>;
  // Migration functions
  hasLocalData: () => Promise<boolean>;
  migrateLocalToCloud: () => Promise<{ success: number; failed: number }>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageManager] = useState(() => new StorageManager());

  // Determine storage mode based on authentication
  const storageMode = isAuthenticated ? StorageMode.CLOUD : StorageMode.LOCAL;

  // Switch storage mode when authentication changes
  useEffect(() => {
    if (!authLoading) {
      storageManager.setMode(storageMode);
      // Only refresh songs if we're not trying to use cloud storage without auth
      if (storageMode === StorageMode.LOCAL || isAuthenticated) {
        refreshSongs();
      } else {
        // Clear songs when switching to unauthenticated mode
        setSongs([]);
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, storageMode]);

  const refreshSongs = async () => {
    try {
      setIsLoading(true);
      const allSongs = await storageManager.getAllSongs();
      setSongs(allSongs);
    } catch (error) {
      console.error('Failed to load songs:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load songs',
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSong = async (song: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const id = await storageManager.saveSong(song);
      await refreshSongs(); // Refresh to show new song
      
      notifications.show({
        title: 'Success',
        message: `Song saved ${storageMode === StorageMode.CLOUD ? 'to cloud' : 'locally'}`,
        color: 'green'
      });
      
      return id;
    } catch (error) {
      console.error('Failed to save song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save song',
        color: 'red'
      });
      throw error;
    }
  };

  const updateSong = async (song: Song): Promise<void> => {
    try {
      await storageManager.updateSong(song);
      await refreshSongs(); // Refresh to show updated song
      
      notifications.show({
        title: 'Success',
        message: 'Song updated successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to update song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update song',
        color: 'red'
      });
      throw error;
    }
  };

  const deleteSong = async (id: string): Promise<void> => {
    try {
      await storageManager.deleteSong(id);
      await refreshSongs(); // Refresh to remove deleted song
      
      notifications.show({
        title: 'Success',
        message: 'Song deleted successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to delete song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete song',
        color: 'red'
      });
      throw error;
    }
  };

  const getSong = async (id: string): Promise<Song | null> => {
    try {
      return await storageManager.getSong(id);
    } catch (error) {
      console.error('Failed to get song:', error);
      return null;
    }
  };

  const exportData = async (): Promise<string> => {
    return storageManager.exportDB();
  };

  const importData = async (json: string): Promise<void> => {
    try {
      await storageManager.importDB(json);
      await refreshSongs();
      
      notifications.show({
        title: 'Success',
        message: 'Data imported successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to import data',
        color: 'red'
      });
      throw error;
    }
  };

  const clearData = async (): Promise<void> => {
    try {
      await storageManager.clearDatabase();
      await refreshSongs();
      
      notifications.show({
        title: 'Success',
        message: 'All data cleared',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to clear data',
        color: 'red'
      });
      throw error;
    }
  };

  const hasLocalData = async (): Promise<boolean> => {
    return storageManager.hasLocalData();
  };

  const migrateLocalToCloud = async (): Promise<{ success: number; failed: number }> => {
    try {
      const result = await storageManager.migrateLocalToCloud();
      
      if (result.success > 0) {
        await refreshSongs(); // Refresh to show migrated songs
        
        notifications.show({
          title: 'Migration Complete',
          message: `Successfully migrated ${result.success} songs to cloud storage`,
          color: 'green'
        });
      }
      
      if (result.failed > 0) {
        notifications.show({
          title: 'Migration Issues',
          message: `${result.failed} songs failed to migrate`,
          color: 'orange'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      notifications.show({
        title: 'Migration Failed',
        message: 'Failed to migrate local songs to cloud',
        color: 'red'
      });
      return { success: 0, failed: 0 };
    }
  };

  return (
    <StorageContext.Provider
      value={{
        songs,
        isLoading: isLoading || authLoading,
        storageMode,
        saveSong,
        updateSong,
        deleteSong,
        getSong,
        refreshSongs,
        exportData,
        importData,
        clearData,
        hasLocalData,
        migrateLocalToCloud
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}