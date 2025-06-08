import * as React from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, Tabs, FileButton, Box, Progress } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileText, IconUpload, IconCheck, IconX } from '@tabler/icons-react';
import { parseUltimateGuitarText, parseFreeshowText, parseShowFile, parseXMLFile } from '../utils/parsers';
import { saveSong } from '../utils/appwriteDb';
import { NoChordWarningModal } from './NoChordWarningModal';
import { toTitleCase } from '../utils/formatters';

interface UnifiedImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (sections: any[], metadata?: { title?: string; artist?: string }) => void;
  onBatchComplete?: () => void;
}

interface ImportResult {
  fileName: string;
  status: 'success' | 'error';
  message: string;
  songId?: string;
}

export function UnifiedImportModal({ opened, onClose, onImport, onBatchComplete }: UnifiedImportModalProps) {
  const [importText, setImportText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<ImportResult[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [isBatchMode, setIsBatchMode] = React.useState(false);
  const [showNoChordWarning, setShowNoChordWarning] = React.useState(false);
  const [pendingImport, setPendingImport] = React.useState<{
    sections: any[],
    metadata?: { title?: string; artist?: string },
    fileName: string
  } | null>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (opened) {
      setImportText('');
      setResults([]);
      setProgress(0);
      setIsLoading(false);
      setIsBatchMode(false);
    }
  }, [opened]);

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
      const format = detectFormat(importText);

      let sections: any[] = [];
      if (format === 'ultimate-guitar') {
        sections = parseUltimateGuitarText(importText);
      } else if (format === 'freeshow') {
        sections = parseFreeshowText(importText);
      }

      onImport(sections);
      setImportText('');
      notifications.show({
        title: 'Success',
        message: 'Song imported successfully',
        color: 'green'
      });
      onClose();
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

  const handleFileImport = async (files: File[]) => {
    if (!files || files.length === 0) return;

    // If only one file is selected, process it as a single import
    if (files.length === 1) {
      handleSingleFileImport(files[0]);
      return;
    }

    // Multiple files selected - switch to batch mode
    setIsBatchMode(true);
    setIsLoading(true);
    setResults([]);
    
    const fileArray = Array.from(files);
    let importedCount = 0;
    const newResults: ImportResult[] = [];

    for (const file of fileArray) {
      try {
        // Process the file based on extension
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'show') {
          // Read file content
          const fileText = await file.text();
          
          // Parse the show file
          const parsedShowFile = parseShowFile(fileText);
          const { sections, title, artist } = parsedShowFile;
          
          if (sections.length === 0) {
            newResults.push({
              fileName: file.name,
              status: 'error',
              message: 'No sections found in file'
            });
            continue;
          }
          
          // Save as a new song
          const newId = await saveSong({
            title: toTitleCase(title || file.name.replace('.show', '')),
            artist: artist || '',
            sections
          });
          
          newResults.push({
            fileName: file.name,
            status: 'success',
            message: 'Imported successfully',
            songId: newId
          });
          
          importedCount++;
        } else if (fileExtension === 'xml') {
          // Read file content
          const fileText = await file.text();
          
          try {
            // Parse the XML file
            const parsedXMLFile = parseXMLFile(fileText);
            const { sections, title, artist, tags } = parsedXMLFile;
            
            console.log('XML Import - Parsed file:', { title, artist, tags, sectionCount: sections.length });
            
            // Extract themes directly from XML content using regex
            const themesMatch = fileText.match(/<themes>([\s\S]*?)<\/themes>/);
            let extractedThemes: string[] = [];
            
            if (themesMatch && themesMatch[1]) {
              const themeMatches = themesMatch[1].match(/<theme>([^<]+)<\/theme>/g);
              if (themeMatches) {
                extractedThemes = themeMatches.map(match => {
                  return match.replace(/<theme>|<\/theme>/g, '').trim();
                });
                console.log('XML Import - Directly extracted themes:', extractedThemes);
              }
            }
            
            if (sections.length === 0) {
              newResults.push({
                fileName: file.name,
                status: 'error',
                message: 'No sections found in file'
              });
              continue;
            }
            
            // Save as a new song with tags - use the extracted themes if available
            const finalTags = extractedThemes.length > 0 ? extractedThemes : (tags || []);
            console.log('XML Import - Final tags to save:', finalTags);
            
            // Make sure tags are properly formatted as an array of strings
            // Force conversion to an array of strings and remove any empty values
            const processedTags = Array.isArray(finalTags) 
              ? finalTags
                  .map(tag => String(tag).trim())
                  .filter(tag => tag.length > 0)
              : [];
            console.log('XML Import - Processed tags:', processedTags);
            
            const songToSave = {
              title: title || file.name.replace('.xml', ''),
              artist: artist || '',
              sections,
              tags: processedTags
            };
            
            console.log('XML Import - Saving song with tags:', songToSave.tags);
            
            // Debug: Log the exact type and structure of the tags
            console.log('XML Import - Tags type:', typeof songToSave.tags);
            console.log('XML Import - Tags is array:', Array.isArray(songToSave.tags));
            console.log('XML Import - Tags stringified:', JSON.stringify(songToSave.tags));
            
            const newId = await saveSong(songToSave);
            
            newResults.push({
              fileName: file.name,
              status: 'success',
              message: 'Imported successfully',
              songId: newId
            });
            
            importedCount++;
          } catch (error) {
            console.error(`Error parsing XML file ${file.name}:`, error);
            newResults.push({
              fileName: file.name,
              status: 'error',
              message: 'Failed to parse XML file: ' + (error instanceof Error ? error.message : 'Unknown error')
            });
          }
        } else {
          // For other file types
          const fileText = await file.text();
          const format = detectFormat(fileText);
          
          let sections: any[] = [];
          if (format === 'ultimate-guitar') {
            sections = parseUltimateGuitarText(fileText);
          } else if (format === 'freeshow') {
            sections = parseFreeshowText(fileText);
          }
          
          if (sections.length === 0) {
            newResults.push({
              fileName: file.name,
              status: 'error',
              message: 'No sections found in file'
            });
            continue;
          }
          
          // Save as a new song
          const newId = await saveSong({
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: '',
            sections
          });
          
          newResults.push({
            fileName: file.name,
            status: 'success',
            message: 'Imported successfully',
            songId: newId
          });
          
          importedCount++;
        }
      } catch (error) {
        console.error(`Error importing ${file.name}:`, error);
        newResults.push({
          fileName: file.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Update progress
      setProgress(Math.round(((newResults.length) / fileArray.length) * 100));
      setResults([...newResults]);
    }

    setIsLoading(false);
    
    // Show notification
    if (importedCount > 0) {
      notifications.show({
        title: 'Import Complete',
        message: `Successfully imported ${importedCount} of ${fileArray.length} songs`,
        color: 'green'
      });
      
      // Refresh song list if callback provided
      if (onBatchComplete) {
        onBatchComplete();
      }
    } else {
      notifications.show({
        title: 'Import Failed',
        message: 'No songs were imported successfully',
        color: 'red'
      });
    }
  };

  const handleSingleFileImport = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Read the file content as text
      const fileText = await file.text();
      
      let sections: any[] = [];
      let metadata: { title?: string; artist?: string } | undefined;
      
      // Determine the file type based on extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'show') {
        // Parse FreeShow .show file (JSON format)
        const parsedShowFile = parseShowFile(fileText);
        sections = parsedShowFile.sections;
        
        // Extract metadata from the show file
        if (parsedShowFile.title || parsedShowFile.artist) {
          metadata = {
            title: parsedShowFile.title ? toTitleCase(parsedShowFile.title) : '',
            artist: parsedShowFile.artist || ''
          };
        }
      } else if (fileExtension === 'xml') {
        // Parse XML file
        const parsedXMLFile = parseXMLFile(fileText);
        sections = parsedXMLFile.sections;
        
        // Extract metadata from the XML file
        if (parsedXMLFile.title || parsedXMLFile.artist) {
          metadata = {
            title: parsedXMLFile.title ? toTitleCase(parsedXMLFile.title) : '',
            artist: parsedXMLFile.artist || ''
          };
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
        setPendingImport({ sections, metadata, fileName: file.name });
        setShowNoChordWarning(true);
      } else {
        // Proceed with import directly
        onImport(sections, metadata);
        onClose();
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

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      if (isBatchMode && results.some(r => r.status === 'success') && onBatchComplete) {
        onBatchComplete();
      }
    }
  };


  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title="Import Song"
        size="lg"
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!isLoading) {
              if (importText.trim()) {
                handleTextImport();
              }
            }
          }
        }}
      >
      {!isBatchMode ? (
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
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste song text here..."
                minRows={10}
                autosize
              />
              <Group justify="flex-end">
                <Button variant="light" onClick={onClose} title="Cancel import operation">
                  Cancel
                </Button>
                <Button onClick={handleTextImport} loading={isLoading} title="Import songs from text">
                  Import
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="file" pt="md">
            <Stack>
              <Text size="sm" c="dimmed">
                Upload song files. Supports .show (FreeShow), .xml, .txt, .cho, and .pro files.
                Select multiple files to batch import.
              </Text>
              <Box py="md" style={{ display: 'flex', justifyContent: 'center' }}>
                <FileButton onChange={handleFileImport} accept=".show,.xml,.txt,.cho,.pro" multiple>
                  {(props) => <Button {...props} loading={isLoading} title="Choose song files to import">Select File(s)</Button>}
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
      ) : (
        <Stack>
          <Text size="sm" c="dimmed">
            Importing multiple files. Please wait while the files are processed.
          </Text>
          
          {progress > 0 && (
            <Progress 
              value={progress} 
              size="md" 
              striped={isLoading}
              animated={isLoading}
              color={progress === 100 ? 'green' : 'blue'}
            />
          )}
          
          {results.length > 0 && (
            <Stack gap="xs">
              <Text fw={500}>Import Results:</Text>
              {results.map((result, index) => (
                <Group key={index} justify="space-between" p="xs" style={{ 
                  backgroundColor: result.status === 'success' ? 'rgba(0, 180, 0, 0.1)' : 'rgba(180, 0, 0, 0.1)',
                  borderRadius: '4px'
                }}>
                  <Group>
                    {result.status === 'success' ? (
                      <IconCheck size={16} color="green" />
                    ) : (
                      <IconX size={16} color="red" />
                    )}
                    <Text size="sm">{result.fileName}</Text>
                  </Group>
                  <Text size="sm" c={result.status === 'success' ? 'green' : 'red'}>
                    {result.message}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
          
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={handleClose}
              disabled={isLoading}
            >
              {results.some(r => r.status === 'success') ? 'Done' : 'Cancel'}
            </Button>
          </Group>
        </Stack>
      )}
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
              message: `Imported ${pendingImport.fileName} successfully`,
              color: 'green'
            });
            onClose();
            setShowNoChordWarning(false);
            setPendingImport(null);
          }
        }}
      />
    </>
  );
}
