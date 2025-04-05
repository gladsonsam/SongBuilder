export interface Chord {
  id: string;
  text: string;
  position: number;
  line: number;
}

export interface Section {
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus';
  content: string;
  number?: number;
  chords: Chord[];
}

export interface Song {
  id?: string;
  title: string;
  artist: string;
  sections: Section[];
  createdAt?: string;
  updatedAt?: string;
  originalKey?: string;
  currentTranspose?: string;
  originalSections?: Section[]; // Store original sections before transposition
  tags?: string[]; // Array of tags for categorizing songs
  notes?: string; // Rich text notes for the song
}
