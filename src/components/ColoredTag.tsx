import { Badge, ActionIcon } from '@mantine/core';
import { IconColorSwatch } from '@tabler/icons-react';
import { getTagColor, changeTagColor } from '../utils/tagColors';

interface ColoredTagProps {
  tag: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  showColorSwatch?: boolean;
  variant?: 'filled' | 'light' | 'outline';
  onColorChange?: () => void;
}

export function ColoredTag({ 
  tag, 
  size = 'sm', 
  onClick, 
  showColorSwatch = true,
  variant = 'light',
  onColorChange
}: ColoredTagProps) {
  const handleColorChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    changeTagColor(tag);
    if (onColorChange) {
      onColorChange();
    }
  };

  return (
    <Badge
      size={size}
      variant={variant}
      color={getTagColor(tag)}
      onClick={onClick}
      rightSection={
        showColorSwatch ? (
          <ActionIcon 
            size="xs" 
            variant="transparent" 
            onClick={handleColorChange}
            aria-label="Change tag color"
          >
            <IconColorSwatch size={10} />
          </ActionIcon>
        ) : null
      }
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        paddingRight: showColorSwatch ? '4px' : undefined
      }}
    >
      {tag}
    </Badge>
  );
}
