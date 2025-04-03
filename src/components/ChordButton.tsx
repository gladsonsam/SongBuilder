import { Button, ButtonProps } from '@mantine/core';

interface ChordButtonProps extends Omit<ButtonProps, 'children'> {
  chord: string;
  onClick?: (chord: string) => void;
}

export function ChordButton({ chord, style, onClick, ...props }: ChordButtonProps) {
  return (
    <Button
      size="xs"
      variant="light"
      radius="sm"
      px="xs"
      style={{ 
        fontFamily: 'monospace',
        color: 'var(--mantine-color-dark-9)', // Black text
        height: 'auto',
        padding: '2px 6px',
        fontWeight: 600,
        ...style 
      }}
      onClick={onClick ? () => onClick(chord) : undefined}
      {...props}
    >
      {chord}
    </Button>
  );
}
