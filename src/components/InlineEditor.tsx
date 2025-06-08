import { useState, useEffect, useRef } from 'react';
import { Textarea, Button, Group, ActionIcon, Stack, Text, Tooltip, Tabs } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconDeviceFloppy, IconGuitarPick } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Section, Chord } from '../types/song';
import { parseUltimateGuitarText } from '../utils/parsers';

interface InlineEditorProps {
  section: Section;
  onSave: (updatedSection: Section, additionalSections?: Section[]) => void;
  onCancel?: () => void;
}

const MAX_HISTORY = 50;

export function InlineEditor({ section, onSave, onCancel }: InlineEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };
  // Add a title based on section type
  const sectionTitle = `${section.type.charAt(0).toUpperCase() + section.type.slice(1)}${section.number ? ` ${section.number}` : ''}`;
  // Create a Freeshow-style representation of the section with inline chords
  const generateFreeshowText = (section: Section): string => {
    let text = '';
    
    // Add section type as a header with proper Freeshow capitalization (capitalize each word)
    const formattedType = section.type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
    text += `[${formattedType}]\n`;
    
    // Split content into lines
    const contentLines = section.content.split('\n');
    
    // Process each line and add inline chords
    contentLines.forEach((line, lineIndex) => {
      // Get chords for this line
      const chordsForLine = section.chords
        ?.filter(chord => chord.line === lineIndex)
        .sort((a, b) => a.position - b.position);
      
      if (chordsForLine && chordsForLine.length > 0) {
        // Create a line with inline chords
        let modifiedLine = '';
        let currentPos = 0;
        
        // Insert chords at their positions
        chordsForLine.forEach(chord => {
          // Add text before the chord
          if (chord.position > currentPos) {
            modifiedLine += line.substring(currentPos, chord.position);
          }
          
          // Add the chord in brackets
          modifiedLine += `[${chord.text}]`;
          
          // Update current position
          currentPos = chord.position;
        });
        
        // Add any remaining text after the last chord
        if (currentPos < line.length) {
          modifiedLine += line.substring(currentPos);
        }
        
        // Add line with a newline character, but only if it's not the last line
        text += modifiedLine;
        if (lineIndex < contentLines.length - 1) {
          text += '\n';
        }
      } else {
        // No chords, just add the line
        text += line;
        if (lineIndex < contentLines.length - 1) {
          text += '\n';
        }
      }
    });
    
    return text;
  };

  // Parse Freeshow text with inline chords back to section format
  // Returns an array of sections if multiple section headers are found
  const parseFreeshowText = (text: string): Section | Section[] => {
    const lines = text.split('\n');
    const sections: Section[] = [];
    let currentSectionType = section.type;
    let currentContent: string[] = [];
    let currentChords: Chord[] = [];
    let currentLineOffset = 0;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a section header
      const sectionHeaderMatch = line.match(/^\[(.+)\]$/);
      if (sectionHeaderMatch) {
        // If we already have content, save the current section
        if (i > 0 && (currentContent.length > 0 || currentChords.length > 0)) {
          sections.push({
            ...section,
            type: currentSectionType as 'verse' | 'chorus' | 'bridge' | 'tag',
            content: currentContent.join('\n'),
            chords: currentChords
          });
          
          // Reset for the new section
          currentContent = [];
          currentChords = [];
          currentLineOffset = 0;
        }
        
        // Set the type for the new section
        const typeMatch = sectionHeaderMatch[1].toLowerCase();
        // Support all Freeshow section types
        const validTypes = ['verse', 'chorus', 'bridge', 'tag', 'break', 'intro', 'outro', 'pre-chorus'];
        if (validTypes.includes(typeMatch)) {
          currentSectionType = typeMatch as 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus';
        }
        
        continue; // Skip the section header line
      }
      
      // Process content line
      if (line.trim() === '') {
        // Keep empty lines in content
        currentContent.push('');
        currentLineOffset++;
        continue;
      }
      
      // Extract chords from line using regex
      const chordRegex = /\[(.*?)\]/g;
      let match;
      let plainLine = line;
      let offset = 0;
      
      // Find all chord matches
      while ((match = chordRegex.exec(line)) !== null) {
        const chordText = match[1];
        
        // Skip if this is a section header (should be caught above, but just in case)
        if (['verse', 'chorus', 'bridge', 'tag', 'break', 'intro', 'outro', 'pre-chorus'].includes(chordText.toLowerCase())) {
          continue;
        }
        
        const chordPosition = match.index - offset;
        
        // Add chord to the chords array
        currentChords.push({
          id: Math.random().toString(36).substring(2, 9),
          text: chordText,
          position: chordPosition,
          line: currentLineOffset
        });
        
        // Remove the chord from the line for the content
        plainLine = plainLine.replace(`[${chordText}]`, '');
        offset += chordText.length + 2; // +2 for the brackets
      }
      
      // Add the plain line without chords to content
      currentContent.push(plainLine);
      currentLineOffset++;
    }
    
    // Add the final section
    sections.push({
      ...section,
      type: currentSectionType as 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus',
      content: currentContent.join('\n'),
      chords: currentChords
    });
    
    // If only one section was found, return it directly
    // Otherwise return the array of sections
    return sections.length === 1 ? sections[0] : sections;
  };

  const [text, setText] = useState<string>(generateFreeshowText(section));
  const [history, setHistory] = useState<string[]>([text]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Add to history when text changes
  const addToHistory = (newText: string) => {
    if (newText === history[historyIndex]) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setText(history[historyIndex - 1]);
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setText(history[historyIndex + 1]);
    }
  };
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Debounce adding to history
    clearTimeout((window as any).historyTimeout);
    (window as any).historyTimeout = setTimeout(() => {
      addToHistory(newText);
    }, 500);
  };
  
  // Handle save
  const handleSave = () => {
    try {
      const result = parseFreeshowText(text);
      
      if (Array.isArray(result)) {
        // Multiple sections detected
        if (result.length > 1) {
          // Call onSave with the first section and notify about split
          onSave(result[0], result.slice(1));
          notifications.show({
            title: 'Sections Split',
            message: `Your section was split into ${result.length} sections`,
            color: 'green'
          });
        } else {
          // Just one section in the array
          onSave(result[0]);
          notifications.show({
            title: 'Section Updated',
            message: 'Your changes have been saved',
            color: 'green'
          });
        }
      } else {
        // Single section
        onSave(result);
        notifications.show({
          title: 'Section Updated',
          message: 'Your changes have been saved',
          color: 'green'
        });
      }
    } catch (error) {
      console.error('Error parsing section:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save changes. Please check your formatting.',
        color: 'red'
      });
    }
  };
  
  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const [ugText, setUgText] = useState('');

  const handleUltimateGuitarImport = () => {
    try {
      const sections = parseUltimateGuitarText(ugText);
      if (sections.length > 0) {
        const freeshowText = generateFreeshowText(sections[0]);
        setText(freeshowText);
        addToHistory(freeshowText);
        notifications.show({
          title: 'Success',
          message: 'Ultimate Guitar format imported successfully',
          color: 'green'
        });
      }
    } catch (error) {
      console.error('Failed to import Ultimate Guitar format:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to import Ultimate Guitar format. Please check your input.',
        color: 'red'
      });
    }
  };

  return (
    <Stack gap="lg" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }} onKeyDown={handleKeyDown}>
      <Text fw={700} size="lg" mb="xs">
        Edit {sectionTitle}
      </Text>
      
      <Tabs defaultValue="freeshow" styles={{ tab: { padding: '12px 16px' } }}>
        <Tabs.List mb="md">
          <Tabs.Tab value="freeshow" fw={500}>FreeShow Format</Tabs.Tab>
          <Tabs.Tab value="ultimate-guitar" leftSection={<IconGuitarPick size={16} />} fw={500}>
            Import from Ultimate Guitar
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="freeshow" p="xs">
          <Text size="sm" c="dimmed" mb="md">
            Edit in Freeshow format: Add chords in square brackets [G] directly in the lyrics. Use section headers like [Verse], [Chorus], [Bridge], [Tag], [Break], [Intro], [Outro], or [Pre-Chorus].
          </Text>
      
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            minRows={12}
            autosize
            styles={{
              input: {
                fontFamily: 'monospace',
                whiteSpace: 'pre',
                overflowX: 'auto',
                padding: '16px',
                lineHeight: 1.5,
                fontSize: '14px'
              },
              root: {
                marginBottom: '16px'
              }
            }}
            placeholder="[Verse]\nA[G]mazing [C]grace how [D]sweet the sound"
          />
        </Tabs.Panel>

        <Tabs.Panel value="ultimate-guitar" p="xs">
          <Text size="sm" c="dimmed" mb="md">
            Paste Ultimate Guitar format with chords above lyrics.
          </Text>
          <Textarea
            value={ugText}
            onChange={(e) => setUgText(e.currentTarget.value)}
            minRows={12}
            autosize
            styles={{
              input: {
                fontFamily: 'monospace',
                whiteSpace: 'pre',
                overflowX: 'auto',
                padding: '16px',
                lineHeight: 1.5,
                fontSize: '14px'
              },
              root: {
                marginBottom: '16px'
              }
            }}
            placeholder="Paste Ultimate Guitar Chords Here:"
          />
          <Button
            mt="md"
            mb="md"
            onClick={handleUltimateGuitarImport}
            leftSection={<IconGuitarPick size={16} />}
            size="md"
          >
            Import to FreeShow Format
          </Button>
        </Tabs.Panel>
      </Tabs>
      
      <Group justify="space-between" mt="md">
        <Group gap="md">
          <Tooltip label="Undo">
            <ActionIcon 
              variant="light" 
              onClick={handleUndo} 
              disabled={historyIndex === 0}
              size="lg"
            >
              <IconArrowBackUp size={18} />
            </ActionIcon>
          </Tooltip>
          
          <Tooltip label="Redo">
            <ActionIcon 
              variant="light" 
              onClick={handleRedo} 
              disabled={historyIndex === history.length - 1}
              size="lg"
            >
              <IconArrowForwardUp size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
        
        <Group gap="md">
          {onCancel && (
            <Button variant="light" color="gray" onClick={onCancel} size="md">
              Cancel
            </Button>
          )}
          
          <Button 
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            size="md"
          >
            Save Changes
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
