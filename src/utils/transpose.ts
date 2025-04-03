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

/**
 * Detect the key of a song based on the chords
 */
export function detectKey(chords: string[]): string {
  // This is a simplified key detection algorithm
  // A more sophisticated algorithm would analyze chord progressions
  
  // Count occurrences of each root note
  const rootCounts: Record<string, number> = {};
  
  chords.forEach(chord => {
    const normalizedChord = normalizeChord(chord);
    const rootNote = extractRoot(normalizedChord);
    rootCounts[rootNote] = (rootCounts[rootNote] || 0) + 1;
  });
  
  // Find the most common root note
  let mostCommonRoot = '';
  let maxCount = 0;
  
  for (const [root, count] of Object.entries(rootCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonRoot = root;
    }
  }
  
  return mostCommonRoot || 'C'; // Default to C if no chords
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
