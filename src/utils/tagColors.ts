// Define a set of Mantine colors to use for tags
const availableColors = [
  'blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 
  'orange', 'red', 'pink', 'grape', 'violet', 'indigo'
];

// Store tag colors in localStorage to persist user preferences
const TAG_COLORS_KEY = 'songbuilder-tag-colors';

// Get stored tag colors or initialize empty object
export function getTagColors(): Record<string, string> {
  try {
    const stored = localStorage.getItem(TAG_COLORS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load tag colors from localStorage:', error);
    return {};
  }
}

// Save tag colors to localStorage
export function saveTagColors(colors: Record<string, string>): void {
  try {
    localStorage.setItem(TAG_COLORS_KEY, JSON.stringify(colors));
  } catch (error) {
    console.error('Failed to save tag colors to localStorage:', error);
  }
}

// Find the least used color among existing tags
function findLeastUsedColor(tagColors: Record<string, string>): string {
  // Count how many times each color is used
  const colorCounts = availableColors.reduce((counts, color) => {
    counts[color] = 0;
    return counts;
  }, {} as Record<string, number>);
  
  // Count occurrences of each color
  Object.values(tagColors).forEach(color => {
    if (colorCounts[color] !== undefined) {
      colorCounts[color]++;
    }
  });
  
  // Find the color with the lowest count
  let leastUsedColor = availableColors[0];
  let lowestCount = Number.MAX_SAFE_INTEGER;
  
  Object.entries(colorCounts).forEach(([color, count]) => {
    if (count < lowestCount) {
      lowestCount = count;
      leastUsedColor = color;
    }
  });
  
  return leastUsedColor;
}

// Get a color for a tag, either from stored preferences or generate a new one
export function getTagColor(tag: string): string {
  const tagColors = getTagColors();
  
  // If tag already has a color, use it
  if (tagColors[tag]) {
    return tagColors[tag];
  }
  
  // Find the least used color to ensure even distribution
  const newColor = findLeastUsedColor(tagColors);
  
  // Store the new color
  tagColors[tag] = newColor;
  saveTagColors(tagColors);
  
  return newColor;
}

// Find the next available color that isn't used by any other tag
function findNextAvailableColor(tagColors: Record<string, string>, currentColor: string): string {
  // Get all colors currently in use
  const usedColors = new Set(Object.values(tagColors));
  
  // Start from the next color after the current one
  const currentIndex = availableColors.indexOf(currentColor);
  
  // Try each color in sequence until we find one that's not used
  for (let i = 1; i <= availableColors.length; i++) {
    const nextIndex = (currentIndex + i) % availableColors.length;
    const candidateColor = availableColors[nextIndex];
    
    // If this color isn't used by any other tag, use it
    if (!usedColors.has(candidateColor) || candidateColor === currentColor) {
      return candidateColor;
    }
  }
  
  // If all colors are used, find the least used color
  return findLeastUsedColor(tagColors);
}

// Change the color of a tag
export function changeTagColor(tag: string): string {
  const tagColors = getTagColors();
  
  // Get the current color
  const currentColor = tagColors[tag] || getTagColor(tag);
  
  // Find a color that isn't used by any other tag
  const newColor = findNextAvailableColor(tagColors, currentColor);
  
  // Store the new color
  tagColors[tag] = newColor;
  saveTagColors(tagColors);
  
  return newColor;
}
