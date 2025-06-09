import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stack, Title, TextInput, Button, Group, ActionIcon, Text, Paper, Modal, Grid, Menu, Tooltip, Tabs, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconUpload, IconDownload, IconMusic, IconPlus, IconArrowUp, IconArrowDown, IconTrash, IconNotes, IconEdit } from '@tabler/icons-react';
import '../components/SectionControls.css';
import { ArtistInput } from '../components/ArtistInput';
import { useStorage } from '../context/StorageContext';
import { SongSection } from '../components/SongSection';
import { Section, Song } from '../types/song';

import { InlineEditor } from '../components/InlineEditor';
import TransposeControl from '../components/TransposeControl';
import { TagInput } from '../components/TagInput';
// Removed SongContext import - using Appwrite directly
import { detectKey } from '../utils/transpose';
import { SongNotes } from '../components/SongNotes';
import { useValidation, ValidationError, sanitizeTextContent } from '../utils/validation';

// Lazy load modal components
const UnifiedImportModal = lazy(() => import('../components/UnifiedImportModal').then(m => ({ default: m.UnifiedImportModal })));
const ExportModal = lazy(() => import('../components/ExportModal').then(m => ({ default: m.ExportModal })));
const TextEditorModal = lazy(() => import('../components/TextEditorModal').then(m => ({ default: m.TextEditorModal })));

// Modal loader component
const ModalLoader = () => (
  <Center p="xl">
    <Loader size="sm" />
  </Center>
);

export function SongEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getSong, saveSong, updateSong } = useStorage();
  const { validateSongMetadata } = useValidation();

  // State
  const [song, setSong] = useState<Song>({ 
    id: '', 
    title: '', 
    artist: '', 
    sections: [], 
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
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

  // No need to reset transpose - it's now always attached to the song

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
          // Only update local state if loading a new song (id change)
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
    } else {
      // New song: clear all fields
      setSong({ 
        id: '', 
        title: '', 
        artist: '', 
        sections: [], 
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setTitle('');
      setArtist('');
      setTags([]);
      setNotes('');
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
  }, [song.sections, title, artist, tags, notes]); // Only trigger on section or local state changes
  
  const handleImport = (sections: Section[], metadata?: { title?: string; artist?: string }) => {
    // Update song sections
    setSong(prev => ({ ...prev, sections }));
    // If metadata is provided from the import (e.g., from .show files), update title and artist
    if (metadata) {
      if (metadata.title) {
        setTitle(metadata.title || '');
      }
      if (metadata.artist) {
        setArtist(metadata.artist || '');
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
      let updatedSong = {
        ...song,
        title: title,  // Use the separate title state
        artist: artist, // Use the separate artist state
        tags: tags, // Use the separate tags state
        notes: notes, // Use the separate notes state
        sections: numberedSections // Use the numbered sections
      };

      // Validate metadata before saving
      try {
        validateSongMetadata({
          title: updatedSong.title,
          artist: updatedSong.artist,
          tags: updatedSong.tags
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          console.error('Validation failed during autosave:', error.details);
          // Don't block autosave for validation errors, just log them
          // The user will see the validation errors through the input handlers
        }
      }

      // --- Transpose chords to match transposedKey if set ---
      if (updatedSong.transposedKey && updatedSong.originalKey && updatedSong.sections) {
        const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const fromIndex = NOTES.indexOf(updatedSong.originalKey);
        const toIndex = NOTES.indexOf(updatedSong.transposedKey);
        let semitones = 0;
        if (fromIndex !== -1 && toIndex !== -1) {
          semitones = (toIndex - fromIndex + 12) % 12;
        }
        function transposeChord(chord: string, semitones: number): string {
          const FLAT_TO_SHARP: Record<string, string> = {
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
          };
          function normalizeChord(chord: string): string {
            for (const [flat, sharp] of Object.entries(FLAT_TO_SHARP)) {
              if (chord.startsWith(flat)) {
                return chord.replace(flat, sharp);
              }
            }
            return chord;
          }
          function extractRoot(chord: string): string {
            if (chord.length > 1 && chord[1] === '#') return chord.substring(0, 2);
            return chord[0];
          }
          function extractSuffix(chord: string): string {
            if (chord.length > 1 && chord[1] === '#') return chord.substring(2);
            return chord.substring(1);
          }
          const normalizedChord = normalizeChord(chord);
          if (normalizedChord.includes('/')) {
            const [mainChord, bassNote] = normalizedChord.split('/');
            const transposedMain = transposeChord(mainChord, semitones);
            const transposedBass = transposeChord(bassNote, semitones);
            return `${transposedMain}/${transposedBass}`;
          }
          const rootNote = extractRoot(normalizedChord);
          const suffix = extractSuffix(normalizedChord);
          const rootIndex = NOTES.indexOf(rootNote);
          if (rootIndex === -1) return chord;
          const transposedIndex = (rootIndex + semitones + 12) % 12;
          return NOTES[transposedIndex] + suffix;
        }
        // Transpose all chords in all sections
        updatedSong.sections = updatedSong.sections.map(section => ({
          ...section,
          chords: section.chords.map(chordObj => ({
            ...chordObj,
            text: transposeChord(chordObj.text, semitones),
          }))
        }));
      }
      // --- END transpose logic ---
      
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
      
      // No need to track currentTranspose separately anymore - just use transposedKey
      
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

  // ESC key shortcut: close modals or save & navigate back
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (textEditorOpen) {
          setTextEditorOpen(false);
        } else if (importModalOpen) {
          setImportModalOpen(false);
        } else if (exportModalOpen) {
          setExportModalOpen(false);
        } else {
          if (contentChanged) {
            autoSave().then(() => navigate('/songs'));
          } else {
            navigate('/songs');
          }
        }
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [textEditorOpen, importModalOpen, exportModalOpen, contentChanged, navigate]);

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
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Title"
              value={title}
              onChange={(e) => {
                const sanitizedValue = sanitizeTextContent(e.target.value);
                setTitle(sanitizedValue);
              }}
              placeholder="Enter song title"
              size="md"
              leftSection={<IconMusic size={18} />}
              readOnly={isViewMode}
              error={title.length > 200 ? 'Title too long (max 200 characters)' : undefined}
            />
            <div style={{ marginTop: '8px' }}>
              <ArtistInput
                label="Artist"
                value={artist}
                onChange={useCallback((value: string) => {
                  const sanitizedValue = sanitizeTextContent(value);
                  if (sanitizedValue.length <= 100) {
                    setArtist(sanitizedValue);
                  } else {
                    notifications.show({
                      title: 'Validation Error',
                      message: 'Artist name too long (max 100 characters)',
                      color: 'red'
                    });
                  }
                }, [notifications])}
                placeholder="Enter artist name"
                readOnly={isViewMode}
              />
            </div>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Grid>
              <Grid.Col span={12}>
                {id && (
                  <TransposeControl
                    transposedKey={song.transposedKey || ''}
                    originalKey={song.originalKey}
                    onChange={(val: string) => {
                      // Always update the song's transposedKey with the new value
                      setSong(prev => {
                        const updated = { ...prev, transposedKey: val };
                        return updated;
                      });
                      setContentChanged(true);
                    }}
                    isViewMode={isViewMode}
                  />
                )}
              </Grid.Col>
              <Grid.Col span={12}>
                <TagInput
                  label="Tags"
                  value={tags}
                  onChange={(newTags: string[]) => {
                    if (newTags.length <= 20) {
                      const sanitizedTags = newTags.map(tag => sanitizeTextContent(tag));
                      const validTags = sanitizedTags.filter(tag => tag.length <= 50);
                      if (validTags.length !== sanitizedTags.length) {
                        notifications.show({
                          title: 'Validation Warning',
                          message: 'Some tags were too long and were removed',
                          color: 'yellow'
                        });
                      }
                      setTags(validTags);
                    } else {
                      notifications.show({
                        title: 'Validation Error',
                        message: 'Too many tags (max 20)',
                        color: 'red'
                      });
                    }
                  }}
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
              disabled={isViewMode}
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
                    <SongSection readOnly={isViewMode}
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
            isViewMode={isViewMode}
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

      {importModalOpen && (
        <Suspense fallback={<ModalLoader />}>
          <UnifiedImportModal
            opened={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            onImport={handleImport}
          />
        </Suspense>
      )}

      {exportModalOpen && (
        <Suspense fallback={<ModalLoader />}>
          <ExportModal
            opened={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            sections={song.sections}
          />
        </Suspense>
      )}

      {textEditorOpen && (
        <Suspense fallback={<ModalLoader />}>
          <TextEditorModal
            opened={textEditorOpen}
            onClose={() => setTextEditorOpen(false)}
            sections={song.sections}
            onSave={(newSections) => {
              setSong({ ...song, sections: updateSectionNumbers(newSections) });
              setTextEditorOpen(false);
            }}
          />
        </Suspense>
      )}
    </Stack>
  );
}