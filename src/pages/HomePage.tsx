import * as React from 'react';
import { Container, Title, Text, Button, Stack, Group, Paper, Skeleton, TextInput } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { IconPlus, IconUpload, IconClock, IconSearch } from '@tabler/icons-react';
import { UnifiedImportModal } from '../components/UnifiedImportModal';
import { toTitleCase } from '../utils/formatters';
import type { Section } from '../types/song';
import { useStorage } from '../context/StorageContext';

export function HomePage() {
  const navigate = useNavigate();
  const { songs, isLoading, saveSong } = useStorage();
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Set up keyboard listener for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not already in an input field
      if (
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA' &&
        /^[a-zA-Z0-9]$/.test(e.key) // Only trigger on alphanumeric keys
      ) {
        const searchInput = document.getElementById('recent-songs-search') as HTMLInputElement;
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

  // Get recent songs from the storage context
  const recentSongs = React.useMemo(() => {
    return songs
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 5);
  }, [songs]);

  const handleImport = async (sections: Section[], metadata?: { title?: string; artist?: string }) => {
    try {
      console.log('HomePage handleImport received metadata:', metadata);
      
      // Create a new song with the imported sections and metadata if available
      const newId = await saveSong({
        title: toTitleCase(metadata?.title || 'New Song'),
        artist: metadata?.artist || '',
        sections
      });
      
      // Navigate to the song editor
      navigate(`/songs/${newId}`);
    } catch (error) {
      console.error('Failed to create song:', error);
    }
  };

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>SongBuilder</Title>
          <Group>
            <Button 
              variant="light" 
              leftSection={<IconUpload size={16} />}
              onClick={() => setImportModalOpen(true)}
            >
              Import Song
            </Button>
            <Button
              component={Link}
              to="/songs/new"
              leftSection={<IconPlus size={16} />}
            >
              New Song
            </Button>
          </Group>
        </Group>

        <Paper withBorder p="xl">
          <Stack align="center" gap="lg">
            <Title order={2}>Welcome to SongBuilder</Title>
            <Text size="lg" c="dimmed" ta="center" maw={600}>
              Create and manage your songs with ease. Import from various formats or start from scratch.
            </Text>
            <Group>
              <Button
                size="lg"
                leftSection={<IconUpload size={20} />}
                onClick={() => setImportModalOpen(true)}
              >
                Import Song
              </Button>
              <Button
                component={Link}
                to="/songs"
                size="lg"
                variant="light"
              >
                View All Songs
              </Button>
            </Group>
            

          </Stack>
        </Paper>

        {/* Recent Songs Section */}
        <Paper withBorder p="xl">
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <IconClock size={20} style={{ color: 'var(--mantine-color-blue-filled)' }} />
                <Title order={3}>Recent Songs</Title>
              </Group>
              <Button
                component={Link}
                to="/songs"
                variant="light"
                size="xs"
              >
                View All
              </Button>
            </Group>
            
            <TextInput
              placeholder="Search titles, artists, or lyrics..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginTop: '8px' }}
              autoFocus
              id="recent-songs-search"
            />

            {isLoading ? (
              <Stack gap="sm">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={60} radius="sm" />
                ))}
              </Stack>
            ) : searchQuery ? (
              // When searching, show all matching songs
              <Stack gap="sm">
                {songs
                  .filter(song => {
                    const query = searchQuery.toLowerCase();
                    
                    // Check title and artist
                    if (
                      song.title.toLowerCase().includes(query) || 
                      song.artist.toLowerCase().includes(query)
                    ) {
                      return true;
                    }
                    
                    // Check lyrics in all sections
                    return song.sections.some(section => 
                      section.content.toLowerCase().includes(query)
                    );
                  })
                  .map(song => (
                  <Paper
                    key={song.id}
                    withBorder
                    p="md"
                    component={Link}
                    to={`/songs/${song.id}`}
                    style={{ 
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.2s ease',
                      ':hover': {
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text fw={500} size="lg">{song.title}</Text>
                        <Text size="sm" c="dimmed">{song.artist}</Text>
                      </Stack>
                      <Text size="xs" c="dimmed">
                        {song.updatedAt ? new Date(song.updatedAt).toLocaleString() : 'Never'}
                      </Text>
                    </Group>
                  </Paper>
                ))}
                {songs.filter(song => {
                  const query = searchQuery.toLowerCase();
                  
                  // Check title and artist
                  if (
                    song.title.toLowerCase().includes(query) || 
                    song.artist.toLowerCase().includes(query)
                  ) {
                    return true;
                  }
                  
                  // Check lyrics in all sections
                  return song.sections.some(section => 
                    section.content.toLowerCase().includes(query)
                  );
                }).length === 0 && (
                  <Text c="dimmed" ta="center" py="xl">
                    No songs found matching '{searchQuery}'.
                  </Text>
                )}
              </Stack>
            ) : recentSongs.length > 0 ? (
              // When not searching, show only recent songs
              <Stack gap="sm">
                {recentSongs.map(song => (
                  <Paper
                    key={song.id}
                    withBorder
                    p="md"
                    component={Link}
                    to={`/songs/${song.id}`}
                    style={{ 
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.2s ease',
                      ':hover': {
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text fw={500} size="lg">{song.title}</Text>
                        <Text size="sm" c="dimmed">{song.artist}</Text>
                      </Stack>
                      <Text size="xs" c="dimmed">
                        {song.updatedAt ? new Date(song.updatedAt).toLocaleString() : 'Never'}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No songs yet. Create a new song or import one to get started.
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>

      <UnifiedImportModal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        onBatchComplete={() => {}}
      />
    </Container>
  );
}