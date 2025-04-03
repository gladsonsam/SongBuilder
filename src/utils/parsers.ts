interface Section {
  type: 'verse' | 'chorus' | 'bridge' | 'tag';
  content: string;
  number?: number;
  chords: {
    id: string;
    text: string;
    position: number;
    line: number;
  }[];
}

export function parseUltimateGuitarText(text: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let sectionCounts = {
    verse: 0,
    chorus: 0,
    bridge: 0,
    tag: 0
  };
  let currentLine = 0;

  // Split into lines
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines but count them for spacing
    if (!line.trim()) {
      if (currentSection) {
        currentSection.content += '\n';
        currentLine++;
      }
      continue;
    }

    // Check for section headers [Verse 1], [Chorus], etc.
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      // If we have a current section, push it
      if (currentSection) {
        sections.push(currentSection);
      }

      // Reset line counter for new section
      currentLine = 0;

      // Parse section header
      const headerText = line.trim().slice(1, -1).toLowerCase();
      let sectionType: Section['type'] = 'verse';
      let sectionNumber: number | undefined;

      if (headerText.includes('chorus')) {
        sectionType = 'chorus';
        sectionCounts.chorus++;
        sectionNumber = sectionCounts.chorus;
      } else if (headerText.includes('bridge')) {
        sectionType = 'bridge';
        sectionCounts.bridge++;
        sectionNumber = sectionCounts.bridge;
      } else if (headerText.includes('tag')) {
        sectionType = 'tag';
        sectionCounts.tag++;
        sectionNumber = sectionCounts.tag;
      } else if (headerText.includes('verse')) {
        sectionType = 'verse';
        const match = headerText.match(/\d+/);
        sectionNumber = match ? parseInt(match[0]) : ++sectionCounts.verse;
      }

      // Create new section
      currentSection = {
        type: sectionType,
        number: sectionNumber,
        content: '',
        chords: []
      };
      continue;
    }

    if (!currentSection) {
      // Create default verse section if none exists
      currentSection = {
        type: 'verse',
        number: ++sectionCounts.verse,
        content: '',
        chords: []
      };
    }

    // Look ahead to next line to determine if this is a chord line
    const nextLine = lines[i + 1];
    if (!nextLine || !currentSection) continue;

    // This might be a chord line if it has chord patterns
    const chordPattern = /([A-G][#b]?(?:maj|min|m|aug|dim|sus|add|M)?(?:\d+)?(?:\/[A-G][#b]?)?)\s*/g;
    const matches = Array.from(line.matchAll(chordPattern));
    
    if (matches.length > 0 && !nextLine.trim().startsWith('[')) {
      // This is a chord line - calculate positions
      matches.forEach((match, index) => {
        const chordText = match[1];
        const matchIndex = match.index || 0;
        
        // Calculate position based on original chord position
        const position = matchIndex + 2; // Add 2 for base indentation
        
        currentSection.chords.push({
          id: `chord-${currentLine}-${index}`,
          text: chordText,
          position: position,
          line: currentLine
        });
      });
      
      // Skip to next line (lyrics)
      i++;
      currentSection.content += nextLine + '\n';
      currentLine++;
    } else {
      // Just a lyrics line
      currentSection.content += line + '\n';
      currentLine++;
    }
  }

  // Add the last section if it exists
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

export function parseFreeshowText(_text: string): Section[] {
  return [];
}

export function parseOpenLPText(_text: string): Section[] {
  return [];
}

export function parseShowFile(_content: string): Section[] {
  return [];
}

export function parseProjectFile(_content: string): Section[] {
  return [];
}

export function parseCHOFile(_content: string): Section[] {
  return [];
}

export function parseXMLFile(_content: string): Section[] {
  return [];
}