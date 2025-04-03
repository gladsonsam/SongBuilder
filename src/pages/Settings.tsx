import { Title, Stack, Paper, ColorInput, Text } from '@mantine/core';
import { useSettings } from '../context/SettingsContext';

export function Settings() {
  const { settings, updateSettings } = useSettings();

  const handleColorChange = (sectionType: keyof typeof settings.colors) => (color: string) => {
    updateSettings({
      colors: {
        ...settings.colors,
        [sectionType]: color
      }
    });
  };

  return (
    <Stack>
      <Title order={2}>Settings</Title>

      <Paper withBorder p="md">
        <Stack>
          <Title order={3}>Section Colors</Title>
          <Text size="sm" c="dimmed">
            Customize the colors for different section types. These colors will be used to highlight
            sections in the song editor.
          </Text>

          <ColorInput
            label="Verse Color"
            value={settings.colors.verse}
            onChange={handleColorChange('verse')}
            swatches={['blue', 'indigo', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan']}
          />

          <ColorInput
            label="Chorus Color"
            value={settings.colors.chorus}
            onChange={handleColorChange('chorus')}
            swatches={['blue', 'indigo', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan']}
          />

          <ColorInput
            label="Bridge Color"
            value={settings.colors.bridge}
            onChange={handleColorChange('bridge')}
            swatches={['blue', 'indigo', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan']}
          />

          <ColorInput
            label="Tag Color"
            value={settings.colors.tag}
            onChange={handleColorChange('tag')}
            swatches={['blue', 'indigo', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan']}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
