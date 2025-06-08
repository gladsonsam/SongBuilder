import React, { useState, useRef, useEffect } from 'react';
import { Badge, CloseButton, Group, Text, Loader } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { getAllSongs } from '../utils/appwriteDb';
import './TagInput.css'; // Reuse the tag styling

interface ArtistInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function ArtistInput({ value = '', onChange, placeholder = 'Add artist...', label, readOnly = false }: ArtistInputProps & { readOnly?: boolean }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [artists, setArtists] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [artistArray, setArtistArray] = useState<string[]>(value ? value.split(', ') : []);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load all unique artists from the database
  useEffect(() => {
    const loadArtists = async () => {
      setIsLoading(true);
      try {
        const songs = await getAllSongs();
        // Extract all artists and split multi-artist entries
        const allArtists = songs
          .map(song => song.artist.split(', '))
          .flat()
          .map(artist => artist.trim())
          .filter(artist => artist !== '');
        
        // Get unique artists
        const uniqueArtists = [...new Set(allArtists)];
        setArtists(uniqueArtists);
      } catch (error) {
        console.error('Failed to load artists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtists();
  }, []);

  // Update the parent component's value when artistArray changes
  useEffect(() => {
    onChange(artistArray.join(', '));
  }, [artistArray, onChange]);

  // Update artistArray when the value prop changes (for external updates)
  useEffect(() => {
    const newArtistArray = value ? value.split(', ').map(a => a.trim()).filter(a => a !== '') : [];
    if (JSON.stringify(newArtistArray) !== JSON.stringify(artistArray)) {
      setArtistArray(newArtistArray);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addArtist(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && artistArray.length > 0) {
      // Remove the last artist when backspace is pressed and input is empty
      setArtistArray(artistArray.slice(0, -1));
    }
  };

  const addArtist = (artist: string) => {
    const normalizedArtist = artist.trim();
    
    if (normalizedArtist && !artistArray.includes(normalizedArtist)) {
      setArtistArray([...artistArray, normalizedArtist]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeArtist = (index: number) => {
    setArtistArray(artistArray.filter((_, i) => i !== index));
  };

  // Filter suggestions that match the current input and aren't already selected
  const filteredSuggestions = artists
    .filter(artist => 
      artist.toLowerCase().includes(inputValue.toLowerCase()) && 
      !artistArray.includes(artist)
    )
    .slice(0, 5); // Limit to 5 suggestions

  return (
    <div>
      {label && <Text size="sm" fw={500} mb={5}>{label}</Text>}
      
      {/* Display artists above the input */}
      <Group gap="xs" mb="xs">
        {artistArray.map((artist, index) => (
          <Badge 
            key={index} 
            size="sm"
            radius="sm"
            variant="filled"
            color="blue"
            rightSection={
              !readOnly && <CloseButton 
                size="xs" 
                radius="xl" 
                color="blue" 
                onClick={() => removeArtist(index)}
                aria-label="Remove artist"
              />
            }
            leftSection={<IconUser size={12} />}
          >
            {artist}
          </Badge>
        ))}
        {isLoading && <Loader size="xs" />}
      </Group>
      
      {/* Input for new artists */}
      <div className="mantine-input-wrapper mantine-TextInput-wrapper" ref={wrapperRef}>
        <div className="mantine-Input-wrapper mantine-TextInput-input" data-variant="default">
          <div className="mantine-Input-input mantine-TextInput-input">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={readOnly ? undefined : handleInputChange}
              onKeyDown={readOnly ? undefined : handleInputKeyDown}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={artistArray.length > 0 ? 'Add another artist...' : placeholder}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                padding: '5px',
                fontSize: '14px',
                color: 'inherit'
              }}
              readOnly={readOnly}
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
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          maxWidth: '100%',
          width: inputRef.current?.offsetWidth || 'auto',
          overflow: 'hidden'
        }}>
          {filteredSuggestions.map((suggestion, index) => (
            <div 
              key={index}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: index < filteredSuggestions.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none',
                color: 'var(--mantine-color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-primary-light)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onMouseDown={() => addArtist(suggestion)}
            >
              <IconUser size={14} style={{ opacity: 0.7 }} />
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
