import React from 'react';
import { MantineProvider, AppShell } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainHeader } from './components/MainHeader';
import { MainNavbar } from './components/MainNavbar';
import { HomePage } from './pages/HomePage';
import { SongEditor } from './pages/SongEditor';
import { SongList } from './pages/SongList';
import { Settings } from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import { StorageProvider } from './context/StorageContext';
import { SettingsProvider } from './context/SettingsContext';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

export default function App() {
  const [opened, setOpened] = React.useState(false);

  // Detect if we're on mobile (Mantine's 'sm' breakpoint)
  const isMobile = window.matchMedia('(max-width: 48em)').matches;

  // Overlay style
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 1200,
    transition: 'opacity 0.25s',
    opacity: opened ? 1 : 0,
    pointerEvents: opened ? 'auto' : 'none',
  };

  return (
    <MantineProvider
      defaultColorScheme="dark"
      theme={{
        primaryColor: 'blue',
        breakpoints: {
          xs: '30em',    // 480px
          sm: '48em',    // 768px
          md: '64em',    // 1024px
          lg: '74em',    // 1184px
          xl: '90em',    // 1440px
        },
      }}
    >
      <SettingsProvider>
        <AuthProvider>
          <StorageProvider>
            <Notifications />
            <Router>
            <AppShell
              header={{ height: { base: 60, sm: 60 } }}
              navbar={{
                width: { base: 240, sm: 240 },
                breakpoint: 'sm',
                collapsed: { mobile: !opened }
              }}
              padding={{ base: 'sm', sm: 'md' }}
              layout="alt"
            >
              {/* Overlay for mobile sidebar */}
              {isMobile && opened && (
                <div
                  style={overlayStyle}
                  onClick={() => setOpened(false)}
                  aria-label="Close sidebar overlay"
                />
              )}

              <AppShell.Header>
                <MainHeader opened={opened} onToggle={() => setOpened(!opened)} />
              </AppShell.Header>

              <AppShell.Navbar>
                <MainNavbar onNavClick={() => setOpened(false)} />
              </AppShell.Navbar>

              <AppShell.Main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/songs" element={<SongList />} />
                  <Route path="/songs/new" element={<SongEditor />} />
                  <Route path="/songs/:id" element={<SongEditor />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AppShell.Main>
            </AppShell>
            </Router>
          </StorageProvider>
        </AuthProvider>
      </SettingsProvider>
    </MantineProvider>
  );
}
