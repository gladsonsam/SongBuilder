import { Paper, Title, Box } from '@mantine/core';
import { RichTextEditor } from './RichTextEditor';

interface SongNotesProps {
  notes: string;
  onChange: (notes: string) => void;
  isViewMode?: boolean;
}

export function SongNotes({ notes, onChange, isViewMode }: SongNotesProps) {
  return (
    <Paper withBorder p="md">
      <Title order={3} mb="md">Notes</Title>
      <Box mb="md">
        {isViewMode ? (
          <div
            className="rich-text-editor-content"
            dangerouslySetInnerHTML={{ __html: notes || '' }}
          />
        ) : (
          <RichTextEditor
            content={notes || ''}
            onChange={onChange}
            placeholder="Add notes about this song here..."
          />
        )}
      </Box>
    </Paper>
  );
}
