import * as React from 'react';
import { Container, Title, Text, Button, Stack, Group, Paper, Skeleton } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { IconPlus, IconUpload, IconClock } from '@tabler/icons-react';
import { ImportSongModal } from '../components/ImportSongModal';
import { getAllSongs, saveSong } from '../utils/db';
import type { Song, Section } from '../types/song';

export function HomePage() {
  const navigate = useNavigate();
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [recentSongs, setRecentSongs] = React.useState<Song[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load recent songs on mount
  React.useEffect(() => {
    loadRecentSongs();
  }, []);

  const loadRecentSongs = async () => {
    try {
      setIsLoading(true);
      const songs = await getAllSongs();
      // Sort by updatedAt and take the 5 most recent
      const recent = songs
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);
      setRecentSongs(recent);
    } catch (error) {
      console.error('Failed to load recent songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (sections: Section[]) => {
    try {
      // Create a new song with the imported sections
      const newId = await saveSong({
        title: 'New Song',
        artist: '',
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

            {isLoading ? (
              <Stack gap="sm">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height={60} radius="sm" />
                ))}
              </Stack>
            ) : recentSongs.length > 0 ? (
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
                        {song.updatedAt ? new Date(song.updatedAt).toLocaleDateString() : 'Never'}
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

      <ImportSongModal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />
    </Container>
  );
}