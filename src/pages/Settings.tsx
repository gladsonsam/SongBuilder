import { Title, Stack, ColorInput, Text, Divider, Grid, Card, Button } from '@mantine/core';
import { useSettings } from '../context/SettingsContext';

export function Settings() {
  const { settings, updateSettings } = useSettings();
  
  // Define the default colors for reset functionality
  const defaultColors = {
    verse: 'blue',
    chorus: 'green',
    bridge: 'orange',
    tag: 'violet',
    break: 'red',
    intro: 'indigo',
    outro: 'grape',
    'pre-chorus': 'cyan'
  };

  // Reset all colors to default
  const resetColorsToDefault = () => {
    updateSettings({
      colors: { ...defaultColors }
    });
  };

  // Handle color change for a specific section type
  const handleColorChange = (sectionType: keyof typeof settings.colors) => (color: string) => {
    console.log(`Changing ${sectionType} color to ${color}`);
    
    // Create a new colors object with the updated color
    const updatedColors = {
      ...settings.colors,
      [sectionType]: color
    };
    
    // Update the settings with the new colors object
    updateSettings({
      colors: updatedColors
    });
  };

  // Common color swatches for all inputs
  const colorSwatches = ['blue', 'indigo', 'violet', 'grape', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan'];

  return (
    <Stack gap="xl">
      <Title order={1}>Settings</Title>
      
      <Card withBorder radius="md">
        <Title order={2} mb="md">Customization</Title>
        <Divider mb="lg" />
        
        <Stack gap="xl">
          {/* Section Colors */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Title order={3}>Section Colors</Title>
              <Button
                variant="outline"
                color="blue"
                onClick={resetColorsToDefault}
                size="sm"
              >
                Reset to Default Colors
              </Button>
            </div>
            <Text size="sm" c="dimmed" mb="md">
              Customize the colors for different section types. These colors will be used to highlight
              sections in the song editor. Use the reset button to restore the original colors.
            </Text>
            
            <Grid>
              {/* Main Sections */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md" radius="md">
                  <Title order={4} mb="md">Main Sections</Title>
                  <Stack gap="md">
                    <ColorInput
                      label="Verse Color"
                      value={settings.colors.verse}
                      onChange={handleColorChange('verse')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                    
                    <ColorInput
                      label="Chorus Color"
                      value={settings.colors.chorus}
                      onChange={handleColorChange('chorus')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                    
                    <ColorInput
                      label="Pre-Chorus Color"
                      value={settings.colors['pre-chorus']}
                      onChange={handleColorChange('pre-chorus')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                    
                    <ColorInput
                      label="Bridge Color"
                      value={settings.colors.bridge}
                      onChange={handleColorChange('bridge')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                  </Stack>
                </Card>
              </Grid.Col>
              
              {/* Additional Sections */}
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder p="md" radius="md">
                  <Title order={4} mb="md">Additional Sections</Title>
                  <Stack gap="md">
                    <ColorInput
                      label="Intro Color"
                      value={settings.colors.intro}
                      onChange={handleColorChange('intro')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                    
                    <ColorInput
                      label="Outro Color"
                      value={settings.colors.outro}
                      onChange={handleColorChange('outro')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                    
                    <ColorInput
                      label="Tag Color"
                      value={settings.colors.tag}
                      onChange={handleColorChange('tag')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                    
                    <ColorInput
                      label="Break Color"
                      value={settings.colors.break}
                      onChange={handleColorChange('break')}
                      swatches={colorSwatches}
                      withEyeDropper={false}
                      disallowInput={false}
                    />
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </div>
        </Stack>
      </Card>
    </Stack>
  );
}
