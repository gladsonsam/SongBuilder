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
  }, [opened, format, sections]);

  const handleExport = () => {
    try {
      let text = '';
      if (format === 'freeshow') {
        text = exportToFreeshowText(sections);
      }
      // TODO: Add support for other formats

      setExportedText(text);

      if (exportType === 'text') {
        navigator.clipboard.writeText(text).then(() => {
          notifications.show({
            title: 'Success',
            message: 'Copied to clipboard',
            color: 'green'
          });
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
