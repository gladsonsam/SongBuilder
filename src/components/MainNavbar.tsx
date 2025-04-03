import { NavLink } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconMusic, IconSettings } from '@tabler/icons-react';

export function MainNavbar() {
  const location = useLocation();

  return (
    <div style={{ padding: '1rem' }}>
      <NavLink
        component={Link}
        to="/"
        label="Home"
        leftSection={<IconHome size={16} />}
        active={location.pathname === '/'}
      />
      <NavLink
        component={Link}
        to="/songs"
        label="Songs"
        leftSection={<IconMusic size={16} />}
        active={location.pathname.startsWith('/songs')}
      />
      <NavLink
        component={Link}
        to="/settings"
        label="Settings"
        leftSection={<IconSettings size={16} />}
        active={location.pathname === '/settings'}
      />
    </div>
  );
}