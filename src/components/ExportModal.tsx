import * as React from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, SegmentedControl, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Section } from '../types/song';
import { exportToFreeshowText, exportToShowFile } from '../utils/exporters';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  sections: Section[];
}

export function ExportModal({ opened, onClose, sections }: ExportModalProps) {
  const [exportType, setExportType] = React.useState<'text' | 'file'>('text');
  const [format, setFormat] = React.useState('freeshow-text');
  const [exportedText, setExportedText] = React.useState('');

  React.useEffect(() => {
    if (opened) {
      handleExport();
    }
  }, [opened, format]); // Removed sections dependency to avoid re-exporting on every section change

  const handleExport = () => {
    try {
      let text = '';
      let fileData: Blob | null = null;
      let fileName = '';
      
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
      
      // Get song metadata from the first section's content (title might be in there)
      const songTitle = document.querySelector('input[value]')?.getAttribute('value') || 'Untitled Song';
      const songArtist = document.querySelectorAll('input[value]')[1]?.getAttribute('value') || '';
      
      const songData = {
        title: songTitle,
        artist: songArtist,
        sections: updatedSections
      };
      
      if (format === 'freeshow-text') {
        text = exportToFreeshowText(updatedSections);
        fileName = `${songTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      } else if (format === 'freeshow-show') {
        text = exportToShowFile(songData, updatedSections);
        fileName = `${songTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.show`;
      }
      // TODO: Add support for other formats

      setExportedText(format.endsWith('text') ? text : 'Binary file format - use Save as File option');

      if (exportType === 'text' && format.endsWith('text')) {
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
      } else if (exportType === 'file') {
        // Create file blob based on format
        if (format === 'freeshow-text') {
          fileData = new Blob([text], { type: 'text/plain' });
        } else if (format === 'freeshow-show') {
          fileData = new Blob([text], { type: 'application/json' });
        }
        
        if (fileData) {
          // Create download link and trigger it
          const url = URL.createObjectURL(fileData);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          notifications.show({
            title: 'Success',
            message: `Saved as ${fileName}`,
            color: 'green',
            autoClose: 2000
          });
        }
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
            { value: 'freeshow-text', label: 'FreeShow Text Format' },
            { value: 'freeshow-show', label: 'FreeShow .show File' }
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
          {exportType === 'file' && (
            <Button onClick={handleExport} color="blue" title="Save exported song to file">
              Save File
            </Button>
          )}
          <Button onClick={onClose} title="Close export dialog">
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
