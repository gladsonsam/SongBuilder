export interface Chord {
  id: string;
  text: string;
  position: number;
  line: number;
}

export interface Section {
  type: 'verse' | 'chorus' | 'bridge';
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
}
