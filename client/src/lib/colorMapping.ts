import { COLOR_PALETTES, type ColorPaletteConfig } from './colorPalettes';

/**
 * Color mapping system for indicators and categories
 * Ensures consistent colors across all charts based on selected palette
 */

interface ColorMap {
  [key: string]: string; // Maps "indicator-{id}" or "category-{id}" to hex color
}

const STORAGE_KEY = 'kpi-color-mapping';

/**
 * Get stored color mapping from localStorage
 */
export function getStoredColorMapping(): ColorMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save color mapping to localStorage
 */
export function saveColorMapping(mapping: ColorMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error('Failed to save color mapping:', error);
  }
}

/**
 * Generate a unique key for an indicator or category
 */
export function getColorKey(type: 'indicator' | 'category', id: number): string {
  return `${type}-${id}`;
}

/**
 * Get color for an indicator or category
 * If not yet assigned, assigns the next available color from the palette
 */
export function getIndicatorColor(
  indicatorId: number,
  paletteId: string,
  currentMapping: ColorMap,
  assignedCount: number
): string {
  const key = getColorKey('indicator', indicatorId);
  
  // Return existing color if available
  if (currentMapping[key]) {
    return currentMapping[key];
  }

  // Get palette and assign next color
  const palette = Object.values(COLOR_PALETTES).find((p: ColorPaletteConfig) => p.id === paletteId);
  if (!palette) return '#000000';

  const colorIndex = assignedCount % palette.colors.length;
  return palette.colors[colorIndex];
}

/**
 * Get color for a category
 */
export function getCategoryColor(
  categoryId: number,
  paletteId: string,
  currentMapping: ColorMap,
  assignedCount: number
): string {
  const key = getColorKey('category', categoryId);
  
  // Return existing color if available
  if (currentMapping[key]) {
    return currentMapping[key];
  }

  // Get palette and assign next color
  const palette = Object.values(COLOR_PALETTES).find((p: ColorPaletteConfig) => p.id === paletteId);
  if (!palette) return '#000000';

  const colorIndex = assignedCount % palette.colors.length;
  return palette.colors[colorIndex];
}

/**
 * Build complete color mapping for all indicators/categories in a dataset
 * Returns both the mapping and the updated mapping object
 */
export function buildColorMapping(
  items: Array<{ id: number; name: string }>,
  type: 'indicator' | 'category',
  paletteId: string,
  existingMapping: ColorMap = {}
): { mapping: ColorMap; colorMap: Map<number, string> } {
  const palette = Object.values(COLOR_PALETTES).find((p: ColorPaletteConfig) => p.id === paletteId);
  if (!palette) return { mapping: existingMapping, colorMap: new Map() };

  const newMapping = { ...existingMapping };
  const colorMap = new Map<number, string>();
  let assignedCount = 0;

  // First pass: assign colors to items that already have mappings
  for (const item of items) {
    const key = getColorKey(type, item.id);
    if (newMapping[key]) {
      colorMap.set(item.id, newMapping[key]);
    } else {
      assignedCount++;
    }
  }

  // Second pass: assign new colors to unmapped items
  let newColorIndex = 0;
  for (const item of items) {
    const key = getColorKey(type, item.id);
    if (!newMapping[key]) {
      const colorIndex = (assignedCount + newColorIndex) % palette.colors.length;
      newMapping[key] = palette.colors[colorIndex];
      colorMap.set(item.id, palette.colors[colorIndex]);
      newColorIndex++;
    }
  }

  return { mapping: newMapping, colorMap };
}

/**
 * Get all colors for a palette in order
 */
export function getPaletteColors(paletteId: string): string[] {
  const palette = Object.values(COLOR_PALETTES).find((p: ColorPaletteConfig) => p.id === paletteId);
  return palette?.colors || [];
}

/**
 * Clear all stored color mappings
 */
export function clearColorMapping(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear color mapping:', error);
  }
}

/**
 * Reset color mapping when palette changes
 * Keeps the mapping structure but updates with new palette colors
 */
export function resetColorMappingForPalette(
  oldMapping: ColorMap,
  newPaletteId: string,
  items: Array<{ id: number; name: string }>,
  type: 'indicator' | 'category'
): ColorMap {
  // Clear old mapping and rebuild with new palette
  const newMapping: ColorMap = {};
  const palette = Object.values(COLOR_PALETTES).find((p: ColorPaletteConfig) => p.id === newPaletteId);
  
  if (!palette) return oldMapping;

  items.forEach((item, index) => {
    const key = getColorKey(type, item.id);
    const colorIndex = index % palette.colors.length;
    newMapping[key] = palette.colors[colorIndex];
  });

  return newMapping;
}
