import * as React from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, Tabs, FileButton, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileText, IconUpload } from '@tabler/icons-react';
import { Section } from '../types/song';
import { parseUltimateGuitarText, parseFreeshowText, parseShowFile, parseXMLFile } from '../utils/parsers';
import { NoChordWarningModal } from './NoChordWarningModal';
import { toTitleCase } from '../utils/formatters';
import { sanitizeTextContent } from '../utils/validation';

interface ImportSongModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (sections: Section[], metadata?: { title?: string; artist?: string }) => void;
}

export function ImportSongModal({ opened, onClose, onImport }: ImportSongModalProps) {
  const [importText, setImportText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showNoChordWarning, setShowNoChordWarning] = React.useState(false);
  const [pendingImport, setPendingImport] = React.useState<{
    sections: Section[],
    metadata?: { title?: string; artist?: string }
  } | null>(null);
  // Validation will be added when needed

  const detectFormat = (text: string): 'ultimate-guitar' | 'freeshow' | 'openlp' => {
    // Check for Ultimate Guitar format (chords above lyrics)
    const lines = text.split('\n');
    let hasChordLine = false;
    let hasSection = false;
    let hasInlineChords = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        hasSection = true;
      }
      // Check for chord line (typical Ultimate Guitar format)
      if (/^[A-Ga-g][#mb\d+\s\/]*/.test(line)) {
        hasChordLine = true;
      }
      // Check for inline chords like [G] or [Am] within lyrics (FreeShow format)
      if (/\[([A-G][#b]?(?:maj|min|m|aug|dim|sus|add|M)?(?:\d+)?(?:\/[A-G][#b]?)?)\]/.test(line)) {
        hasInlineChords = true;
      }
    }

    if (hasSection && hasInlineChords) {
      return 'freeshow';
    }

    if (hasSection && hasChordLine) {
      return 'ultimate-guitar';
    }

    // Default to FreeShow if it has sections but format is unclear
    if (hasSection) {
      return 'freeshow';
    }

    // Default to Ultimate Guitar for backward compatibility
    return 'ultimate-guitar';
  };

  const handleTextImport = async () => {
    try {
      if (!importText.trim()) {
        notifications.show({
          title: 'Error',
          message: 'Please paste some song text to import',
          color: 'red'
        });
        return;
      }

      setIsLoading(true);
      
      // Sanitize import text for security
      const sanitizedText = sanitizeTextContent(importText);
      
      if (sanitizedText !== importText) {
        notifications.show({
          title: 'Content Sanitized',
          message: 'Potentially unsafe content was removed from the import text',
          color: 'yellow'
        });
      }
      
      const format = detectFormat(sanitizedText);

      let sections: Section[] = [];
      if (format === 'ultimate-guitar') {
        sections = parseUltimateGuitarText(sanitizedText);
      } else if (format === 'freeshow') {
        sections = parseFreeshowText(sanitizedText);
      }

      // Validate sections before import
      if (sections.length > 50) {
        notifications.show({
          title: 'Too Many Sections',
          message: 'Song has too many sections (max 50). Some sections may be truncated.',
          color: 'yellow'
        });
        sections = sections.slice(0, 50);
      }

      onImport(sections);
      setImportText('');
      notifications.show({
        title: 'Success',
        message: 'Song imported successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to import song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to import song',
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = async (file: File | null) => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      
      // Read the file content as text
      const fileText = await file.text();
      
      let sections: Section[] = [];
      
      // Determine the file type based on extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      let metadata: { title?: string; artist?: string } | undefined;
      
      if (fileExtension === 'show') {
        // Parse FreeShow .show file (JSON format)
        console.log('Parsing .show file...');
        
        // Log the first part of the file content for debugging
        console.log('File content preview:', fileText.substring(0, 200));
        
        try {
          // Try to manually extract the title from the raw JSON
          const rawData = JSON.parse(fileText);
          if (Array.isArray(rawData) && rawData.length > 1 && rawData[1].name) {
            console.log('Directly extracted title from JSON:', rawData[1].name);
          }
        } catch (e) {
          console.error('Error parsing raw JSON:', e);
        }
        
        const parsedShowFile = parseShowFile(fileText);
        sections = parsedShowFile.sections;
        
        // Extract metadata from the show file
        console.log('Parsed show file metadata:', parsedShowFile.title, parsedShowFile.artist);
        
        if (parsedShowFile.title || parsedShowFile.artist) {
          metadata = {
            title: parsedShowFile.title,
            artist: parsedShowFile.artist
          };
          console.log('Setting metadata:', metadata);
        }
      } else if (fileExtension === 'xml') {
        // Parse XML file
        console.log('Parsing .xml file...');
        
        try {
          const parsedXMLFile = parseXMLFile(fileText);
          sections = parsedXMLFile.sections;
          
          // Extract metadata from the XML file
          console.log('Parsed XML file metadata:', parsedXMLFile.title, parsedXMLFile.artist);
          
          if (parsedXMLFile.title || parsedXMLFile.artist) {
            metadata = {
              title: parsedXMLFile.title ? toTitleCase(parsedXMLFile.title) : '',
              artist: parsedXMLFile.artist || ''
            };
            console.log('Setting metadata:', metadata);
          }
        } catch (error) {
          console.error('Error parsing XML file:', error);
          throw new Error('Failed to parse XML file: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else {
        // For text files, detect the format and parse accordingly
        const format = detectFormat(fileText);
        
        if (format === 'ultimate-guitar') {
          sections = parseUltimateGuitarText(fileText);
        } else if (format === 'freeshow') {
          sections = parseFreeshowText(fileText);
        }
      }
      
      if (sections.length === 0) {
        throw new Error('No sections found in the imported file');
      }
      
      // Check if this is an XML file with no chords
      const isXmlFile = fileExtension === 'xml';
      const hasNoChords = isXmlFile && sections.every(section => !section.chords || section.chords.length === 0);
      
      if (isXmlFile && hasNoChords) {
        console.log('XML file has no chords, showing warning');
        // Store the import data and show the warning
        setPendingImport({ sections, metadata });
        setShowNoChordWarning(true);
      } else {
        // Proceed with import directly
        console.log('Calling onImport with metadata:', metadata);
        onImport(sections, metadata);
        notifications.show({
          title: 'Success',
          message: `Imported ${file.name} successfully`,
          color: 'green'
        });
      }
    } catch (error) {
      console.error('Failed to import song file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to import song file: ' + (error instanceof Error ? error.message : 'Unknown error'),
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title="Import Song"
        size="lg"
      >
      <Tabs defaultValue="text">
        <Tabs.List>
          <Tabs.Tab value="text" leftSection={<IconFileText size="0.8rem" />}>
            Text
          </Tabs.Tab>
          <Tabs.Tab value="file" leftSection={<IconUpload size="0.8rem" />}>
            File
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="text" pt="md">
          <Stack>
            <Text size="sm" c="dimmed">
              Paste your song text below. Supports Ultimate Guitar and FreeShow formats.
            </Text>
            <Textarea
              value={importText}
              onChange={(e) => {
                const text = e.target.value;
                if (text.length <= 50000) { // Reasonable limit for import text
                  setImportText(text);
                } else {
                  notifications.show({
                    title: 'Content Too Large',
                    message: 'Import text is too large (max 50,000 characters)',
                    color: 'red'
                  });
                }
              }}
              placeholder="Paste song text here..."
              minRows={10}
              autosize
              error={importText.length > 45000 ? 'Approaching character limit' : undefined}
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={onClose} title="Cancel import operation">
                Cancel
              </Button>
              <Button onClick={handleTextImport} loading={isLoading} title="Import song from text">
                Import
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="file" pt="md">
          <Stack>
            <Text size="sm" c="dimmed">
              Upload a song file. Supports .show (FreeShow), .xml, .txt, .cho, and .pro files.
            </Text>
            <Box py="md" style={{ display: 'flex', justifyContent: 'center' }}>
              <FileButton onChange={handleFileImport} accept=".show,.xml,.txt,.cho,.pro">
                {(props) => <Button {...props} loading={isLoading} title="Choose a song file to import">Select File</Button>}
              </FileButton>
            </Box>
            <Group justify="flex-end">
              <Button variant="light" onClick={onClose} title="Cancel import operation">
                Cancel
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
      </Modal>
      
      {/* No Chord Warning Modal */}
      <NoChordWarningModal
        opened={showNoChordWarning}
        onClose={() => setShowNoChordWarning(false)}
        songTitle={pendingImport?.metadata?.title || 'Untitled Song'}
        onCancel={() => {
          setShowNoChordWarning(false);
          setPendingImport(null);
        }}
        onContinue={() => {
          if (pendingImport) {
            // Proceed with the import
            onImport(pendingImport.sections, pendingImport.metadata);
            notifications.show({
              title: 'Success',
              message: `Imported ${pendingImport.metadata?.title || 'song'} successfully`,
              color: 'green'
            });
            setShowNoChordWarning(false);
            setPendingImport(null);
          }
        }}
      />
    </>
  );
}