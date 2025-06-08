import React, { createContext, useContext, useState } from 'react';

interface Settings {
  colors: {
    verse: string;
    chorus: string;
    bridge: string;
    tag: string;
    break: string;
    intro: string;
    outro: string;
    'pre-chorus': string;
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
}

const defaultSettings: Settings = {
  colors: {
    verse: 'blue',      // Blue
    chorus: 'green',    // Green
    bridge: 'orange',   // Orange
    tag: 'violet',      // Violet
    break: 'red',       // Red
    intro: 'indigo',    // Indigo
    outro: 'grape',     // Grape (purple)
    'pre-chorus': 'cyan'  // Cyan (light blue)
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Try to load settings from localStorage
    const savedSettings = localStorage.getItem('songbuilder_settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Settings) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        colors: {
          ...prev.colors,
          ...(newSettings.colors || {})
        }
      };
      // Save to localStorage
      localStorage.setItem('songbuilder_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
