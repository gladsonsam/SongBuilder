import * as React from 'react';
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
  return (
    <MantineProvider
      defaultColorScheme="dark"
      theme={{
        primaryColor: 'blue',
      }}
    >
      <SettingsProvider>
        <SongProvider>
          <Notifications />
          <Router>
            <AppShell
              header={{ height: 60 }}
              navbar={{ width: 240, breakpoint: 'sm' }}
              padding="md"
            >
              <AppShell.Header>
                <MainHeader />
              </AppShell.Header>

              <AppShell.Navbar>
                <MainNavbar />
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