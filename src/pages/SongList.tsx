import * as React from 'react';
import '../components/TagInput.css';
import { ColoredTag } from '../components/ColoredTag';
import { Container, Title, Text, Button, Stack, Group, Paper, TextInput, ActionIcon, Skeleton, Checkbox, Menu, MultiSelect } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Link, useNavigate } from 'react-router-dom';
import { IconPlus, IconSearch, IconTrash, IconEdit, IconDots, IconDownload, IconSortAscending, IconSortDescending, IconTags, IconDatabase, IconUpload } from '@tabler/icons-react';
import { DatabaseTools } from '../components/DatabaseTools';
import { UnifiedImportModal } from '../components/UnifiedImportModal';
import { BulkExportModal } from '../components/BulkExportModal';
import { getAllSongs, deleteSong, saveSong } from '../utils/appwriteDb';
import { getTagColor } from '../utils/tagColors';
import { toTitleCase } from '../utils/formatters';
import type { Song } from '../utils/appwriteDb';

type SortField = 'title' | 'artist' | 'date';
type SortDirection = 'asc' | 'desc';

export function SongList() {
  const navigate = useNavigate();
  const [songs, setSongs] = React.useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedSongs, setSelectedSongs] = React.useState<Set<string>>(new Set());
  const [sortField, setSortField] = React.useState<SortField>('date');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [availableTags, setAvailableTags] = React.useState<{value: string; label: string}[]>([]);
  const [dbToolsOpen, setDbToolsOpen] = React.useState(false);
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [bulkExportOpen, setBulkExportOpen] = React.useState(false);

  // Responsive: is mobile
  const isMobile = useMediaQuery('(max-width: 600px)');

  // Load songs on mount and set up keyboard listener
  React.useEffect(() => {
    loadSongs();
    
    // Set up global keyboard listener to focus search on keypress
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not already in an input field
      if (
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA' &&
        /^[a-zA-Z0-9]$/.test(e.key) // Only trigger on alphanumeric keys
      ) {
        const searchInput = document.getElementById('songs-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          // Don't lose the first keystroke
          if (!e.ctrlKey && !e.altKey && !e.metaKey) {
            setSearchQuery(e.key);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const allSongs = await getAllSongs();
      setSongs(sortSongs(allSongs, sortField, sortDirection));
      
      // Extract all unique tags from songs
      const tags = new Set<string>();
      allSongs.forEach(song => {
        if (song.tags && Array.isArray(song.tags) && song.tags.length > 0) {
          song.tags.forEach(tag => tags.add(tag));
        }
      });
      // Make sure we always have an array of objects with value and label properties
      const tagOptions = Array.from(tags).sort().map(tag => ({ value: tag, label: tag }));
      setAvailableTags(tagOptions.length > 0 ? tagOptions : []);
    } catch (error) {
      console.error('Failed to load songs:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load songs',
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sort songs based on selected field and direction
  const sortSongs = (songsToSort: Song[], field: SortField, direction: SortDirection): Song[] => {
    const songsCopy = [...songsToSort];
    
    const sortMultiplier = direction === 'asc' ? 1 : -1;
    
    switch (field) {
      case 'title':
        return songsCopy.sort((a, b) => sortMultiplier * a.title.localeCompare(b.title));
      case 'artist':
        return songsCopy.sort((a, b) => sortMultiplier * a.artist.localeCompare(b.artist));
      case 'date':
        return songsCopy.sort((a, b) => sortMultiplier * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()));
      default:
        return songsCopy;
    }
  };
  
  // Handle column header click for sorting
  const handleSortClick = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with appropriate default direction
      setSortField(field);
      // Default to descending for date (newest first), ascending for text fields
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };
  
  // Re-sort songs when sort field or direction changes
  React.useEffect(() => {
    if (songs.length > 0) {
      setSongs(sortSongs([...songs], sortField, sortDirection));
    }
  }, [sortField, sortDirection]);

  const handleDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteSong(id);
      }
      await loadSongs();
      setSelectedSongs(new Set());
      notifications.show({
        title: 'Success',
        message: ids.length > 1 ? 'Songs deleted successfully' : 'Song deleted successfully',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete songs',
        color: 'red'
      });
    }
  };

  // Bulk export modal open/close and selected songs logic handled below

  const toggleSelectAll = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map(song => song.id)));
    }
  };

  // Parse hashtags from search query
  const parseSearchQuery = (query: string) => {
    const hashtagRegex = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;
    let plainQuery = query;
    
    // Extract hashtags from the query
    while ((match = hashtagRegex.exec(query)) !== null) {
      hashtags.push(match[1].toLowerCase());
      // Remove the hashtag from the plain query
      plainQuery = plainQuery.replace(match[0], '');
    }
    
    return {
      hashtags,
      plainQuery: plainQuery.trim()
    };
  };

  // Handle search query changes and extract hashtags
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Extract hashtags and add them to selected tags
    const { hashtags } = parseSearchQuery(value);
    if (hashtags.length > 0) {
      // Find matching tags (case insensitive)
      const matchingTags = availableTags
        .map(tag => tag.value)
        .filter(tag => 
          hashtags.some(hashtag => 
            tag.toLowerCase().includes(hashtag)
          )
        );
      
      // Add matching tags to selected tags if not already there
      const newSelectedTags = [...selectedTags];
      matchingTags.forEach(tag => {
        if (!selectedTags.includes(tag)) {
          newSelectedTags.push(tag);
        }
      });
      
      if (newSelectedTags.length !== selectedTags.length) {
        setSelectedTags(newSelectedTags);
      }
    }
  };

  // Filter and sort songs based on search query, including lyrics and tags
  const filteredSongs = songs.filter(song => {
    // First filter by tags if any are selected
    if (selectedTags.length > 0) {
      if (!song.tags || song.tags.length === 0) return false;
      
      // Check if song has at least one of the selected tags
      const hasSelectedTag = selectedTags.some(tag => 
        song.tags?.includes(tag)
      );
      
      if (!hasSelectedTag) return false;
    }
    
    // Then filter by search query if present
    if (searchQuery) {
      const { plainQuery, hashtags } = parseSearchQuery(searchQuery);
      
      // If we have hashtags but no plain query, we've already filtered by tags above
      if (hashtags.length > 0 && !plainQuery) {
        return true;
      }
      
      // If we have a plain query, search by it
      if (plainQuery) {
        const query = plainQuery.toLowerCase();
        
        // Check title, artist, tags, and lyrics
        return (
          song.title.toLowerCase().includes(query) || 
          song.artist.toLowerCase().includes(query) ||
          (song.tags && song.tags.some(tag => tag.toLowerCase().includes(query))) ||
          song.sections.some(section => section.content.toLowerCase().includes(query))
        );
      }
    }
    
    return true; // If no search query, include all songs that passed tag filter
  }).sort((a, b) => {
    // If there's a search query, prioritize songs where the title matches
    if (searchQuery) {
      const { plainQuery } = parseSearchQuery(searchQuery);
      if (plainQuery) {
        const query = plainQuery.toLowerCase();
        
        // Check if title contains the query
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        
        // If only one title contains the query, prioritize it
        const aContainsQuery = titleA.includes(query);
        const bContainsQuery = titleB.includes(query);
        
        if (aContainsQuery && !bContainsQuery) return -1;
        if (!aContainsQuery && bContainsQuery) return 1;
        
        // If both titles contain the query, prioritize the one that starts with it
        const aStartsWithQuery = titleA.startsWith(query);
        const bStartsWithQuery = titleB.startsWith(query);
        
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        
        // If both titles start with the query, prioritize exact matches
        const aExactMatch = titleA === query;
        const bExactMatch = titleB === query;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
      }
    }
    
    // Fall back to the current sort order if no search query or both match equally
    return 0;
  });

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>Songs</Title>
          <Group>
            {selectedSongs.size > 0 && (
              <Group>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => handleDelete(Array.from(selectedSongs))}
                >
                  Delete Selected ({selectedSongs.size})
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => setBulkExportOpen(true)}
                >
                  Export Selected
                </Button>
              </Group>
            )}
            <Button
              component={Link}
              to="/songs/new"
              leftSection={<IconPlus size={16} />}
            >
              New Song
            </Button>
            <Button
              variant="filled"
              color="blue"
              leftSection={<IconUpload size={16} />}
              onClick={() => setImportModalOpen(true)}
            >
              Import Song
            </Button>
            <Button
              variant="light"
              leftSection={<IconDatabase size={16} />}
              onClick={() => setDbToolsOpen(true)}
            >
              Database Tools
            </Button>
          </Group>
        </Group>

        {isMobile ? (
          <Stack gap="xs">
            <TextInput
              placeholder="Search titles, artists, or lyrics..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: '100%' }}
              id="songs-search"
              size="md"
            />
            <MultiSelect
              data={availableTags}
              value={selectedTags}
              onChange={setSelectedTags}
              placeholder="Filter by tags"
              searchable
              clearable
              leftSection={<IconTags size={16} />}
              renderOption={({ option }) => (
                <Group gap="xs">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: `var(--mantine-color-${getTagColor(option.value)}-filled)`
                    }}
                  />
                  <span>{option.label}</span>
                </Group>
              )}
              styles={{
                pill: {
                  display: 'none'
                },
                input: {
                  width: '100%'
                }
              }}
              size="md"
            />
            <Group gap="xs" wrap="wrap">
              {selectedTags.map((tag) => (
                <ColoredTag
                  key={tag}
                  tag={tag}
                  size="sm"
                  variant="filled"
                  onClick={() => {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  }}
                  showColorSwatch={false}
                />
              ))}
            </Group>
            {filteredSongs.length > 0 && (
              <Checkbox
                label="Select All"
                checked={selectedSongs.size === filteredSongs.length}
                indeterminate={selectedSongs.size > 0 && selectedSongs.size < filteredSongs.length}
                onChange={toggleSelectAll}
                size="md"
              />
            )}
          </Stack>
        ) : (
          <Group align="flex-end">
            <TextInput
              placeholder="Search titles, artists, or lyrics..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ flex: 1 }}
              autoFocus
              id="songs-search"
            />
            <MultiSelect
              data={availableTags}
              value={selectedTags}
              onChange={setSelectedTags}
              placeholder="Filter by tags"
              searchable
              clearable
              leftSection={<IconTags size={16} />}
              renderOption={({ option }) => (
                <Group gap="xs">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: `var(--mantine-color-${getTagColor(option.value)}-filled)`
                    }}
                  />
                  <span>{option.label}</span>
                </Group>
              )}
              styles={{
                pill: {
                  display: 'none'
                }
              }}
            />
            {/* Display selected tags with colors */}
            <Group gap="xs" mt="xs">
              {selectedTags.map((tag) => (
                <ColoredTag
                  key={tag}
                  tag={tag}
                  size="sm"
                  variant="filled"
                  onClick={() => {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  }}
                  showColorSwatch={false}
                />
              ))}
            </Group>
            {filteredSongs.length > 0 && (
              <Checkbox
                label="Select All"
                checked={selectedSongs.size === filteredSongs.length}
                indeterminate={selectedSongs.size > 0 && selectedSongs.size < filteredSongs.length}
                onChange={toggleSelectAll}
              />
            )}
          </Group>
        )}



        {/* Column Headers with Sort Indicators */}
        {filteredSongs.length > 0 && (
          <Group style={{ padding: '0 12px' }}>
            <Button 
              variant="subtle" 
              onClick={() => handleSortClick('title')}
              rightSection={sortField === 'title' ? 
                (sortDirection === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />) : null}
              style={{ flex: 1 }}
            >
              Title
            </Button>
            <Button 
              variant="subtle" 
              onClick={() => handleSortClick('artist')}
              rightSection={sortField === 'artist' ? 
                (sortDirection === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />) : null}
              style={{ flex: 1 }}
            >
              Artist
            </Button>
            <Button 
              variant="subtle" 
              onClick={() => handleSortClick('date')}
              rightSection={sortField === 'date' ? 
                (sortDirection === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />) : null}
              style={{ width: '150px' }}
            >
              Last Modified
            </Button>
            <div style={{ width: '100px' }}></div> {/* Space for actions */}
          </Group>
        )}

        {isLoading ? (
          <Stack gap="sm">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={80} radius="sm" />
            ))}
          </Stack>
        ) : filteredSongs.length > 0 ? (
          <Stack gap="md">
            {filteredSongs.map(song => (
              <Paper
                p="md"
                withBorder
                shadow="sm"
                key={song.id}
                onClick={(e) => {
                  // Only navigate if not clicking a button, checkbox, or menu
                  if (
                    !(e.target as HTMLElement).closest('button') &&
                    !(e.target as HTMLElement).closest('input[type="checkbox"]') &&
                    !(e.target as HTMLElement).closest('[role="menu"]')
                  ) {
                    navigate(`/songs/${song.id}?mode=view`);
                  }
                }}
                style={{ cursor: 'pointer' }}
                >
                <Group justify="space-between" align="center">
                  <Group>
                    <Checkbox
                      checked={selectedSongs.has(song.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedSongs);
                        if (e.currentTarget.checked) {
                          newSelected.add(song.id);
                        } else {
                          newSelected.delete(song.id);
                        }
                        setSelectedSongs(newSelected);
                      }}
                    />
                    <Stack gap={4}>
                      <Text fw={500} size="lg">{song.title}</Text>
                      <Text size="sm" c="dimmed">{song.artist}</Text>
                      <Text size="xs" c="dimmed">
                        Last updated: {new Date(song.updatedAt).toLocaleString()}
                      </Text>
                      {song.tags && song.tags.length > 0 && (
                        <Group gap="xs" mt="xs">
                          {song.tags.map((tag, index) => (
                            <ColoredTag
                              key={index}
                              tag={tag}
                              size="sm"
                              variant="light"
                              onClick={() => {
                                if (!selectedTags.includes(tag)) {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                              onColorChange={() => {
                                // Force re-render
                                setSongs([...songs]);
                              }}
                            />
                          ))}
                        </Group>
                      )}
                    </Stack>
                  </Group>
                  <Group>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/songs/${song.id}?mode=edit`);
                      }}
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                    >
                      Edit
                    </Button>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="light">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => handleDelete([song.id])}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper withBorder p="xl">
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed" ta="center">
                {searchQuery ? 'No songs match your search' : 'No songs yet'}
              </Text>
              {!searchQuery && (
                <Button
                  component={Link}
                  to="/songs/new"
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                >
                  Create Your First Song
                </Button>
              )}
            </Stack>
          </Paper>
        )}
        {/* Bulk Export Modal */}
        <BulkExportModal
          opened={bulkExportOpen}
          onClose={() => setBulkExportOpen(false)}
          songs={songs.filter(song => selectedSongs.has(song.id))}
        />

        {/* Database Tools Modal */}
        <DatabaseTools
          opened={dbToolsOpen}
          onClose={() => setDbToolsOpen(false)}
          onComplete={loadSongs}
        />
        
        {/* Import Song Modal */}
        <UnifiedImportModal
          opened={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={async (sections, metadata) => {
            try {
              // Create a new song from the imported sections
              const newSong = {
                title: toTitleCase(metadata?.title || 'Imported Song'),
                artist: metadata?.artist || 'Unknown Artist',
                sections: sections,
                tags: []
              };
              
              // Add the song to the database
              const songId = await saveSong(newSong);
              
              // Show success notification
              notifications.show({
                title: 'Success',
                message: `Imported song: ${newSong.title}`,
                color: 'green'
              });
              
              // Navigate to the song editor for the newly imported song
              navigate(`/songs/${songId}`);
            } catch (error) {
              console.error('Failed to import song:', error);
              notifications.show({
                title: 'Error',
                message: 'Failed to import song',
                color: 'red'
              });
            }
          }}
          onBatchComplete={loadSongs}
        />
      </Stack>
    </Container>
  );
}