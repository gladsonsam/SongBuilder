import React, { useState, useEffect } from 'react';
import { TextInput } from '@mantine/core';
import { useSongs } from '../context/SongContext';
import './TransposeControl.css';

// Define chord notes in a chromatic scale
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
function normalizeChord(chord: string): string {
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
function extractRoot(chord: string): string {
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
function extractSuffix(chord: string): string {
  // Handle chords with sharps (e.g., C#m)
  if (chord.length > 1 && chord[1] === '#') {
    return chord.substring(2);
  }
  // Handle basic chords (e.g., C, G)
  return chord.substring(1);
}

/**
 * Transpose a chord by a number of semitones
 */
function transposeChord(chord: string, semitones: number): string {
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

interface TransposeControlProps {
  // No props needed for the simplified version
}

const TransposeControl: React.FC<TransposeControlProps> = () => {
  const { currentTranspose, setCurrentTranspose } = useSongs();
  const [transposeValue, setTransposeValue] = useState(currentTranspose || '');
  
  // Keep local state in sync with context and apply transpose when it changes
  useEffect(() => {
    setTransposeValue(currentTranspose || '');
    
    // Apply the transpose value from context when it changes or on initial load
    if (currentTranspose) {
      // Add a small delay to ensure DOM elements are rendered
      setTimeout(() => {
        applyTranspose(currentTranspose);
      }, 100);
    }
  }, [currentTranspose]);
  
  // Apply transpose on initial load
  useEffect(() => {
    if (currentTranspose) {
      // Add a small delay to ensure DOM elements are rendered
      setTimeout(() => {
        applyTranspose(currentTranspose);
      }, 100);
    }
  }, []);
  
  // Function to apply transpose based on a value
  const applyTranspose = (value: string) => {
    // Find all chord elements on the page
    const chordElements = document.querySelectorAll('.chord');
    if (chordElements.length === 0) return; // No chord elements found yet
    
    // If empty value, reset to original chords
    if (value === '') {
      chordElements.forEach(element => {
        const originalChord = element.getAttribute('data-original');
        if (originalChord) {
          element.textContent = originalChord;
        }
      });
      return;
    }
    
    // Calculate semitones to transpose
    let semitones = 0;
    if (value.startsWith('+') || value.startsWith('-') || !isNaN(parseInt(value, 10))) {
      // Handle numeric input (with or without + sign)
      semitones = parseInt(value, 10) || 0;
    } else if (NOTES.includes(value)) {
      // It's a key name, calculate difference from C (default key)
      const fromIndex = NOTES.indexOf('C'); // Default to C as base key
      const toIndex = NOTES.indexOf(value);
      if (fromIndex !== -1 && toIndex !== -1) {
        semitones = (toIndex - fromIndex + 12) % 12;
      }
    }
    
    // Apply transposition to all chord elements
    chordElements.forEach(element => {
      const originalChord = element.getAttribute('data-original') || element.textContent || '';
      if (!element.getAttribute('data-original')) {
        element.setAttribute('data-original', originalChord);
      }
      
      // Apply transposition
      element.textContent = transposeChord(originalChord, semitones);
    });
  };

  // Apply transpose immediately when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.toUpperCase();
    setTransposeValue(value);
    setCurrentTranspose(value); // Update context state
    
    // Apply the transpose to the DOM
    applyTranspose(value);
  };

  return (
    <div className="transpose-control">
      <TextInput
        label="Transpose"
        value={transposeValue}
        onChange={handleInputChange}
        placeholder="+2, -3, or G"
        size="md"
      />
    </div>
  );
};

export default TransposeControl;
