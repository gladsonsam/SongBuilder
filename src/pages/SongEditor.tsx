import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Title, TextInput, Button, Group, ActionIcon, Text, Paper, Modal, Grid, Menu, Tooltip, Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconUpload, IconDownload, IconMusic, IconPlus, IconArrowUp, IconArrowDown, IconTrash, IconNotes, IconEdit } from '@tabler/icons-react';
import '../components/SectionControls.css';
import { ArtistInput } from '../components/ArtistInput';
import { UnifiedImportModal } from '../components/UnifiedImportModal';
import { ExportModal } from '../components/ExportModal';
import { getSong, saveSong, updateSong } from '../utils/db';
import { SongSection } from '../components/SongSection';
import { Section, Song } from '../types/song';

import { InlineEditor } from '../components/InlineEditor';
import TransposeControl from '../components/TransposeControl';
import { TagInput } from '../components/TagInput';
import { useSongs } from '../context/SongContext';
import { detectKey } from '../utils/transpose';
import { SongNotes } from '../components/SongNotes';
import { TextEditorModal } from '../components/TextEditorModal';

export function SongEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  // Only use the context for the initial load and final save, not for ongoing edits
  const { updateSong: updateContextSong, currentTranspose } = useSongs();

  // State
  const [song, setSong] = useState<Song>({ title: '', artist: '', sections: [], tags: [] });
  // Add separate state for title and artist to ensure they can be edited independently
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contentChanged, setContentChanged] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('sections');
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  // Function to add a new section of the specified type
  const addNewSection = (type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus') => {
    // Create a new empty section
    const newSection: Section = {
      type,
      content: '',
      chords: [],
      number: 1 // Will be automatically updated by updateSectionNumbers
    };
    
    // Add the new section to the song
    const updatedSections = [...song.sections, newSection];
    const numberedSections = updateSectionNumbers(updatedSections);
    
    // Update the song with the new section
    setSong({
      ...song,
      sections: numberedSections
    });
    
    // Immediately open the editor for the new section
    setTimeout(() => {
      setEditingSectionIndex(numberedSections.length - 1);
    }, 100);
  };

  // Load song if editing existing
  useEffect(() => {
    if (id) {
      // Check URL for view mode parameter
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      setIsViewMode(mode === 'view');

      // Load directly from the database to avoid context issues
      getSong(id).then(loadedSong => {
        if (loadedSong) {
          setSong(loadedSong);
          // Initialize the separate title and artist state
          setTitle(loadedSong.title || '');
          setArtist(loadedSong.artist || '');
          setTags(loadedSong.tags || []);
          setNotes(loadedSong.notes || '');
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
  
  // Set up autosave timer (every 2 minutes) and immediate save on navigation
  useEffect(() => {
    // Don't autosave if we're just loading the song initially
    if (!song.id && !title && !artist && song.sections.length === 0) {
      return;
    }
    
    // Set up a timer to save every 2 minutes
    const autoSaveTimer = setInterval(() => {
      console.log('Autosaving (2-minute interval)');
      autoSave();
    }, 2 * 60 * 1000); // 2 minutes in milliseconds
    
    // Set up event listener for page navigation/close
    const handleBeforeUnload = () => {
      console.log('Saving before navigation');
      autoSave();
    };
    
    // Add event listeners for navigation away
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up timer and event listeners when component unmounts
    return () => {
      clearInterval(autoSaveTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save one last time when leaving the editor
      autoSave();
    };
  }, []); // Empty dependency array means this only runs once on mount/unmount
  
  // Set up content change detection for manual saves
  useEffect(() => {
    // Don't autosave if we're just loading the song initially
    if (!song.id && !title && !artist && song.sections.length === 0) {
      return;
    }
    
    // Set a flag that content has changed and needs saving
    setContentChanged(true);
    
  }, [song, title, artist, tags, notes]); // Track when content changes
  
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

  // Update section numbers based on section types
  const updateSectionNumbers = (sections: Section[]) => {
    // Create a counter for each section type
    const typeCounters: Record<string, number> = {};
    
    // Go through each section and update its number
    return sections.map(section => {
      // Initialize counter for this type if it doesn't exist
      if (!typeCounters[section.type]) {
        typeCounters[section.type] = 1;
      }
      
      // Update the section with the current counter value
      const updatedSection = {
        ...section,
        number: typeCounters[section.type]
      };
      
      // Increment the counter for this type
      typeCounters[section.type]++;
      
      return updatedSection;
    });
  };

  // Autosave function
  const autoSave = async () => {
    if (isSaving) return; // Prevent multiple simultaneous saves
    if (!contentChanged) return; // Don't save if nothing has changed
    
    setIsSaving(true);
    try {
      // Update section numbers
      const numberedSections = updateSectionNumbers([...song.sections]);
      
      // Create a song object with the current title and artist values
      const updatedSong = {
        ...song,
        title: title,  // Use the separate title state
        artist: artist, // Use the separate artist state
        tags: tags, // Use the separate tags state
        notes: notes, // Use the separate notes state
        sections: numberedSections // Use the numbered sections
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
        const songToUpdate = {
          ...updatedSong,
          id,
          title: updatedSong.title,
          artist: updatedSong.artist,
          sections: updatedSong.sections,
          tags: updatedSong.tags,
          notes: updatedSong.notes,
          createdAt: updatedSong.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await updateSong(songToUpdate);
        
        // Also update in context
        updateContextSong(id, updatedSong);
      } else {
        const newId = await saveSong({
          title: updatedSong.title,
          artist: updatedSong.artist,
          sections: updatedSong.sections,
          tags: updatedSong.tags,
          notes: updatedSong.notes
        });
        navigate(`/songs/${newId}`);
      }
      // Only show notification on first save
      if (!id) {
        notifications.show({
          title: 'Success',
          message: 'Song created successfully',
          color: 'green'
        });
      }
    } catch (error) {
      console.error('Failed to save song:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save song',
        color: 'red'
      });
    } finally {
      setIsSaving(false);
      setContentChanged(false); // Reset the content changed flag after saving
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <ActionIcon
            variant="subtle"
            onClick={() => {
              // Save before navigating away
              if (contentChanged) {
                autoSave().then(() => {
                  navigate('/songs');
                });
              } else {
                navigate('/songs');
              }
            }}
            title="Back to Songs"
          >
            <IconArrowLeft />
          </ActionIcon>
          <Title order={2}>{id ? 'Edit Song' : 'New Song'}</Title>
        </Group>
        <Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                variant="filled"
                color="blue"
                leftSection={<IconPlus size={16} />}
                disabled={isViewMode}
              >
                Add Section
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Section Types</Menu.Label>
              <Menu.Item onClick={() => addNewSection('verse')}>Verse</Menu.Item>
              <Menu.Item onClick={() => addNewSection('chorus')}>Chorus</Menu.Item>
              <Menu.Item onClick={() => addNewSection('pre-chorus')}>Pre-Chorus</Menu.Item>
              <Menu.Item onClick={() => addNewSection('bridge')}>Bridge</Menu.Item>
              <Menu.Item onClick={() => addNewSection('intro')}>Intro</Menu.Item>
              <Menu.Item onClick={() => addNewSection('outro')}>Outro</Menu.Item>
              <Menu.Item onClick={() => addNewSection('tag')}>Tag</Menu.Item>
              <Menu.Item onClick={() => addNewSection('break')}>Break</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            variant="light"
            leftSection={<IconUpload size={16} />}
            onClick={() => setImportModalOpen(true)}
            disabled={isViewMode}
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
          {/* Autosave indicator */}
          {isSaving && (
            <Text size="sm" c="dimmed">
              Saving...
            </Text>
          )}
        </Group>
      </Group>

      {/* Song metadata card with modern design */}
      <Paper p="md" radius="md" withBorder shadow="sm">
        <Grid gutter="md">
          {/* Title and Artist section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              size="md"
              leftSection={<IconMusic size={18} />}
            />
            <div style={{ marginTop: '8px' }}>
              <ArtistInput
                label="Artist"
                value={artist}
                onChange={setArtist}
                placeholder="Enter artist name"
              />
            </div>
          </Grid.Col>
          
          {/* Transpose and Tags section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Grid>
              <Grid.Col span={12}>
                {id && <TransposeControl />}
              </Grid.Col>
              <Grid.Col span={12}>
                <TagInput
                  label="Tags"
                  value={tags}
                  onChange={setTags}
                  placeholder="Add tags like 'adoration', 'holy'..."
                  suggestions={[
                    'Adoration', 'Holy', 'Praise', 'Worship', 'Prayer',
                    'Communion', 'Offering', 'Healing', 'Salvation', 'Victory',
                    'Christmas', 'Easter', 'Thanksgiving', 'Fast', 'Slow',
                    'Contemporary', 'Traditional', 'Hymn', 'Chorus'
                  ]}
                />
              </Grid.Col>
            </Grid>
          </Grid.Col>
        </Grid>
      </Paper>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Group justify="space-between" align="center">
          <Tabs.List>
            <Tabs.Tab value="sections" leftSection={<IconMusic size={16} />}>Sections</Tabs.Tab>
            <Tabs.Tab value="notes" leftSection={<IconNotes size={16} />}>Notes</Tabs.Tab>
          </Tabs.List>
          <Group>
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => setTextEditorOpen(true)}
            >
              Text Edit
            </Button>
            <Button
              variant="light"
              onClick={() => setIsViewMode(!isViewMode)}
            >
              {isViewMode ? 'Edit Mode' : 'View Mode'}
            </Button>
          </Group>
        </Group>

        <Tabs.Panel value="sections" pt="md">
          <Paper p={0} style={{ backgroundColor: 'var(--mantine-color-dark-6)', border: 'none', boxShadow: 'none' }}>
            <Stack gap="xs">
              {song.sections.map((section, index) => (
                <div
                  key={index}
                  style={{ position: 'relative' }}
                  className="section-container"
                >
                  <div
                    onClick={() => !isViewMode && setEditingSectionIndex(index)}
                    style={{ cursor: isViewMode ? 'default' : 'pointer' }}
                  >
                    <SongSection
                      type={section.type}
                      content={section.content}
                      number={section.number}
                      chords={section.chords}
                      onChordMove={(chordId, lineIndex, newPosition) => {
                        // Create a copy of the sections array
                        const updatedSections = [...song.sections];
                        const sectionToUpdate = {...updatedSections[index]};
                        
                        // Find the chord to move
                        const chordIndex = sectionToUpdate.chords.findIndex(c => c.id === chordId);
                        if (chordIndex === -1) return;
                        
                        // Update the chord position and line
                        const updatedChords = [...sectionToUpdate.chords];
                        updatedChords[chordIndex] = {
                          ...updatedChords[chordIndex],
                          position: newPosition,
                          line: lineIndex
                        };
                        
                        // Update the section with the modified chords
                        sectionToUpdate.chords = updatedChords;
                        updatedSections[index] = sectionToUpdate;
                        
                        // Update the song state
                        setSong({...song, sections: updatedSections});
                        
                        // Mark content as changed to trigger autosave
                        setContentChanged(true);
                      }}
                    />
                  </div>
                  
                  {/* Section controls - only show in edit mode */}
                  {!isViewMode && <div className="section-controls">
                    <Tooltip label="Move Up" withArrow position="left">
                      <ActionIcon 
                        size="md" 
                        variant="light" 
                        color="blue"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index > 0) {
                            const updatedSections = [...song.sections];
                            [updatedSections[index], updatedSections[index - 1]] = 
                              [updatedSections[index - 1], updatedSections[index]];
                            const numberedSections = updateSectionNumbers(updatedSections);
                            setSong({...song, sections: numberedSections});
                          }
                        }}
                      >
                        <IconArrowUp size={18} />
                      </ActionIcon>
                    </Tooltip>
                    
                    <Tooltip label="Move Down" withArrow position="left">
                      <ActionIcon 
                        size="md" 
                        variant="light" 
                        color="blue"
                        disabled={index === song.sections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index < song.sections.length - 1) {
                            const updatedSections = [...song.sections];
                            [updatedSections[index], updatedSections[index + 1]] = 
                              [updatedSections[index + 1], updatedSections[index]];
                            const numberedSections = updateSectionNumbers(updatedSections);
                            setSong({...song, sections: numberedSections});
                          }
                        }}
                      >
                        <IconArrowDown size={18} />
                      </ActionIcon>
                    </Tooltip>
                    
                    <Tooltip label="Delete Section" withArrow position="left">
                      <ActionIcon 
                        size="md" 
                        variant="light" 
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedSections = [...song.sections];
                          updatedSections.splice(index, 1);
                          const numberedSections = updateSectionNumbers(updatedSections);
                          setSong({...song, sections: numberedSections});
                          notifications.show({
                            title: 'Section Deleted',
                            message: `${section.type.charAt(0).toUpperCase() + section.type.slice(1)} ${section.number} was removed`,
                            color: 'red'
                          });
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </div>}
                </div>
              ))}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="notes" pt="md">
          <SongNotes 
            notes={notes} 
            onChange={(newNotes) => {
              setNotes(newNotes);
              // Force an immediate save when notes change
              if (notes !== newNotes) {
                setTimeout(() => autoSave(), 100);
              }
            }} 
          />
        </Tabs.Panel>
      </Tabs>

      {/* Section editing modal */}
      {editingSectionIndex !== null && (
        <Modal
          opened={editingSectionIndex !== null}
          onClose={() => setEditingSectionIndex(null)}
          title="Edit Section"
          size="lg"
        >
          <InlineEditor
            section={song.sections[editingSectionIndex]}
            onSave={(updatedSection, additionalSections) => {
              let updatedSections = [...song.sections];
              
              // Check if section is empty and should be deleted
              if (updatedSection.content.trim() === '') {
                // Remove the section if it's empty
                updatedSections.splice(editingSectionIndex, 1);
                notifications.show({
                  title: 'Section Deleted',
                  message: 'Empty section was automatically removed',
                  color: 'blue'
                });
              } else {
                // Update the current section
                updatedSections[editingSectionIndex] = updatedSection;
                
                // If there are additional sections from splitting, add them after the current section
                if (additionalSections && additionalSections.length > 0) {
                  updatedSections.splice(editingSectionIndex + 1, 0, ...additionalSections);
                }
              }
              
              // Update section numbers automatically
              const numberedSections = updateSectionNumbers(updatedSections);
              
              setSong(prev => ({ ...prev, sections: numberedSections }));
              setEditingSectionIndex(null);
            }}
            onCancel={() => setEditingSectionIndex(null)}
          />
        </Modal>
      )}

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

      <TextEditorModal
        opened={textEditorOpen}
        onClose={() => setTextEditorOpen(false)}
        sections={song.sections}
        onSave={(newSections) => {
          setSong({ ...song, sections: updateSectionNumbers(newSections) });
          setTextEditorOpen(false);
        }}
      />
    </Stack>
  );
}