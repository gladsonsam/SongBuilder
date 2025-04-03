import * as React from 'react';
import { Container, Title, Text, Button, Stack, Group, Paper, TextInput, ActionIcon, Skeleton, Checkbox, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import { IconPlus, IconSearch, IconTrash, IconEdit, IconDots, IconDownload } from '@tabler/icons-react';
import { getAllSongs, deleteSong, exportDB } from '../utils/db';
import type { Song } from '../utils/db';

export function SongList() {
  const [songs, setSongs] = React.useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedSongs, setSelectedSongs] = React.useState<Set<string>>(new Set());

  // Load songs on mount
  React.useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const allSongs = await getAllSongs();
      // Sort by most recently updated
      const sortedSongs = allSongs.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setSongs(sortedSongs);
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

  const handleExportSelected = async () => {
    try {
      const selectedSongsList = songs.filter(song => selectedSongs.has(song.id));
      const jsonStr = JSON.stringify(selectedSongsList, null, 2);
      
      // Create and trigger download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected_songs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.show({
        title: 'Success',
        message: 'Songs exported successfully',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to export songs',
        color: 'red'
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map(song => song.id)));
    }
  };

  // Filter songs based on search query
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  onClick={handleExportSelected}
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
          </Group>
        </Group>

        <Group align="flex-end">
          <TextInput
            placeholder="Search songs..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          {filteredSongs.length > 0 && (
            <Checkbox
              label="Select All"
              checked={selectedSongs.size === filteredSongs.length}
              indeterminate={selectedSongs.size > 0 && selectedSongs.size < filteredSongs.length}
              onChange={toggleSelectAll}
            />
          )}
        </Group>

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
                key={song.id}
                withBorder
                p="md"
                style={{
                  transition: 'transform 0.2s ease',
                  ':hover': {
                    transform: 'translateX(4px)'
                  }
                }}
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
                        Last updated: {new Date(song.updatedAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                  </Group>
                  <Group>
                    <Button
                      component={Link}
                      to={`/songs/${song.id}`}
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
      </Stack>
    </Container>
  );
}