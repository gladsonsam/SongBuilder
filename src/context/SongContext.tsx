import { createContext, useContext, useState, ReactNode } from 'react';

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'prechorus' | 'intro' | 'outro';
  number?: number;
  lines: {
    chords: string;
    lyrics: string;
  }[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  sections: SongSection[];
  lastModified: string;
}

interface SongContextType {
  songs: Song[];
  addSong: (song: Omit<Song, 'id' | 'lastModified'>) => void;
  updateSong: (id: string, song: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  getSong: (id: string) => Song | undefined;
  importFromText: (text: string) => Omit<Song, 'id' | 'lastModified'>;
}

const SongContext = createContext<SongContextType | undefined>(undefined);

function parseFreeShowFormat(text: string): Omit<Song, 'id' | 'lastModified'> {
  const lines = text.split('\n');
  const sections: SongSection[] = [];
  let currentSection: SongSection | null = null;
  let title = '';
  let artist = '';

  // Try to extract title and artist from the first few lines
  if (lines[0] && !lines[0].startsWith('[')) {
    title = lines[0].trim();
    if (lines[1] && !lines[1].startsWith('[')) {
      artist = lines[1].trim();
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      // New section
      const sectionText = line.slice(1, -1).toLowerCase();
      const [type, number] = sectionText.split(' ');
      currentSection = {
        type: type as SongSection['type'],
        number: number ? parseInt(number) : undefined,
        lines: []
      };
      sections.push(currentSection);
    } else if (currentSection) {
      // Add chord/lyric pair
      const nextLine = lines[i + 1];
      if (nextLine) {
        currentSection.lines.push({
          chords: line,
          lyrics: nextLine.trim()
        });
        i++; // Skip the lyric line since we've processed it
      }
    }
  }

  return {
    title: title || 'Untitled Song',
    artist: artist || 'Unknown Artist',
    sections,
  };
}

function parseUltimateGuitarFormat(text: string): Omit<Song, 'id' | 'lastModified'> {
  return parseFreeShowFormat(text); // They're basically the same format now
}

export function SongProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);

  const addSong = (song: Omit<Song, 'id' | 'lastModified'>) => {
    const newSong: Song = {
      ...song,
      id: crypto.randomUUID(),
      lastModified: new Date().toISOString(),
    };
    setSongs((prev) => [...prev, newSong]);
  };

  const updateSong = (id: string, updates: Partial<Song>) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id === id
          ? { ...song, ...updates, lastModified: new Date().toISOString() }
          : song
      )
    );
  };

  const deleteSong = (id: string) => {
    setSongs((prev) => prev.filter((song) => song.id !== id));
  };

  const getSong = (id: string) => {
    return songs.find((song) => song.id === id);
  };

  const importFromText = (text: string): Omit<Song, 'id' | 'lastModified'> => {
    // Try to detect the format
    if (text.includes('[') && text.includes(']')) {
      // Both formats are similar now, just use FreeShow parser
      return parseFreeShowFormat(text);
    }
    
    // Default to FreeShow format
    return parseFreeShowFormat(text);
  };

  return (
    <SongContext.Provider value={{ songs, addSong, updateSong, deleteSong, getSong, importFromText }}>
      {children}
    </SongContext.Provider>
  );
}

export function useSongs() {
  const context = useContext(SongContext);
  if (context === undefined) {
    throw new Error('useSongs must be used within a SongProvider');
  }
  return context;
} 