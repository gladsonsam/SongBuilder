import type { Section } from './db';

export function convertToFreeshowText(title: string, artist: string, sections: Section[]): string {
  let output = '';
  
  // Add title and artist if provided
  if (title && artist) {
    output += `${title}\n${artist}\n\n`;
  }

  // Process each section
  sections.forEach((section, index) => {
    // Add section header
    output += `[${section.type.charAt(0).toUpperCase() + section.type.slice(1)}${section.number ? ' ' + section.number : ''}]\n`;

    // Split content into lines
    const lines = section.content.split('\n');
    
    // Process each line
    lines.forEach((line, lineIndex) => {
      // Get chords for this line
      const lineChords = section.chords
        .filter(chord => chord.line === lineIndex)
        .sort((a, b) => a.position - b.position);

      // Create chord line if there are chords
      if (lineChords.length > 0) {
        let chordLine = '  '; // 2 spaces for minimal indent
        let lastPosition = 2;
        
        lineChords.forEach(chord => {
          // Add spaces to reach chord position
          const spacesNeeded = Math.max(0, chord.position - lastPosition);
          chordLine += ' '.repeat(spacesNeeded) + chord.text;
          lastPosition = chord.position + chord.text.length;
        });

        output += chordLine + '\n';
      }
      
      // Add lyrics line with 2 spaces indent if not empty
      if (line.trim()) {
        output += '  ' + line + '\n';
      } else {
        output += '\n';
      }
    });

    // Add spacing between sections
    if (index < sections.length - 1) {
      output += '\n';
    }
  });

  return output;
}

export function convertToUltimateGuitarText(title: string, artist: string, sections: Section[]): string {
  let output = '';
  
  // Add title and artist if provided
  if (title && artist) {
    output += `${title}\nArtist: ${artist}\n\n`;
  }

  // Process each section
  sections.forEach((section, index) => {
    // Add section header
    output += `[${section.type.charAt(0).toUpperCase() + section.type.slice(1)}${section.number ? ' ' + section.number : ''}]\n`;

    // Split content into lines
    const lines = section.content.split('\n');
    
    // Process each line
    lines.forEach((line, lineIndex) => {
      // Get chords for this line
      const lineChords = section.chords
        .filter(chord => chord.line === lineIndex)
        .sort((a, b) => a.position - b.position);

      // Create chord line if there are chords
      if (lineChords.length > 0) {
        let chordLine = '  '; // 2 spaces for minimal indent
        let lastPosition = 2;
        
        lineChords.forEach(chord => {
          // Add spaces to reach chord position
          const spacesNeeded = Math.max(0, chord.position - lastPosition);
          chordLine += ' '.repeat(spacesNeeded) + chord.text;
          lastPosition = chord.position + chord.text.length;
        });

        output += chordLine + '\n';
      }
      
      // Add lyrics line with 2 spaces indent if not empty
      if (line.trim()) {
        output += '  ' + line + '\n';
      } else {
        output += '\n';
      }
    });

    // Add spacing between sections
    if (index < sections.length - 1) {
      output += '\n';
    }
  });

  return output;
}