import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { transposeChord, detectKey } from '../utils/transpose';

import type { Song as SongType, Section } from '../utils/appwriteDb';

// Extended Song type with originalKey for transposing
export interface Song extends SongType {
  originalKey?: string;
  notes?: string; // Rich text notes for the song
}

interface SongContextType {
  songs: Song[];
  addSong: (song: Omit<Song, 'id'>) => void;
  updateSong: (id: string, song: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  getSong: (id: string) => Song | undefined;
  importFromText: (text: string) => Omit<Song, 'id'>;
  transposeSong: (id: string, transposeValue: string) => void;
  currentTranspose: string;
  setCurrentTranspose: (value: string) => void;
}

const SongContext = createContext<SongContextType | undefined>(undefined);

function parseFreeShowFormat(text: string): Omit<Song, 'id'> {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let title = '';
  let artist = '';
  let currentLine = 0;

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
        type: type as Section['type'],
        number: number ? parseInt(number) : undefined,
        content: '',
        chords: []
      };
      sections.push(currentSection);
      currentLine = 0;
    } else if (currentSection) {
      // Add chord/lyric pair
      const nextLine = lines[i + 1];
      if (nextLine) {
        // This is a chord line
        const chordMatches = line.match(/[A-G][#b]?(?:maj|min|m|aug|dim|sus|add|M)?(?:\d+)?(?:\/[A-G][#b]?)?/g) || [];
        
        chordMatches.forEach((chordText, index) => {
          const position = line.indexOf(chordText);
          if (position !== -1) {
            currentSection!.chords.push({
              id: `chord-${currentLine}-${index}`,
              text: chordText,
              position: position,
              line: currentLine
            });
          }
        });
        
        // Add the lyrics line
        currentSection!.content += nextLine.trim() + '\n';
        currentLine++;
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

// Both formats are similar now, just use FreeShow parser
function parseUltimateGuitarFormat(text: string): Omit<Song, 'id'> {
  return parseFreeShowFormat(text);
}

export function SongProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentTranspose, setCurrentTranspose] = useState<string>('');

  const addSong = (song: Omit<Song, 'id'>) => {
    const newSong: Song = {
      ...song,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setSongs((prev) => [...prev, newSong]);
  };

  const updateSong = (id: string, updates: Partial<Song>) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id === id
          ? { ...song, ...updates, updatedAt: new Date().toISOString() }
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

  const importFromText = (text: string): Omit<Song, 'id'> => {
    // Try to detect the format
    if (text.includes('[') && text.includes(']')) {
      return parseUltimateGuitarFormat(text);
    }
    
    // Default to FreeShow format
    return parseFreeShowFormat(text);
  };

  const transposeSong = (id: string, transposeValue: string) => {
    const song = getSong(id);
    if (!song) return;

    // Store the current transpose value
    setCurrentTranspose(transposeValue);

    // Detect original key if not already set
    if (!song.originalKey) {
      const allChords: string[] = [];
      song.sections.forEach(section => {
        // Extract chords from the section
        section.chords.forEach(chord => {
          allChords.push(chord.text);
        });
      });
      
      const detectedKey = detectKey(allChords);
      updateSong(id, { originalKey: detectedKey });
    }

    // If transpose value is empty, reset to original
    if (!transposeValue.trim()) {
      // Reset to original sections if available
      if (song.originalSections) {
        updateSong(id, { 
          sections: JSON.parse(JSON.stringify(song.originalSections)),
          currentTranspose: '' // Clear the current transpose value
        });
      } else {
        // Just clear the transpose value if no original sections
        updateSong(id, { currentTranspose: '' });
      }
      return;
    }

    // Calculate semitones to transpose
    let semitones = 0;
    if (transposeValue.startsWith('+') || transposeValue.startsWith('-')) {
      semitones = parseInt(transposeValue, 10);
    } else {
      // It's a key name, calculate difference from original key
      const fromKey = song.originalKey || 'C';
      const toKey = transposeValue.trim();
      
      // Find index in chromatic scale
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const fromIndex = notes.indexOf(fromKey);
      const toIndex = notes.indexOf(toKey);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        semitones = (toIndex - fromIndex + 12) % 12;
      }
    }

    // Apply transposition to all chords
    const transposedSections = song.sections.map(section => {
      const transposedChords = section.chords.map(chord => {
        return {
          ...chord,
          text: transposeChord(chord.text, semitones)
        };
      });
      
      return {
        ...section,
        chords: transposedChords
      };
    });

    updateSong(id, { sections: transposedSections });
  };

  return (
    <SongContext.Provider value={{ 
      songs, 
      addSong, 
      updateSong, 
      deleteSong, 
      getSong, 
      importFromText,
      transposeSong,
      currentTranspose,
      setCurrentTranspose
    }}>
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