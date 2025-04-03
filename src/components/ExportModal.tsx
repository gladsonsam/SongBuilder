import * as React from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, SegmentedControl, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Section } from '../types/song';
import { exportToFreeshowText } from '../utils/exporters';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  sections: Section[];
}

export function ExportModal({ opened, onClose, sections }: ExportModalProps) {
  const [exportType, setExportType] = React.useState<'text' | 'file'>('text');
  const [format, setFormat] = React.useState('freeshow');
  const [exportedText, setExportedText] = React.useState('');

  React.useEffect(() => {
    if (opened) {
      handleExport();
    }
  }, [opened, format]); // Removed sections dependency to avoid re-exporting on every section change

  const handleExport = () => {
    try {
      let text = '';
      
      // Get the current transposed chords from the DOM
      const updatedSections = [...sections].map(section => {
        // Create a deep copy to avoid modifying the original
        const sectionCopy = { ...section, chords: [...section.chords] };
        
        // Update chord text with current transposed values from DOM
        sectionCopy.chords = sectionCopy.chords.map(chord => {
          // Find the corresponding DOM element
          const chordElement = document.querySelector(`[data-original="${chord.text}"]`);
          if (chordElement && chordElement.textContent) {
            // Use the current displayed chord text (which may be transposed)
            return { ...chord, text: chordElement.textContent };
          }
          return chord;
        });
        
        return sectionCopy;
      });
      
      if (format === 'freeshow') {
        text = exportToFreeshowText(updatedSections);
      }
      // TODO: Add support for other formats

      setExportedText(text);

      if (exportType === 'text') {
        // Only show notification once when first opened
        navigator.clipboard.writeText(text).then(() => {
          // Only show notification when first opened, not on every change
          if (opened) {
            notifications.show({
              title: 'Success',
              message: 'Copied to clipboard',
              color: 'green',
              autoClose: 2000 // Close after 2 seconds
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to export song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to export song',
        color: 'red'
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Export Song"
      size="lg"
    >
      <Stack>
        <SegmentedControl
          fullWidth
          data={[
            { label: 'Copy as Text', value: 'text' },
            { label: 'Save as File', value: 'file' }
          ]}
          value={exportType}
          onChange={(value) => setExportType(value as 'text' | 'file')}
        />

        <Select
          label="Format"
          value={format}
          onChange={(value) => setFormat(value || 'freeshow')}
          data={[
            { value: 'freeshow', label: 'Freeshow Text' }
          ]}
        />

        <Text size="sm" c="dimmed">
          {exportType === 'text' ? 'The text will be copied to your clipboard.' : 'The song will be saved as a file.'}
        </Text>

        <Textarea
          value={exportedText}
          readOnly
          minRows={10}
          autosize
        />

        <Group justify="flex-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
