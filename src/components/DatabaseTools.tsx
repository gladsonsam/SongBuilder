import { useState } from 'react';
import { Button, Group, Modal, TextInput, Stack, Text, Radio, FileButton } from '@mantine/core';
import { IconDownload, IconUpload, IconBrandGithub } from '@tabler/icons-react';
import { exportDatabase, importDatabaseFromFile, importDatabaseFromUrl } from '../utils/dbExportImport';

interface DatabaseToolsProps {
  onComplete?: () => void; // Optional callback for when import/export completes
  opened: boolean;
  onClose: () => void;
}

export function DatabaseTools({ onComplete, opened, onClose }: DatabaseToolsProps) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [githubUrlModalOpen, setGithubUrlModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await exportDatabase();
      if (onComplete) onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = async (file: File | null) => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      await importDatabaseFromFile(file, importMode);
      setImportModalOpen(false);
      if (onComplete) onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubImport = async () => {
    if (!githubUrl.trim()) return;
    
    setIsLoading(true);
    try {
      await importDatabaseFromUrl(githubUrl, importMode);
      setGithubUrlModalOpen(false);
      setGithubUrl('');
      if (onComplete) onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Database Tools"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          Export your entire song collection or import songs from a file or GitHub URL.
        </Text>
        
        <Group grow>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExport}
            loading={isLoading}
            variant="light"
          >
            Export Database
          </Button>
          
          <FileButton onChange={handleFileImport} accept=".json">
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={16} />}
                loading={isLoading}
                variant="light"
                onClick={() => setImportModalOpen(true)}
              >
                Import from File
              </Button>
            )}
          </FileButton>
          
          <Button
            leftSection={<IconBrandGithub size={16} />}
            onClick={() => setGithubUrlModalOpen(true)}
            loading={isLoading}
            variant="light"
          >
            Import from GitHub
          </Button>
        </Group>
      </Stack>

      {/* Import Options Modal */}
      <Modal 
        opened={importModalOpen} 
        onClose={() => setImportModalOpen(false)}
        title="Import Database"
        centered
      >
        <Stack gap="md">
          <Text>Choose how to import the songs:</Text>
          
          <Radio.Group
            value={importMode}
            onChange={(value) => setImportMode(value as 'merge' | 'replace')}
          >
            <Stack mt="xs">
              <Radio 
                value="merge" 
                label="Merge - Add songs to your existing collection"
              />
              <Radio 
                value="replace" 
                label="Replace - Remove all existing songs and replace with imported ones"
                color="red"
              />
            </Stack>
          </Radio.Group>
          
          <Text size="sm" c="dimmed" mt="md">
            Select a JSON file containing songs to import.
          </Text>
          
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <FileButton onChange={handleFileImport} accept=".json">
              {(props) => (
                <Button {...props} color={importMode === 'replace' ? 'red' : 'blue'} loading={isLoading}>
                  {importMode === 'replace' ? 'Replace Database' : 'Import Songs'}
                </Button>
              )}
            </FileButton>
          </Group>
        </Stack>
      </Modal>

      {/* GitHub URL Import Modal */}
      <Modal
        opened={githubUrlModalOpen}
        onClose={() => setGithubUrlModalOpen(false)}
        title="Import from GitHub URL"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Enter the raw GitHub URL of a JSON file containing songs to import.
            <br />
            (Example: https://raw.githubusercontent.com/username/repo/main/songs.json)
          </Text>
          
          <TextInput
            label="GitHub Raw URL"
            placeholder="https://raw.githubusercontent.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            required
          />
          
          <Radio.Group
            label="Import Mode"
            value={importMode}
            onChange={(value) => setImportMode(value as 'merge' | 'replace')}
          >
            <Stack mt="xs">
              <Radio 
                value="merge" 
                label="Merge - Add songs to your existing collection"
              />
              <Radio 
                value="replace" 
                label="Replace - Remove all existing songs and replace with imported ones"
                color="red"
              />
            </Stack>
          </Radio.Group>
          
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setGithubUrlModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGithubImport} 
              color={importMode === 'replace' ? 'red' : 'blue'}
              loading={isLoading}
              disabled={!githubUrl.trim()}
            >
              {importMode === 'replace' ? 'Replace Database' : 'Import Songs'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
}
