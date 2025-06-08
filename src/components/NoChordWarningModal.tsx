import { Modal, Text, Button, Group, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface NoChordWarningModalProps {
  opened: boolean;
  onClose: () => void;
  onContinue: () => void;
  onCancel: () => void;
  songTitle: string;
}

export function NoChordWarningModal({ opened, onClose, onContinue, onCancel, songTitle }: NoChordWarningModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="No Chords Detected"
      centered
      size="md"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          onContinue();
        }
      }}
    >
      <Stack>
        <Group>
          <IconAlertTriangle size={24} color="orange" />
          <Text fw={500} size="lg">Warning: No chords were found in this song.</Text>
        </Group>
        
        <Text>
          The song "{songTitle}" doesn't appear to have any chord information in the XML file.
          You can still import it, but you'll need to add chords manually.
        </Text>
        
        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onCancel}>
            Cancel Import
          </Button>
          <Button onClick={onContinue}>
            Import Anyway
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
