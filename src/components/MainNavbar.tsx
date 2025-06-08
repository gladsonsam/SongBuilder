import { NavLink, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconMusic, IconSettings } from '@tabler/icons-react';

interface MainNavbarProps {
  onNavClick?: () => void;
}

export function MainNavbar({ onNavClick }: MainNavbarProps) {
  const location = useLocation();

  return (
    <Stack gap="xs" p="md">
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
  );
}