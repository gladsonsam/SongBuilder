import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Title, TextInput, Button, Group, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconUpload, IconDownload } from '@tabler/icons-react';
import { ImportSongModal } from '../components/ImportSongModal';
import { ExportModal } from '../components/ExportModal';
import { getSong, saveSong, updateSong } from '../utils/db';
import { SongSection } from '../components/SongSection';
import { Section, Song } from '../types/song';

export function SongEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [song, setSong] = useState<Song>({ title: '', artist: '', sections: [] });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load song if editing existing
  useEffect(() => {
    if (id) {
      loadSong(id);
    }
  }, [id]);

  const loadSong = async (songId: string) => {
    try {
      const loadedSong = await getSong(songId);
      if (loadedSong) {
        setSong(loadedSong);
      }
    } catch (error) {
      console.error('Failed to load song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load song',
        color: 'red'
      });
    }
  };

  const handleImport = (sections: Section[]) => {
    setSong(prev => ({ ...prev, sections }));
    setImportModalOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (id) {
        await updateSong({
          ...song,
          id,
          title: song.title,
          artist: song.artist,
          sections: song.sections,
          createdAt: song.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const newId = await saveSong({
          title: song.title,
          artist: song.artist,
          sections: song.sections
        });
        navigate(`/songs/${newId}`);
      }
      notifications.show({
        title: 'Success',
        message: 'Song saved successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to save song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save song',
        color: 'red'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <ActionIcon
            variant="subtle"
            onClick={() => navigate('/songs')}
            title="Back to Songs"
          >
            <IconArrowLeft />
          </ActionIcon>
          <Title order={2}>{id ? 'Edit Song' : 'New Song'}</Title>
        </Group>
        <Group>
          <Button
            variant="light"
            leftSection={<IconUpload size={16} />}
            onClick={() => setImportModalOpen(true)}
          >
            Import
          </Button>
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={() => setExportModalOpen(true)}
          >
            Export
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        </Group>
      </Group>

      <Group grow>
        <TextInput
          label="Title"
          value={song.title}
          onChange={(e) => setSong(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter song title"
        />
        <TextInput
          label="Artist"
          value={song.artist}
          onChange={(e) => setSong(prev => ({ ...prev, artist: e.target.value }))}
          placeholder="Enter artist name"
        />
      </Group>

      <Stack gap="md">
        {song.sections.map((section, index) => (
          <SongSection
            key={index}
            type={section.type}
            content={section.content}
            number={section.number}
            chords={section.chords}
          />
        ))}
      </Stack>

      <ImportSongModal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />

      <ExportModal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        sections={song.sections}
      />
    </Stack>
  );
}