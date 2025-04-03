import { Section } from '../types/song';

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
      // Make sure currentSection is not null (to satisfy TypeScript)
      if (currentSection) {
        matches.forEach((match, index) => {
          const chordText = match[1];
          const matchIndex = match.index || 0;
          
          // Calculate position based on original chord position
          const position = matchIndex + 2; // Add 2 for base indentation
          
          currentSection!.chords.push({
            id: `chord-${currentLine}-${index}`,
            text: chordText,
            position: position,
            line: currentLine
          });
        });
      }
      
      // Skip to next line (lyrics)
      i++;
      if (currentSection) {
        currentSection.content += nextLine + '\n';
      }
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

export function parseFreeshowText(text: string): Section[] {
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

    // Check for section headers [Verse], [Chorus], etc.
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

    // In FreeShow format, chords are inline with lyrics like: "Though [B]the natio[G#m]ns rag[F#]e,"
    const content = line.trim();
    
    // Make sure currentSection is not null (to satisfy TypeScript)
    if (!currentSection) {
      currentSection = {
        type: 'verse',
        number: ++sectionCounts.verse,
        content: '',
        chords: []
      };
    }
    
    // Create a clean content line without the chord markers
    let cleanContent = content;
    const chordMatches = Array.from(content.matchAll(/\[(.*?)\]/g));
    
    // Process from end to beginning to avoid position shifts
    for (let j = chordMatches.length - 1; j >= 0; j--) {
      const match = chordMatches[j];
      if (match.index !== undefined) {
        cleanContent = cleanContent.substring(0, match.index) + cleanContent.substring(match.index + match[0].length);
      }
    }
    
    // Set the content without chord markers
    currentSection.content += cleanContent + '\n';
    
    // Extract and position chords
    const chordRegex = /\[(.*?)\]/g;
    let match;
    let positionOffset = 0;
    
    while ((match = chordRegex.exec(content)) !== null) {
      const chordText = match[1];
      const matchIndex = match.index || 0;
      
      // Calculate the actual position in the clean content
      // We need to adjust for the removed chord markers before this position
      let position = matchIndex - positionOffset;
      
      currentSection.chords.push({
        id: `chord-${currentLine}-${position}`,
        text: chordText,
        position: position,
        line: currentLine
      });
      
      // Update the position offset for the next chord
      positionOffset += match[0].length - 0; // Remove the entire [chord] marker
    }
    
    currentLine++;
  }

  // Add the last section if it exists
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

export function parseOpenLPText(_text: string): Section[] {
  return [];
}

export interface ParsedShowFile {
  sections: Section[];
  title?: string;
  artist?: string;
}

export function parseShowFile(content: string): ParsedShowFile {
  try {
    // Parse the JSON content
    const showData = JSON.parse(content);
    
    // Check if it's a valid FreeShow .show file
    if (!Array.isArray(showData) || showData.length < 2) {
      throw new Error('Invalid FreeShow .show file format');
    }
    
    // Log the structure to debug
    console.log('Show file structure:', JSON.stringify(showData, null, 2));
    
    // The second element (index 1) contains the song data
    const songData = showData[1];
    
    // Check if slides exist
    if (!songData.slides) {
      console.error('No slides found in the show file');
      throw new Error('Invalid FreeShow .show file format - no slides found');
    }
    const slides = songData.slides;
    const layouts = songData.layouts;
    
    // Get the active layout to determine slide order
    const activeLayoutId = songData.settings?.activeLayout;
    let slideOrder: string[] = [];
    
    if (activeLayoutId && layouts[activeLayoutId]) {
      slideOrder = layouts[activeLayoutId].slides.map((slide: { id: string }) => slide.id);
    } else {
      // If no layout is specified, use all slides in their natural order
      slideOrder = Object.keys(slides);
    }
    
    const sections: Section[] = [];
    const sectionTypes: Record<string, number> = {
      verse: 0,
      chorus: 0,
      bridge: 0,
      tag: 0
    };
    
    // Process slides in the order specified by the layout
    for (const slideId of slideOrder) {
      const slide = slides[slideId];
      if (!slide) continue;
      
      // Determine section type
      let sectionType: Section['type'] = 'verse';
      const group = slide.group?.toLowerCase() || '';
      
      if (group.includes('chorus')) {
        sectionType = 'chorus';
        sectionTypes.chorus++;
      } else if (group.includes('bridge')) {
        sectionType = 'bridge';
        sectionTypes.bridge++;
      } else if (group.includes('tag')) {
        sectionType = 'tag';
        sectionTypes.tag++;
      } else {
        // Default to verse
        sectionType = 'verse';
        sectionTypes.verse++;
      }
      
      // Create a new section
      const section: Section = {
        type: sectionType,
        number: sectionTypes[sectionType],
        content: '',
        chords: []
      };
      
      // Process text items in the slide
      for (const item of slide.items || []) {
        if (item.type === 'text') {
          let lineNumber = 0;
          
          for (const line of item.lines || []) {
            // Extract the text content
            const textContent = line.text?.map((t: { value: string }) => t.value).join('') || '';
            section.content += textContent + '\n';
            
            // Process chords
            for (const chord of line.chords || []) {
              section.chords.push({
                id: `chord-${lineNumber}-${chord.pos}`,
                text: chord.key,
                position: chord.pos,
                line: lineNumber
              });
            }
            
            lineNumber++;
          }
        }
      }
      
      sections.push(section);
    }
    
    // Extract title and artist from the song data
    // Make sure to log these values for debugging
    const title = songData.name || '';
    const artist = songData.meta?.artist || '';
    
    console.log('Extracted title:', title);
    console.log('Extracted artist:', artist);
    
    return {
      sections,
      title,
      artist
    };
  } catch (error) {
    console.error('Error parsing FreeShow .show file:', error);
    throw new Error('Failed to parse FreeShow .show file');
    return { sections: [] };
  }
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