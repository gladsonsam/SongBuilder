import React from 'react';
// React is used implicitly by JSX
import { MantineProvider, AppShell } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainHeader } from './components/MainHeader';
import { MainNavbar } from './components/MainNavbar';
import { HomePage } from './pages/HomePage';
import { SongEditor } from './pages/SongEditor';
import { SongList } from './pages/SongList';
import { Settings } from './pages/Settings';
import { SongProvider } from './context/SongContext';
import { SettingsProvider } from './context/SettingsContext';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

export default function App() {
  const [opened, setOpened] = React.useState(false);

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
        <SongProvider>
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
        </SongProvider>
      </SettingsProvider>
    </MantineProvider>
  );
}