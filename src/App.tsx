import React, { Suspense } from 'react';
import { MantineProvider, AppShell, Center, Loader } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainHeader } from './components/MainHeader';
import { MainNavbar } from './components/MainNavbar';
import { AuthProvider } from './context/AuthContext';
import { StorageProvider } from './context/StorageContext';
import { SettingsProvider } from './context/SettingsContext';
// SongProvider removed - using Appwrite directly
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Lazy load page components
const HomePage = React.lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const SongEditor = React.lazy(() => import('./pages/SongEditor').then(module => ({ default: module.SongEditor })));
const SongList = React.lazy(() => import('./pages/SongList').then(module => ({ default: module.SongList })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));

// Loading component
const PageLoader = () => (
  <Center h={200}>
    <Loader size="lg" />
  </Center>
);

export default function App() {
  const [opened, setOpened] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 48em)');

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
              header={{ height: 60 }}
              navbar={{
                width: 240,
                breakpoint: 'sm',
                collapsed: { mobile: !opened, desktop: false }
              }}
              padding="md"
            >
              <AppShell.Header>
                <MainHeader opened={opened} onToggle={() => setOpened(!opened)} />
              </AppShell.Header>

              <AppShell.Navbar>
                <MainNavbar onNavClick={() => isMobile && setOpened(false)} />
              </AppShell.Navbar>

              <AppShell.Main>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/songs" element={<SongList />} />
                    <Route path="/songs/new" element={<SongEditor />} />
                    <Route path="/songs/:id" element={<SongEditor />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Suspense>
              </AppShell.Main>
            </AppShell>
            </Router>
          </StorageProvider>
        </AuthProvider>
      </SettingsProvider>
    </MantineProvider>
  );
}
