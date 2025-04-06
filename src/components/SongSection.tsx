import React from 'react';
import { Paper, Text, Box, Stack } from '@mantine/core';
import { ChordButton } from './ChordButton';
import { useSettings } from '../context/SettingsContext';
import { Chord } from '../types/song';
import './SongSection.css';

interface SongSectionProps {
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'break' | 'intro' | 'outro' | 'pre-chorus';
  content: string;
  number?: number;
  chords: Chord[];
  onChordClick?: (chord: string) => void;
  onChordMove?: (chordId: string, lineIndex: number, newPosition: number) => void;
}

export function SongSection({ type, content, number, chords, onChordClick, onChordMove }: SongSectionProps) {
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
  
  // State to track the position indicator during drag
  const [dropIndicator, setDropIndicator] = React.useState<{ line: number; position: number } | null>(null);

  // Handle drag over event - needed to allow dropping
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Add a visual indicator for the drop target
    e.currentTarget.classList.add('drag-over');
    
    // Calculate the position for the drop indicator
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    
    // Get the line index from the data attribute
    const lineIndex = parseInt(e.currentTarget.getAttribute('data-line-index') || '0', 10);
    
    // Estimate character width - assuming monospace font where 1ch ≈ 8px
    const charWidth = 8;
    const position = Math.round(dropX / charWidth);
    
    // Update the drop indicator position
    setDropIndicator({ line: lineIndex, position });
  };
  
  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drag-over');
    // Clear the drop indicator when leaving the drop target
    setDropIndicator(null);
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, lineIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    // Clear the drop indicator after dropping
    setDropIndicator(null);
    
    try {
      // Get the chord data from the drag event
      const chordData = e.dataTransfer.getData('application/chord');
      if (!chordData) return;
      
      const { chord } = JSON.parse(chordData);
      
      // Calculate the new position based on the drop location
      // We need to convert from pixels to character units (ch)
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      
      // Estimate character width - assuming monospace font where 1ch ≈ 8px
      // This is an approximation and may need adjustment based on your font
      const charWidth = 8;
      const newPosition = Math.round(dropX / charWidth);
      
      // Find the chord that was dragged
      const draggedChord = chords.find(c => c.text === chord);
      if (draggedChord && onChordMove) {
        onChordMove(draggedChord.id, lineIndex, newPosition);
      }
    } catch (error) {
      console.error('Error handling chord drop:', error);
    }
  };

  // We're now using an imported CSS file instead of dynamic style injection
  
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
              data-line-index={lineIndex}
              style={{ 
                position: 'relative',
                height: line.trim() ? '3em' : '1em', // Taller for lines with content, shorter for empty lines
                marginBottom: lineIndex < lines.length - 1 ? '0.5em' : 0 // Margin except for last line
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, lineIndex)}
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
                {/* Drop indicator */}
                {dropIndicator && dropIndicator.line === lineIndex && (
                  <div 
                    className="chord-drop-indicator"
                    style={{ left: `${dropIndicator.position}ch` }}
                  />
                )}
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
