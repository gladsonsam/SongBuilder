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

      // Find word boundaries in the lyrics line
      const words = line.split(/(\s+)/);
      let result = '';
      let currentPos = 0;
      let chordIndex = 0;

      // Process each word
      words.forEach(word => {
        if (!word) return;
        
        // Add any chords that should appear before this word
        while (chordIndex < lineChords.length && lineChords[chordIndex].position <= currentPos) {
          result += `[${lineChords[chordIndex].text}]`;
          chordIndex++;
        }

        // Add the word
        result += word;
        currentPos += word.length;
      });

      // Add any remaining chords at the end
      while (chordIndex < lineChords.length) {
        result += `[${lineChords[chordIndex].text}]`;
        chordIndex++;
      }

      return result;
    }).filter(line => line !== '');

    // Combine section header with processed lines
    return sectionHeader + '\n' + processedLines.join('\n');
  }).join('\n\n');
}
