import * as React from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, SegmentedControl, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Section } from '../types/song';
import { exportToFreeshowText, exportToUltimateGuitarText, exportToShowFile } from '../utils/exporters';
import { exportToPDF } from '../utils/exportToPDF';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  sections: Section[];
}

export function ExportModal({ opened, onClose, sections }: ExportModalProps) {
  const [exportType, setExportType] = React.useState<'text' | 'file'>('text');
  const [textFormat, setTextFormat] = React.useState<'freeshow' | 'ultimate-guitar'>('freeshow');
  const [fileFormat, setFileFormat] = React.useState<'freeshow-show' | 'pdf'>('freeshow-show');
  const [exportedText, setExportedText] = React.useState('');

  React.useEffect(() => {
    if (opened) {
      // Only auto-export for text formats, not for file formats
      // This prevents automatic downloads when switching to file mode
      if (exportType === 'text') {
        handleExport();
      } else {
        // For file formats, just prepare the text preview without downloading
        prepareFileExport();
      }
    }
  }, [opened, textFormat, fileFormat, exportType]); // Re-export when format or export type changes

  // Get updated sections with transposed chords from the DOM
  const getUpdatedSections = () => {
    return [...sections].map(section => {
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
  };

  // Get song metadata from the DOM
  const getSongMetadata = () => {
    const songTitle = document.querySelector('input[value]')?.getAttribute('value') || 'Untitled Song';
    const songArtist = document.querySelectorAll('input[value]')[1]?.getAttribute('value') || '';
    
    return {
      title: songTitle,
      artist: songArtist,
      fileName: `${songTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
    };
  };

  // Prepare file export without downloading
  const prepareFileExport = () => {
    try {
      // Just update the preview text without triggering download
      if (fileFormat === 'freeshow-show') {
        setExportedText('FreeShow .show file format - click Save File to download');
      } else if (fileFormat === 'pdf') {
        setExportedText('PDF chord chart - click Save File to download');
      }
    } catch (error) {
      console.error('Failed to prepare file export:', error);
      setExportedText('Error preparing file export');
    }
  };

  // Handle text export
  const handleTextExport = () => {
    try {
      const updatedSections = getUpdatedSections();
      const { title, artist } = getSongMetadata();
      
      let text = '';
      
      if (textFormat === 'freeshow') {
        text = exportToFreeshowText(updatedSections);
      } else if (textFormat === 'ultimate-guitar') {
        text = exportToUltimateGuitarText(updatedSections, title, artist);
      }
      
      setExportedText(text);
      
      // Copy to clipboard automatically for text formats
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
    } catch (error) {
      console.error('Failed to export text:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to export text',
        color: 'red'
      });
    }
  };

  // Handle file export with download
  const handleFileExport = () => {
    try {
      const updatedSections = getUpdatedSections();
      const { title, artist, fileName } = getSongMetadata();
      
      const songData = {
        title,
        artist,
        sections: updatedSections
      };
      
      let text = '';
      let fileData: Blob | null = null;
      let fileExtension = '';
      
      if (fileFormat === 'freeshow-show') {
        text = exportToShowFile(songData, updatedSections);
        fileExtension = '.show';
        fileData = new Blob([text], { type: 'application/json' });
      } else if (fileFormat === 'pdf') {
        fileExtension = '.pdf';
      }
      
      if (fileFormat === 'pdf') {
        // Generate PDF and trigger download
        exportToPDF({ ...songData, tags: [] }).then((pdfBlob) => {
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}${fileExtension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          notifications.show({
            title: 'Success',
            message: `Saved as ${fileName}${fileExtension}`,
            color: 'green',
            autoClose: 2000
          });
        });
        return;
      }
      
      if (fileData) {
        // Create download link and trigger it
        const url = URL.createObjectURL(fileData);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        notifications.show({
          title: 'Success',
          message: `Saved as ${fileName}${fileExtension}`,
          color: 'green',
          autoClose: 2000
        });
      }
    } catch (error) {
      console.error('Failed to export file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to export file',
        color: 'red'
      });
    }
  };

  // Main export handler that routes to the appropriate export function
  const handleExport = () => {
    if (exportType === 'text') {
      handleTextExport();
    } else {
      handleFileExport();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Export Song"
      size="lg"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleExport();
        }
      }}
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

        {exportType === 'text' ? (
          <>
            <Select
              label="Text format"
              value={textFormat}
              onChange={(value: string | null) => setTextFormat((value as 'freeshow' | 'ultimate-guitar') || 'freeshow')}
              data={[
                { value: 'freeshow', label: 'FreeShow Format' },
                { value: 'ultimate-guitar', label: 'Ultimate Guitar Format' },
              ]}
              variant="filled"
              radius="sm"
              mb="xs"
            />
            <Text size="sm" c="dimmed">
              The {textFormat === 'freeshow' ? 'FreeShow' : 'Ultimate Guitar'} formatted text will be automatically copied to your clipboard.
            </Text>
            <Textarea
              value={exportedText}
              readOnly
              minRows={10}
              autosize
            />
          </>
        ) : (
          <>
            <Select
              label="File format"
              value={fileFormat}
              onChange={(value: string | null) => setFileFormat((value as 'freeshow-show' | 'pdf') || 'freeshow-show')}
              data={[
                { value: 'freeshow-show', label: 'FreeShow (.show)' },
                { value: 'pdf', label: 'PDF Chord Chart (.pdf)' },
              ]}
              variant="filled"
              radius="sm"
              mb="xs"
            />
            <Text size="sm" c="dimmed">
              Select a file format and click Save File to download.
            </Text>
            <Group justify="flex-end">
              <Button onClick={handleFileExport} color="blue" title="Save exported song to file">
                Save File
              </Button>
              <Button onClick={onClose} title="Close export dialog">
                Close
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
