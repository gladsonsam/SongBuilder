
import { Paper, Title, Box } from '@mantine/core';
import { RichTextEditor } from './RichTextEditor';

interface SongNotesProps {
  notes: string;
  onChange: (notes: string) => void;
}

export function SongNotes({ notes, onChange }: SongNotesProps) {
  return (
    <Paper withBorder p="md">
      <Title order={3} mb="md">Notes</Title>
      <Box mb="md">
        <RichTextEditor 
          content={notes || ''} 
          onChange={onChange}
          placeholder="Add notes about this song here..."
        />
      </Box>
    </Paper>
  );
}
