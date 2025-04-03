import { Paper, Text, Box, Stack } from '@mantine/core';
import { ChordButton } from './ChordButton';
import { useSettings } from '../context/SettingsContext';
import { Chord } from '../types/song';

interface SongSectionProps {
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus';
  content: string;
  number?: number;
  chords: Chord[];
  onChordClick?: (chord: string) => void;
}

export function SongSection({ type, content, number, chords, onChordClick }: SongSectionProps) {
  const { settings } = useSettings();
  const sectionColor = settings.colors[type] || 'blue';
  
  // Check if the color is a hex code or a named Mantine color
  const isHexColor = sectionColor.startsWith('#');

  // Split content into lines and remove trailing empty lines
  let lines = content.split('\n');
  
  // Trim trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  
  // Group chords by line number
  const chordsByLine = chords.reduce((acc, chord) => {
    if (!acc[chord.line]) {
      acc[chord.line] = [];
    }
    acc[chord.line].push(chord);
    return acc;
  }, {} as Record<number, Chord[]>);

  return (
    <Paper 
      p="md" 
      withBorder 
      style={{ 
        backgroundColor: isHexColor ? `${sectionColor}20` : `var(--mantine-color-${sectionColor}-1)`,
        border: isHexColor ? `1px solid ${sectionColor}` : `1px solid var(--mantine-color-${sectionColor}-3)`
      }}
    >
      <Stack gap="xs">
        <Text 
          fw={700} 
          tt="uppercase" 
          size="sm"
          style={{ color: isHexColor ? sectionColor : `var(--mantine-color-${sectionColor}-7)` }}
        >
          {type}{number ? ` ${number}` : ''}
        </Text>

        <Stack gap={0}>
          {lines.map((line, lineIndex) => (
            <Box 
              key={lineIndex} 
              style={{ 
                position: 'relative',
                height: line.trim() ? '3em' : '1em', // Taller for lines with content, shorter for empty lines
                marginBottom: lineIndex < lines.length - 1 ? '0.5em' : 0 // Margin except for last line
              }}
            >
              {/* Chord line */}
              <Box 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '1.5em',
                  fontFamily: 'monospace', // Use monospace for consistent character width
                  fontSize: '1em', // Match lyrics font size
                  letterSpacing: '0px' // Ensure exact spacing
                }}
              >
                {chordsByLine[lineIndex]?.map((chord) => (
                  <ChordButton
                    key={chord.id}
                    chord={chord.text}
                    style={{
                      position: 'absolute',
                      left: `${chord.position}ch`, // Use ch unit for monospace character width
                      transform: 'scale(0.9)', // Slightly smaller chords
                      transformOrigin: 'left top' // Transform from left edge
                    }}
                    onClick={() => onChordClick?.(chord.text)}
                  />
                ))}
              </Box>
              {/* Lyrics line */}
              {line.trim() && (
                <Text 
                  component="pre" 
                  style={{ 
                    whiteSpace: 'pre',
                    margin: 0,
                    position: 'absolute',
                    top: '1.75em',
                    left: 0,
                    right: 0,
                    lineHeight: 1.2,
                    fontSize: '1em',
                    color: 'var(--mantine-color-dark-8)',
                    fontFamily: 'monospace', // Use monospace for consistent character width
                    letterSpacing: '0px' // Ensure exact spacing
                  }}
                >
                  {line}
                </Text>
              )}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
