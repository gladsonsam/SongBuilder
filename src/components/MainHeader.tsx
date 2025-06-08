
import { Group, Title, Button, useMantineColorScheme, Burger, rem } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
interface MainHeaderProps {
  opened: boolean;
  onToggle: () => void;
}

export function MainHeader({ opened, onToggle }: MainHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger
          opened={opened}
          onClick={onToggle}
          hiddenFrom="sm"
          size="sm"
        />
        <Title order={1} size={rem(24)}>SongBuilder</Title>
      </Group>
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