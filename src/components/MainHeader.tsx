
import { Group, Title, Button, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function MainHeader() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Title order={1}>SongBuilder</Title>
      <Button
        variant="default"
        onClick={toggleColorScheme}
        px="xs"
        title={colorScheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
      </Button>
    </Group>
  );
} 