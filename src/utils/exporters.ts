import { Section, Chord, Song } from '../types/song';

/**
 * Export sections to FreeShow text format with inline chord markers
 */
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

/**
 * Export a song to FreeShow .show file format
 */
export function exportToShowFile(song: Song, sections: Section[]): string {
  // Generate a unique ID for the song
  const songId = crypto.randomUUID().substring(0, 10);
  
  // Create slides for each section
  const slides: Record<string, any> = {};
  const layoutSlides: Array<{id: string}> = [];
  
  sections.forEach((section) => {
    // Generate a unique ID for each slide
    const slideId = crypto.randomUUID().substring(0, 10);
    layoutSlides.push({ id: slideId });
    
    // Determine the color based on section type
    let color = '#5825f5'; // Default color for verses
    if (section.type === 'chorus') {
      color = '#f525d2';
    } else if (section.type === 'bridge') {
      color = '#25f5e6';
    } else if (section.type === 'tag') {
      color = '#f5a425';
    }
    
    // Create the slide object
    const slide: any = {
      group: section.type.charAt(0).toUpperCase() + section.type.slice(1),
      color,
      settings: {},
      notes: "",
      items: [],
      globalGroup: section.type.toLowerCase()
    };
    
    // Split content into lines
    const lines = section.content.split('\n').filter(line => line.trim() !== '');
    
    // Create text item with lines and chords
    const textItem: any = {
      type: 'text',
      lines: [],
      style: 'top:120.00px;left:163.00px;height:840px;width:1593.59px;',
      align: '',
      auto: false
    };
    
    // Process each line
    lines.forEach((lineText, lineIndex) => {
      // Get chords for this line
      const lineChords = section.chords
        .filter(chord => chord.line === lineIndex)
        .sort((a, b) => a.position - b.position);
      
      // Create line object
      const line: any = {
        align: '',
        text: [{
          value: lineText,
          style: 'font-size:40px;font-weight:bold;'
        }],
        chords: []
      };
      
      // Add chords to the line
      lineChords.forEach(chord => {
        // Generate a unique ID for each chord
        const chordId = Math.random().toString(36).substring(2, 7);
        
        line.chords.push({
          id: chordId,
          pos: chord.position,
          key: chord.text
        });
      });
      
      textItem.lines.push(line);
    });
    
    slide.items.push(textItem);
    slides[slideId] = slide;
  });
  
  // Create the layout
  const layoutId = crypto.randomUUID().substring(0, 10);
  const layouts: Record<string, any> = {
    [layoutId]: {
      name: 'Default',
      notes: '',
      slides: layoutSlides
    }
  };
  
  // Create the full show file structure
  const showData = [
    songId,
    {
      name: song.title || 'Untitled Song',
      private: false,
      category: 'song',
      settings: {
        activeLayout: layoutId,
        template: 'default'
      },
      timestamps: {
        created: Date.now(),
        modified: Date.now(),
        used: Date.now()
      },
      quickAccess: {},
      meta: {
        artist: song.artist || ''
      },
      slides,
      layouts,
      media: {}
    }
  ];
  
  return JSON.stringify(showData);
}
