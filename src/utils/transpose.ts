// Define the notes in a chromatic scale
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Map for flat notes to their sharp equivalents
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
};

/**
 * Normalize a chord to use sharps instead of flats
 */
export function normalizeChord(chord: string): string {
  // Replace flats with sharps for the root note
  for (const [flat, sharp] of Object.entries(FLAT_TO_SHARP)) {
    if (chord.startsWith(flat)) {
      return chord.replace(flat, sharp);
    }
  }
  return chord;
}

/**
 * Extract the root note from a chord
 */
export function extractRoot(chord: string): string {
  // Handle chords with sharps (e.g., C#m)
  if (chord.length > 1 && chord[1] === '#') {
    return chord.substring(0, 2);
  }
  // Handle basic chords (e.g., C, G)
  return chord[0];
}

/**
 * Extract the suffix from a chord (everything after the root note)
 */
export function extractSuffix(chord: string): string {
  // Handle chords with sharps (e.g., C#m)
  if (chord.length > 1 && chord[1] === '#') {
    return chord.substring(2);
  }
  // Handle basic chords (e.g., C, G)
  return chord.substring(1);
}

/**
 * Extract the bass note from a chord (if it has one)
 */
export function extractBass(chord: string): string | null {
  const parts = chord.split('/');
  if (parts.length > 1) {
    return normalizeChord(parts[1]);
  }
  return null;
}

/**
 * Transpose a chord by a number of semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  // Normalize the chord to use sharps instead of flats
  const normalizedChord = normalizeChord(chord);
  
  // Handle slash chords (e.g., C/G)
  if (normalizedChord.includes('/')) {
    const [mainChord, bassNote] = normalizedChord.split('/');
    const transposedMain = transposeChord(mainChord, semitones);
    const transposedBass = transposeChord(bassNote, semitones);
    return `${transposedMain}/${transposedBass}`;
  }
  
  // Extract the root note and suffix
  const rootNote = extractRoot(normalizedChord);
  const suffix = extractSuffix(normalizedChord);
  
  // Find the index of the root note in the chromatic scale
  const rootIndex = NOTES.indexOf(rootNote);
  if (rootIndex === -1) {
    // If the root note is not found, return the original chord
    return chord;
  }
  
  // Calculate the new root note index
  const newRootIndex = (rootIndex + semitones + 12) % 12;
  const newRootNote = NOTES[newRootIndex];
  
  // Return the transposed chord
  return newRootNote + suffix;
}

// Define diatonic chords for each major key
const DIATONIC_CHORDS: Record<string, string[]> = {
  'C':  ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'C#': ['C#', 'D#m', 'Fm', 'F#', 'G#', 'A#m', 'Cdim'],
  'D':  ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'D#': ['D#', 'Fm', 'Gm', 'G#', 'A#', 'Cm', 'Ddim'],
  'E':  ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  'F':  ['F', 'Gm', 'Am', 'A#', 'C', 'Dm', 'Edim'],
  'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'Fdim'],
  'G':  ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'G#': ['G#', 'A#m', 'Cm', 'C#', 'D#', 'Fm', 'Gdim'],
  'A':  ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'A#': ['A#', 'Cm', 'Dm', 'D#', 'F', 'Gm', 'Adim'],
  'B':  ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim']
};

/**
 * Detect the key of a song based on the chords using an improved scoring system
 * that considers chord position, frequency, and musical function
 */
export function detectKey(chords: string[]): string {
  if (!chords.length) return 'C'; // Default to C if no chords

  // Normalize all chords to use sharps
  const normalizedChords = chords.map(chord => {
    const normalizedChord = normalizeChord(chord);
    const root = extractRoot(normalizedChord);
    const suffix = extractSuffix(normalizedChord);
    return root + suffix;
  });

  // Initialize scores for each key
  const keyScores: Record<string, number> = {};
  NOTES.forEach(key => keyScores[key] = 0);

  // Count chord occurrences to find the most common chords
  const chordCounts: Record<string, number> = {};
  normalizedChords.forEach(chord => {
    const root = extractRoot(chord);
    chordCounts[root] = (chordCounts[root] || 0) + 1;
  });

  // Score each key based on diatonic chord matches with weighted scoring
  for (const [key, diatonicChords] of Object.entries(DIATONIC_CHORDS)) {
    // Get the tonic, dominant, and subdominant chords for this key
    const tonic = diatonicChords[0]; // I chord (e.g., A in A major)
    const subdominant = diatonicChords[3]; // IV chord (e.g., D in A major)
    const dominant = diatonicChords[4]; // V chord (e.g., E in A major)
    
    normalizedChords.forEach((chord, index) => {
      // Extract the root of the chord for comparison
      const chordSuffix = extractSuffix(chord);
      
      // Check if the chord is in the key's diatonic chords
      if (diatonicChords.some(diatonicChord => {
        // Match basic chord types (major, minor, diminished)
        const normalizedDiatonic = normalizeChord(diatonicChord);
        return chord === normalizedDiatonic || // Exact match
               chord.replace('m', '') === normalizedDiatonic || // Major version
               chord + 'm' === normalizedDiatonic; // Minor version
      })) {
        // Base score for diatonic chord
        keyScores[key] += 1;
        
        // Additional scoring based on chord function
        if (extractRoot(chord) === extractRoot(tonic)) {
          // Tonic chord gets extra weight
          keyScores[key] += 2;
          
          // First and last chords are often the tonic - give extra weight
          if (index === 0 || index === normalizedChords.length - 1) {
            keyScores[key] += 3;
          }
        }
        
        // Dominant chord (V) gets extra weight, especially if it's a seventh chord
        if (extractRoot(chord) === extractRoot(dominant)) {
          keyScores[key] += 1;
          // If it's a dominant seventh (e.g., E7 in A major)
          if (chordSuffix.includes('7')) {
            keyScores[key] += 2;
          }
        }
        
        // Subdominant chord (IV) gets some extra weight
        if (extractRoot(chord) === extractRoot(subdominant)) {
          keyScores[key] += 1;
        }
      }
    });
    
    // Check for common chord progressions in this key
    // I-IV-V progression (e.g., A-D-E in A major)
    if (normalizedChords.some(c => extractRoot(c) === extractRoot(tonic)) &&
        normalizedChords.some(c => extractRoot(c) === extractRoot(subdominant)) &&
        normalizedChords.some(c => extractRoot(c) === extractRoot(dominant))) {
      keyScores[key] += 3;
    }
  }

  // Find the key with the highest score
  let bestKey = 'C';
  let highestScore = 0;

  for (const [key, score] of Object.entries(keyScores)) {
    if (score > highestScore) {
      highestScore = score;
      bestKey = key;
    }
  }

  // If no clear winner (all scores are 0), fall back to most common root note
  if (highestScore === 0) {
    let mostCommonRoot = '';
    let maxCount = 0;
    for (const [root, count] of Object.entries(chordCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonRoot = root;
      }
    }
    return mostCommonRoot || 'C';
  }

  return bestKey;
}

/**
 * Calculate the number of semitones between two keys
 */
export function getSemitonesBetweenKeys(fromKey: string, toKey: string): number {
  const normalizedFromKey = normalizeChord(fromKey);
  const normalizedToKey = normalizeChord(toKey);
  
  const fromIndex = NOTES.indexOf(normalizedFromKey);
  const toIndex = NOTES.indexOf(normalizedToKey);
  
  if (fromIndex === -1 || toIndex === -1) {
    return 0; // Invalid keys
  }
  
  return (toIndex - fromIndex + 12) % 12;
}

/**
 * Parse a transpose input string (e.g., "+2", "-3", "G")
 */
export function parseTransposeInput(input: string, originalKey: string): number {
  // Remove whitespace
  const trimmedInput = input.trim();
  
  // If empty, return 0 (no transposition)
  if (!trimmedInput) {
    return 0;
  }
  
  // Check if it's a relative transposition (e.g., "+2", "-3")
  if (trimmedInput.startsWith('+') || trimmedInput.startsWith('-')) {
    const semitones = parseInt(trimmedInput, 10);
    return isNaN(semitones) ? 0 : semitones;
  }
  
  // Check if it's a key name (e.g., "G", "A#")
  const normalizedInput = normalizeChord(trimmedInput);
  if (NOTES.includes(normalizedInput)) {
    // Calculate semitones between original key and target key
    return getSemitonesBetweenKeys(originalKey, normalizedInput);
  }
  
  // Invalid input
  return 0;
}
