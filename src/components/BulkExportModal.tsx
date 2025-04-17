import { useState } from 'react';
import { Modal, Stack, Group, Button, Select, Radio, Text } from '@mantine/core';
import JSZip from 'jszip';
import { notifications } from '@mantine/notifications';
import { exportToShowFile } from '../utils/exporters';
import { exportToPDF } from '../utils/exportToPDF';
import type { Song } from '../types/song';

interface BulkExportModalProps {
  opened: boolean;
  onClose: () => void;
  songs: Song[];
}

export function BulkExportModal({ opened, onClose, songs }: BulkExportModalProps) {
  const [fileFormat, setFileFormat] = useState<'freeshow-show' | 'pdf'>('freeshow-show');
  const [exportType, setExportType] = useState<'zip' | 'multiple'>('zip');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (fileFormat === 'freeshow-show') {
        if (exportType === 'zip') {
          const zip = new JSZip();
          songs.forEach(song => {
            const fileContent = exportToShowFile(song, song.sections);
            const safeTitle = (song.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            zip.file(`${safeTitle}.show`, fileContent);
          });
          const blob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'songs_export.zip';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          notifications.show({ title: 'Success', message: 'Exported as ZIP', color: 'green' });
        } else {
          // Multiple files: trigger download for each
          songs.forEach(song => {
            const fileContent = exportToShowFile(song, song.sections);
            const safeTitle = (song.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeTitle}.show`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          });
          notifications.show({ title: 'Success', message: 'Exported as multiple files', color: 'green' });
        }
      } else if (fileFormat === 'pdf') {
        const skipped: string[] = [];
        if (exportType === 'zip') {
          const zip = new JSZip();
          for (const song of songs) {
            try {
              const pdfBlob = await exportToPDF(song);
              const safeTitle = (song.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
              zip.file(`${safeTitle}.pdf`, pdfBlob);
            } catch (e: any) {
              if (e && e.message && e.message.includes('WinAnsi')) {
                skipped.push(song.title || 'Untitled Song');
              } else {
                throw e;
              }
            }
          }
          const blob = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'songs_export.zip';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          let msg = 'Exported as ZIP';
          if (skipped.length) {
            msg += `. Skipped: ${skipped.join(', ')} (contains characters not supported by the current PDF font)`;
          }
          notifications.show({ title: 'Success', message: msg, color: skipped.length ? 'yellow' : 'green', autoClose: 8000 });
        } else {
          // Multiple files: trigger download for each
          for (const song of songs) {
            try {
              const pdfBlob = await exportToPDF(song);
              const safeTitle = (song.title || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const url = URL.createObjectURL(pdfBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${safeTitle}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            } catch (e: any) {
              if (e && e.message && e.message.includes('WinAnsi')) {
                skipped.push(song.title || 'Untitled Song');
              } else {
                throw e;
              }
            }
          }
          let msg = 'Exported as multiple files';
          if (skipped.length) {
            msg += `. Skipped: ${skipped.join(', ')} (contains characters not supported by the current PDF font)`;
          }
          notifications.show({ title: 'Success', message: msg, color: skipped.length ? 'yellow' : 'green', autoClose: 8000 });
        }
      }
      onClose();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to export songs', color: 'red' });
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Bulk Export Songs" centered>
      <Stack>
        <Select
          label="File format"
          data={[
            { value: 'freeshow-show', label: 'FreeShow (.show)' },
            { value: 'pdf', label: 'PDF Chord Chart (.pdf)' },
          ]}
          value={fileFormat}
          onChange={v => setFileFormat(v as 'freeshow-show' | 'pdf')}
          radius="sm"
          variant="filled"
        />
        <Radio.Group
          label="Export as"
          value={exportType}
          onChange={v => setExportType(v as 'zip' | 'multiple')}
        >
          <Group>
            <Radio value="zip" label="Download as ZIP" />
            <Radio value="multiple" label="Download as multiple files" />
          </Group>
        </Radio.Group>
        <Text size="sm" color="dimmed">
          This will export {songs.length} song{songs.length !== 1 ? 's' : ''} as {fileFormat === 'pdf' ? 'PDF chord charts' : 'FreeShow .show files'}.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isExporting}>Cancel</Button>
          <Button onClick={handleExport} loading={isExporting} disabled={songs.length === 0}>
            Export
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
