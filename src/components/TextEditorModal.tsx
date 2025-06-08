import * as React from 'react';
import { Modal, Button, Group, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Section } from '../types/song';
import { parseFreeshowText } from '../utils/parsers';

interface TextEditorModalProps {
  opened: boolean;
  onClose: () => void;
  sections: Section[];
  onSave: (sections: Section[]) => void;
}

export function TextEditorModal({ opened, onClose, sections, onSave }: TextEditorModalProps) {
  // Convert sections to text format
  const sectionsToText = (sections: Section[]): string => {
    return sections.map(section => {
      // Create section header with title case
      const sectionType = section.type.charAt(0).toUpperCase() + section.type.slice(1).toLowerCase();
      const sectionHeader = `[${sectionType}]`;
      
      // Split content into lines and process each line with its chords
      const lines = section.content.split('\n').filter(line => line.trim() !== '');
      const processedLines = lines.map((line, lineIndex) => {
        // Get chords for this line
        const lineChords = section.chords
          .filter(chord => chord.line === lineIndex)
          .sort((a, b) => a.position - b.position);
        
        // Insert chords into the line
        let result = line;
        let offset = 0;
        lineChords.forEach(chord => {
          const insertPosition = chord.position + offset;
          result = result.slice(0, insertPosition) + 
                  `[${chord.text}]` + 
                  result.slice(insertPosition);
          offset += chord.text.length + 2; // Add 2 for the brackets
        });
        
        return result;
      });
      
      // Combine section header with processed lines
      return `${sectionHeader}\n${processedLines.join('\n')}`;
    }).join('\n\n'); // Use double newline between sections for clarity
  };

  // State for the text content
  const [text, setText] = React.useState('');

  // Initialize text when modal opens
  React.useEffect(() => {
    if (opened) {
      setText(sectionsToText(sections));
    }
  }, [opened, sections]);

  const handleSave = () => {
    try {
      // Parse the text back into sections
      const newSections = parseFreeshowText(text);
      
      // Call the onSave callback with the new sections
      onSave(newSections);
      
      // Close the modal
      onClose();
      
      notifications.show({
        title: 'Success',
        message: 'Song text updated successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to parse song text:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to parse song text. Please check the format.',
        color: 'red'
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Full Song Text"
      size="xl"
      fullScreen
    >
      <Textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          }
        }}
        minRows={30}
        styles={{
          input: {
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            height: 'calc(100vh - 120px)', // Adjusted to use full viewport height minus header and buttons
            maxHeight: 'unset'
          },
          root: {
            height: 'calc(100vh - 120px)' // Ensure root container matches input height
          }
        }}
        placeholder="[Verse]
[G]Amazing gr[D]ace how [Em]sweet the s[C]ound"
      />
      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </Group>
    </Modal>
  );
}