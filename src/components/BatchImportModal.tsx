import * as React from 'react';
import { Modal, Stack, Text, Button, Group, Box, Progress } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconCheck, IconX } from '@tabler/icons-react';
import { parseShowFile } from '../utils/parsers';
import { saveSong } from '../utils/appwriteDb';
// Section type is imported from db.ts since it's used by saveSong

interface BatchImportModalProps {
  opened: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ImportResult {
  fileName: string;
  status: 'success' | 'error';
  message: string;
  songId?: string;
}

export function BatchImportModal({ opened, onClose, onComplete }: BatchImportModalProps) {
  const [isImporting, setIsImporting] = React.useState(false);
  const [results, setResults] = React.useState<ImportResult[]>([]);
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (opened) {
      setResults([]);
      setProgress(0);
      setIsImporting(false);
    }
  }, [opened]);

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setResults([]);
    
    const fileArray = Array.from(files);
    let importedCount = 0;
    const newResults: ImportResult[] = [];

    for (const file of fileArray) {
      try {
        // Only process .show files
        if (!file.name.toLowerCase().endsWith('.show')) {
          newResults.push({
            fileName: file.name,
            status: 'error',
            message: 'Not a .show file'
          });
          continue;
        }

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
          title: title || file.name.replace('.show', ''),
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

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsImporting(false);
    
    // Show notification
    if (importedCount > 0) {
      notifications.show({
        title: 'Import Complete',
        message: `Successfully imported ${importedCount} of ${fileArray.length} songs`,
        color: 'green'
      });
    } else {
      notifications.show({
        title: 'Import Failed',
        message: 'No songs were imported successfully',
        color: 'red'
      });
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      onClose();
      if (results.some(r => r.status === 'success')) {
        onComplete();
      }
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Batch Import Songs"
      size="lg"
      closeOnClickOutside={!isImporting}
      closeOnEscape={!isImporting}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          if (!isImporting && results.length === 0) {
            handleFileSelect();
          }
        }
      }}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Select multiple .show files to import them all at once.
        </Text>
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          accept=".show"
          onChange={handleFilesChange}
        />
        
        <Box py="md" style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            size="lg"
            leftSection={<IconUpload size={20} />}
            onClick={handleFileSelect}
            loading={isImporting}
            disabled={isImporting}
          >
            Select Files
          </Button>
        </Box>
        
        {progress > 0 && (
          <Progress 
            value={progress} 
            size="md" 
            striped={isImporting}
            animated={isImporting}
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
            disabled={isImporting}
          >
            {results.some(r => r.status === 'success') ? 'Done' : 'Cancel'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
