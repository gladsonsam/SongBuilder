import { Button, ButtonProps } from '@mantine/core';
import React from 'react';
import './ChordButton.css';

interface ChordButtonProps extends Omit<ButtonProps, 'children'> {
  chord: string;
  onClick?: (chord: string) => void;
}

export function ChordButton({ chord, style, onClick, readOnly = false, ...props }: ChordButtonProps & { readOnly?: boolean }) {
  // Store the original chord text for transposition
  const originalChord = chord;
  
  // Handle drag start event
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    // Set the drag data with the chord text and original position
    e.dataTransfer.setData('text/plain', chord);
    
    // Handle the style object correctly for TypeScript
    let originalPosition = '0ch';
    if (style && typeof style === 'object' && 'left' in style) {
      originalPosition = String(style.left);
    }
    
    e.dataTransfer.setData('application/chord', JSON.stringify({
      chord: chord,
      originalPosition: originalPosition
    }));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to the element being dragged for visual feedback
    e.currentTarget.classList.add('dragging');
  };
  
  // Handle drag end event
  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    // Remove the dragging class
    e.currentTarget.classList.remove('dragging');
  };
  
  return (
    <Button
      size="xs"
      variant="light"
      radius="sm"
      px="xs"
      className="chord"
      data-original={originalChord}
      style={{ 
        fontFamily: 'monospace',
        color: 'var(--mantine-color-dark-9)', // Black text
        height: 'auto',
        padding: '2px 6px',
        fontWeight: 600,
        cursor: readOnly ? 'default' : 'grab',
        ...style 
      }}
      onClick={onClick ? () => onClick(originalChord) : undefined}
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : handleDragStart}
      onDragEnd={readOnly ? undefined : handleDragEnd}
      {...props}
    >
      {chord}
    </Button>
  );
}

// Instead of dynamically injecting styles, we'll add a CSS file
// Create a new file called ChordButton.css with the styles
