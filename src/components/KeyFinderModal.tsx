import React, { useState } from 'react';
import { Modal, Button, Group, Select, Stack, Text, Slider } from '@mantine/core';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function playNote(note: string, octave: number = 4, duration: number = 0.7) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const noteFreqs: Record<string, number> = {
    'C': 261.63,
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'B': 493.88
  };
  const freq = noteFreqs[note] * Math.pow(2, octave - 4);

  // Create multiple oscillators for a richer piano-like sound
  const osc1 = ctx.createOscillator(); // Main tone
  const osc2 = ctx.createOscillator(); // Harmonic
  const osc3 = ctx.createOscillator(); // Soft overtone
  
  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc3.type = 'sine';
  
  osc1.frequency.value = freq;
  osc2.frequency.value = freq;
  osc3.frequency.value = freq * 2; // One octave higher for harmonics
  
  // Create a filter for a softer sound
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;
  
  // Create gain nodes for volume control
  const mainGain = ctx.createGain();
  const harmonicGain = ctx.createGain();
  
  // Connect oscillators to their respective gain nodes
  osc1.connect(mainGain);
  osc2.connect(harmonicGain);
  osc3.connect(harmonicGain);
  
  // Set initial gain values (harmonic is quieter)
  mainGain.gain.value = 0;
  harmonicGain.gain.value = 0;
  
  // Connect gains to filter and filter to output
  mainGain.connect(filter);
  harmonicGain.connect(filter);
  filter.connect(ctx.destination);
  
  // Start oscillators
  osc1.start();
  osc2.start();
  osc3.start();
  
  // Soft attack (piano-like)
  mainGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  harmonicGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
  
  // Gentle decay
  mainGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
  harmonicGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.1);
  
  // Soft release
  mainGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  harmonicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  // Stop oscillators
  osc1.stop(ctx.currentTime + duration);
  osc2.stop(ctx.currentTime + duration);
  osc3.stop(ctx.currentTime + duration);
  
  // Clean up
  osc1.onended = () => ctx.close();
}

function playScale(root: string, octave: number = 4) {
  // Major scale intervals: W W H W W W H
  const intervals = [2, 2, 1, 2, 2, 2, 1];
  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) return;
  let midi = 12 * (octave + 1) + rootIndex;
  const scaleMidis = [midi];
  for (let i = 0; i < intervals.length; i++) {
    midi += intervals[i];
    scaleMidis.push(midi);
  }
  // Recursive function to play each note in sequence
  function playNextNote(idx: number) {
    if (idx >= scaleMidis.length) return;
    const m = scaleMidis[idx];
    const noteIdx = m % 12;
    const noteOctave = Math.floor(m / 12) - 1;
    playNote(NOTES[noteIdx], noteOctave);
    setTimeout(() => playNextNote(idx + 1), 300);
  }
  playNextNote(0);
}

interface KeyFinderModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (key: string) => void;
}

export const KeyFinderModal: React.FC<KeyFinderModalProps> = ({ opened, onClose, onConfirm }) => {
  const [selectedKey, setSelectedKey] = useState('C');
  const [octave, setOctave] = useState(4);

  return (
    <Modal opened={opened} onClose={onClose} title="Key Finder" centered>
      <Stack>
        <Text>Select a key and try it out:</Text>
        <Group>
          <Select
            data={NOTES}
            value={selectedKey}
            onChange={v => setSelectedKey(v || 'C')}
            label="Key"
            searchable
          />
          <Slider
            min={2}
            max={6}
            step={1}
            value={octave}
            onChange={setOctave}
            label={octave.toString()}
            marks={[{value:2,label:'2'},{value:3,label:'3'},{value:4,label:'4'},{value:5,label:'5'},{value:6,label:'6'}]}
            style={{width:120}}
          />
        </Group>
        <Group>
          <Button onClick={() => playNote(selectedKey, octave)} variant="outline">Play Root</Button>
          <Button onClick={() => playScale(selectedKey, octave)} variant="outline">Play Scale</Button>
        </Group>
        <Button onClick={() => { onConfirm(selectedKey); onClose(); }} fullWidth color="blue">Use This Key</Button>
      </Stack>
    </Modal>
  );
};