import { NavLink, Stack, Box, Flex } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconMusic, IconSettings } from '@tabler/icons-react';
import { StorageModeIndicator } from './StorageModeIndicator';

interface MainNavbarProps {
  onNavClick?: () => void;
}

export function MainNavbar({ onNavClick }: MainNavbarProps) {
  const location = useLocation();

  return (
    <Flex direction="column" h="100%" p="md">
      {/* Main Navigation */}
      <Stack gap="xs" flex={1}>
        <NavLink
          component={Link}
          to="/"
          label="Home"
          leftSection={<IconHome size={20} />}
          active={location.pathname === '/'}
          variant="filled"
          py="xs"
          onClick={onNavClick}
        />
        <NavLink
          component={Link}
          to="/songs"
          label="Songs"
          leftSection={<IconMusic size={20} />}
          active={location.pathname.startsWith('/songs')}
          variant="filled"
          py="xs"
          onClick={onNavClick}
        />
        <NavLink
          component={Link}
          to="/settings"
          label="Settings"
          leftSection={<IconSettings size={20} />}
          active={location.pathname === '/settings'}
          variant="filled"
          py="xs"
          onClick={onNavClick}
        />
      </Stack>

      {/* Storage Mode & Auth at Bottom */}
      <Box>
        <StorageModeIndicator />
      </Box>
    </Flex>
  );
}