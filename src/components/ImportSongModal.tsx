import * as React from 'react';
import { Modal, Stack, Text, Textarea, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Section } from '../types/song';
import { parseUltimateGuitarText } from '../utils/parsers';

interface ImportSongModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (sections: Section[]) => void;
}

export function ImportSongModal({ opened, onClose, onImport }: ImportSongModalProps) {
  const [importText, setImportText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const detectFormat = (text: string): 'ultimate-guitar' | 'freeshow' | 'openlp' => {
    // Check for Ultimate Guitar format (chords above lyrics)
    const lines = text.split('\n');
    let hasChordLine = false;
    let hasSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        hasSection = true;
      }
      // Check for chord line (typical Ultimate Guitar format)
      if (/^[A-Ga-g][#mb\d+\s\/]*/.test(line)) {
        hasChordLine = true;
      }
    }

    if (hasSection && hasChordLine) {
      return 'ultimate-guitar';
    }

    // For now, default to Ultimate Guitar
    // TODO: Add detection for other formats
    return 'ultimate-guitar';
  };

  const handleImport = async () => {
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

      let sections: Section[] = [];
      if (format === 'ultimate-guitar') {
        sections = parseUltimateGuitarText(importText);
      }
      // TODO: Add support for other formats

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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Import Song"
      size="lg"
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Paste your song text below. Currently supports Ultimate Guitar format.
        </Text>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste song text here..."
          minRows={10}
          autosize
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} loading={isLoading}>
            Import
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}