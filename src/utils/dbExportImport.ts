import { getAllSongs, saveSong, deleteSong } from './appwriteDb';
import type { Song } from './appwriteDb';
import { notifications } from '@mantine/notifications';

/**
 * Export the entire song database to a JSON file
 */
export async function exportDatabase(): Promise<void> {
  try {
    // Get all songs from the database
    const songs = await getAllSongs();
    
    // Convert to JSON string with pretty formatting
    const jsonData = JSON.stringify(songs, null, 2);
    
    // Create a blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `songbuilder-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    notifications.show({
      title: 'Export Successful',
      message: `Exported ${songs.length} songs to JSON file`,
      color: 'green'
    });
  } catch (error) {
    console.error('Failed to export database:', error);
    notifications.show({
      title: 'Export Failed',
      message: 'Could not export the song database',
      color: 'red'
    });
  }
}

/**
 * Import songs from a JSON file
 * @param file The JSON file containing songs
 * @param mode Import mode: 'replace' to replace the entire database, 'merge' to add to existing songs
 */
export async function importDatabaseFromFile(
  file: File, 
  mode: 'replace' | 'merge' = 'merge'
): Promise<void> {
  try {
    const fileContent = await file.text();
    await importDatabaseFromJson(fileContent, mode);
  } catch (error) {
    console.error('Failed to import database from file:', error);
    notifications.show({
      title: 'Import Failed',
      message: 'Could not import songs from the file',
      color: 'red'
    });
  }
}

/**
 * Import songs from a URL (like a GitHub raw file URL)
 * @param url The URL to fetch the JSON data from
 * @param mode Import mode: 'replace' to replace the entire database, 'merge' to add to existing songs
 */
export async function importDatabaseFromUrl(
  url: string,
  mode: 'replace' | 'merge' = 'merge'
): Promise<void> {
  try {
    // Validate URL format
    if (!url.startsWith('http')) {
      throw new Error('Invalid URL format');
    }
    
    // Fetch the JSON data from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const jsonData = await response.text();
    await importDatabaseFromJson(jsonData, mode);
  } catch (error) {
    console.error('Failed to import database from URL:', error);
    notifications.show({
      title: 'Import Failed',
      message: `Could not import songs from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      color: 'red'
    });
  }
}

/**
 * Import songs from a JSON string
 * @param jsonData The JSON string containing songs
 * @param mode Import mode: 'replace' to replace the entire database, 'merge' to add to existing songs
 */
async function importDatabaseFromJson(
  jsonData: string,
  mode: 'replace' | 'merge' = 'merge'
): Promise<void> {
  try {
    // Parse the JSON data
    const songs = JSON.parse(jsonData) as Song[];
    
    // Validate that the data is an array of songs
    if (!Array.isArray(songs)) {
      throw new Error('Invalid data format: Expected an array of songs');
    }
    
    // Check if songs have the required properties and provide defaults if needed
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      // Ensure required properties exist
      if (!song.title) song.title = `Imported Song ${i + 1}`;
      if (!song.artist) song.artist = '';
      if (!Array.isArray(song.sections)) {
        // If no sections, create a default empty section
        song.sections = [{ type: 'verse', content: '', chords: [] }];
      }
      // Ensure tags is an array
      if (!Array.isArray(song.tags)) {
        song.tags = [];
      }
    }
    
    // If replace mode, delete all existing songs first
    if (mode === 'replace') {
      const existingSongs = await getAllSongs();
      for (const song of existingSongs) {
        await deleteSong(song.id);
      }
    }
    
    // Import the songs
    let importedCount = 0;
    for (const song of songs) {
      // For merge mode, we need to create a new ID to avoid conflicts
      // For replace mode, we keep the original IDs
      if (mode === 'merge') {
        // Create a new song without the ID
        const { id, createdAt, updatedAt, ...songData } = song;
        await saveSong(songData);
      } else {
        // For replace mode, we need to handle the ID and timestamps
        // We'll keep the original ID but update the timestamps
        const { id, ...songData } = song;
        const now = new Date().toISOString();
        await saveSong({
          ...songData,
          id,
          createdAt: song.createdAt || now,
          updatedAt: now
        } as Song);
      }
      importedCount++;
    }
    
    notifications.show({
      title: 'Import Successful',
      message: `Imported ${importedCount} songs (${mode} mode)`,
      color: 'green'
    });
  } catch (error) {
    console.error('Failed to import database from JSON:', error);
    throw error; // Re-throw to be handled by the caller
  }
}
