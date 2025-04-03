import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Title, TextInput, Button, Group, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconUpload, IconDownload } from '@tabler/icons-react';
import { UnifiedImportModal } from '../components/UnifiedImportModal';
import { ExportModal } from '../components/ExportModal';
import { getSong, saveSong, updateSong } from '../utils/db';
import { SongSection } from '../components/SongSection';
import { Section, Song } from '../types/song';
import TransposeControl from '../components/TransposeControl';
import { useSongs } from '../context/SongContext';
import { detectKey } from '../utils/transpose';

export function SongEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  // Only use the context for the initial load and final save, not for ongoing edits
  const { updateSong: updateContextSong, currentTranspose } = useSongs();

  // State
  const [song, setSong] = useState<Song>({ title: '', artist: '', sections: [] });
  // Add separate state for title and artist to ensure they can be edited independently
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load song if editing existing
  useEffect(() => {
    if (id) {
      // Load directly from the database to avoid context issues
      getSong(id).then(loadedSong => {
        if (loadedSong) {
          setSong(loadedSong);
          // Initialize the separate title and artist state
          setTitle(loadedSong.title || '');
          setArtist(loadedSong.artist || '');
        }
      }).catch(error => {
        console.error('Failed to load song:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load song',
          color: 'red'
        });
      });
    }
  }, [id]);
  
  const handleImport = (sections: Section[], metadata?: { title?: string; artist?: string }) => {
    // Update song sections
    setSong(prev => ({ ...prev, sections }));
    
    console.log('handleImport received metadata:', metadata);
    
    // If metadata is provided from the import (e.g., from .show files), update title and artist
    if (metadata) {
      console.log('Processing metadata in handleImport');
      if (metadata.title) {
        console.log('Setting title to:', metadata.title);
        // Force a direct DOM update to ensure the title is set
        setTimeout(() => {
          setTitle(metadata.title || '');
          // Also try to directly update the input field
          const titleInput = document.querySelector('input[placeholder="Enter song title"]') as HTMLInputElement;
          if (titleInput) {
            titleInput.value = metadata.title || '';
            console.log('Directly updated title input to:', metadata.title);
          }
        }, 100);
      }
      if (metadata.artist) {
        console.log('Setting artist to:', metadata.artist);
        // Force a direct DOM update to ensure the artist is set
        setTimeout(() => {
          setArtist(metadata.artist || '');
          // Also try to directly update the input field
          const artistInput = document.querySelector('input[placeholder="Enter artist name"]') as HTMLInputElement;
          if (artistInput) {
            artistInput.value = metadata.artist || '';
            console.log('Directly updated artist input to:', metadata.artist);
          }
        }, 100);
      }
    }
    
    setImportModalOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create a song object with the current title and artist values
      const updatedSong = {
        ...song,
        title: title,  // Use the separate title state
        artist: artist // Use the separate artist state
      };
      
      // If this is the first save, store the original sections
      if (!updatedSong.originalSections) {
        // Create a deep copy of the current sections to store as original
        const originalSections = JSON.parse(JSON.stringify(updatedSong.sections));
        
        // Store the original key if detected
        const allChords: string[] = [];
        updatedSong.sections.forEach(section => {
          section.chords.forEach(chord => {
            allChords.push(chord.text);
          });
        });
        const originalKey = updatedSong.originalKey || detectKey(allChords);
        
        // Update with original data
        updatedSong.originalSections = originalSections;
        updatedSong.originalKey = originalKey;
      }
      
      // Add the current transpose value
      updatedSong.currentTranspose = currentTranspose || '';
      
      // Make sure originalSections and originalKey are included if they weren't set above
      if (!updatedSong.originalSections) {
        updatedSong.originalSections = JSON.parse(JSON.stringify(updatedSong.sections));
      }
      if (!updatedSong.originalKey) {
        updatedSong.originalKey = detectKey(updatedSong.sections.flatMap(section => section.chords.map(chord => chord.text)));
      }

      if (id) {
        // Update in database
        await updateSong({
          ...updatedSong,
          id,
          title: updatedSong.title,
          artist: updatedSong.artist,
          sections: updatedSong.sections,
          createdAt: updatedSong.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Also update in context
        updateContextSong(id, updatedSong);
      } else {
        const newId = await saveSong({
          title: updatedSong.title,
          artist: updatedSong.artist,
          sections: updatedSong.sections
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter song title"
          size="md"
        />
        <TextInput
          label="Artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Enter artist name"
          size="md"
        />
        {id && <TransposeControl />}
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

      <UnifiedImportModal
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