import { Section, Chord } from '../types/song';

export function exportToFreeshowText(sections: Section[]): string {
  return sections.map(section => {
    // Convert section type to title case
    const sectionHeader = `[${section.type.charAt(0).toUpperCase() + section.type.slice(1)}]`;
    
    // Split content into lines and process each line
    const lines = section.content.split('\n');
    const processedLines = lines.map((line: string, lineIndex: number) => {
      if (!line.trim()) return '';

      // Get chords for this line
      const lineChords = section.chords
        .filter((chord: Chord) => chord.line === lineIndex)
        .sort((a: Chord, b: Chord) => a.position - b.position);

      if (lineChords.length === 0) return line;

      // Insert chords at their exact positions
      let result = '';
      let lastPos = 0;

      // Process each chord
      lineChords.forEach(chord => {
        // Add text before this chord
        result += line.substring(lastPos, chord.position);
        // Add the chord
        result += `[${chord.text}]`;
        lastPos = chord.position;
      });

      // Add remaining text after last chord
      result += line.substring(lastPos);

      return result;
    }).filter(line => line !== '');

    // Combine section header with processed lines
    return sectionHeader + '\n' + processedLines.join('\n');
  }).join('\n\n');
}
