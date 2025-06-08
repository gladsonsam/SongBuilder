import * as React from 'react';
import { Badge, CloseButton, Group, Text, ActionIcon } from '@mantine/core';
import { IconColorSwatch } from '@tabler/icons-react';
import { getTagColor, changeTagColor } from '../utils/tagColors';
import './TagInput.css';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  suggestions?: string[];
}

export function TagInput({ value = [], onChange, placeholder = 'Add tag...', label, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      onChange(value.slice(0, -1));
    }
  };

  const addTag = (tag: string) => {
    // Convert to lowercase and remove any special characters
    const normalizedTag = tag.toLowerCase().trim();
    
    if (normalizedTag && !value.includes(normalizedTag)) {
      onChange([...value, normalizedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  // Filter suggestions that match the current input and aren't already selected
  const filteredSuggestions = suggestions
    .filter(tag => 
      tag.toLowerCase().includes(inputValue.toLowerCase()) && 
      !value.includes(tag.toLowerCase())
    )
    .slice(0, 5); // Limit to 5 suggestions

  return (
    <div>
      {label && <Text size="sm" fw={500} mb={5}>{label}</Text>}
      
      {/* Display tags above the input */}
      <Group gap="xs" mb="xs">
        {value.map((tag, index) => (
          <Badge 
            key={index} 
            size="sm"
            radius="sm"
            variant="filled"
            color={getTagColor(tag)}
            rightSection={
              <CloseButton 
                size="xs" 
                radius="xl" 
                color={getTagColor(tag)} 
                onClick={() => removeTag(index)}
                aria-label="Remove tag"
              />
            }
            leftSection={
              <ActionIcon 
                size="xs" 
                variant="transparent" 
                onClick={(e) => {
                  e.stopPropagation();
                  changeTagColor(tag);
                  // Force re-render
                  const newTags = [...value];
                  onChange(newTags);
                }}
                aria-label="Change tag color"
              >
                <IconColorSwatch size={10} />
              </ActionIcon>
            }
          >
            {tag}
          </Badge>
        ))}
      </Group>
      
      {/* Standard Mantine TextInput */}
      <div className="mantine-input-wrapper mantine-TextInput-wrapper" ref={wrapperRef}>
        <div className="mantine-Input-wrapper mantine-TextInput-input" data-variant="default">
          <div className="mantine-Input-input mantine-TextInput-input">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                padding: '5px',
                fontSize: '14px',
                color: 'inherit'
              }}
            />
          </div>
        </div>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          zIndex: 1000, 
          backgroundColor: 'var(--mantine-color-body)', 
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: '4px',
          marginTop: '4px',
          boxShadow: '0 2px 10px var(--mantine-color-shadow)',
          maxWidth: '100%',
          width: inputRef.current?.offsetWidth || 'auto'
        }}>
          {filteredSuggestions.map((suggestion, index) => (
            <div 
              key={index}
              style={{ 
                padding: '8px 12px', 
                cursor: 'pointer',
                borderBottom: index < filteredSuggestions.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-default-hover)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-body)')}
              onMouseDown={() => addTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
