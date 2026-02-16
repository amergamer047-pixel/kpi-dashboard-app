/**
 * Professional Color Palettes for KPI Dashboard
 * Each palette includes colors optimized for charts and visual appeal
 */

export interface ColorPaletteConfig {
  id: string;
  name: string;
  description: string;
  colors: string[];
  category: "professional" | "vibrant" | "pastel" | "accessible";
  isAccessible: boolean; // Colorblind-friendly
}

export const COLOR_PALETTES: Record<string, ColorPaletteConfig> = {
  // Professional & Corporate Palettes
  corporate: {
    id: "corporate",
    name: "Corporate Blue",
    description: "Professional blue-based palette for business dashboards",
    colors: ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD"],
    category: "professional",
    isAccessible: true,
  },
  slate: {
    id: "slate",
    name: "Slate Gray",
    description: "Sophisticated grayscale with accent colors",
    colors: ["#2C3E50", "#34495E", "#7F8C8D", "#E74C3C", "#3498DB"],
    category: "professional",
    isAccessible: true,
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    description: "Dark, elegant palette for modern dashboards",
    colors: ["#0F3460", "#16213E", "#E94560", "#533483", "#1A5F7A"],
    category: "professional",
    isAccessible: true,
  },

  // Vibrant & Modern Palettes
  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description: "Bold, energetic colors for high-impact visualization",
    colors: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC", "#3A86FF"],
    category: "vibrant",
    isAccessible: false,
  },
  neon: {
    id: "neon",
    name: "Neon",
    description: "Bright, eye-catching colors with modern appeal",
    colors: ["#00D9FF", "#FF006E", "#FFBE0B", "#00FF00", "#FF0080"],
    category: "vibrant",
    isAccessible: false,
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Warm gradient from orange to pink",
    colors: ["#FF6B6B", "#FFA500", "#FFD93D", "#FF8C42", "#FF6B9D"],
    category: "vibrant",
    isAccessible: true,
  },

  // Pastel & Soft Palettes
  pastel: {
    id: "pastel",
    name: "Pastel",
    description: "Soft, gentle colors for calm visualization",
    colors: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF"],
    category: "pastel",
    isAccessible: true,
  },
  soft: {
    id: "soft",
    name: "Soft Muted",
    description: "Muted, sophisticated pastel tones",
    colors: ["#D4A5A5", "#D4C5A5", "#C5D4A5", "#A5D4C5", "#A5C5D4"],
    category: "pastel",
    isAccessible: true,
  },
  macarons: {
    id: "macarons",
    name: "Macarons",
    description: "Delicate, dessert-inspired color palette",
    colors: ["#F8B4D4", "#F4D4A8", "#D4F4A8", "#A8F4D4", "#A8D4F4"],
    category: "pastel",
    isAccessible: true,
  },

  // Nature-Inspired Palettes
  forest: {
    id: "forest",
    name: "Forest",
    description: "Natural greens and earth tones",
    colors: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2"],
    category: "professional",
    isAccessible: true,
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Cool blues and teals from the sea",
    colors: ["#0077B6", "#00B4D8", "#90E0EF", "#00D9FF", "#0096C7"],
    category: "professional",
    isAccessible: true,
  },
  autumn: {
    id: "autumn",
    name: "Autumn",
    description: "Warm browns, oranges, and reds",
    colors: ["#8B4513", "#CD853F", "#DAA520", "#DC143C", "#FF8C00"],
    category: "professional",
    isAccessible: true,
  },

  // Accessible Palettes (Colorblind-Friendly)
  deuteranopia: {
    id: "deuteranopia",
    name: "Deuteranopia Safe",
    description: "Optimized for red-green colorblindness",
    colors: ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E"],
    category: "accessible",
    isAccessible: true,
  },
  protanopia: {
    id: "protanopia",
    name: "Protanopia Safe",
    description: "Optimized for red-green colorblindness (alternative)",
    colors: ["#332288", "#88CCEE", "#44AA99", "#117733", "#DDCC77"],
    category: "accessible",
    isAccessible: true,
  },
  tritanopia: {
    id: "tritanopia",
    name: "Tritanopia Safe",
    description: "Optimized for blue-yellow colorblindness",
    colors: ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00"],
    category: "accessible",
    isAccessible: true,
  },

  // Monochromatic & Minimal
  grayscale: {
    id: "grayscale",
    name: "Grayscale",
    description: "Professional black and white with grays",
    colors: ["#000000", "#404040", "#808080", "#C0C0C0", "#FFFFFF"],
    category: "professional",
    isAccessible: true,
  },
};

export const PALETTE_CATEGORIES = {
  professional: "Professional",
  vibrant: "Vibrant & Modern",
  pastel: "Pastel & Soft",
  accessible: "Accessible (Colorblind-Friendly)",
};

export function getPaletteColors(paletteId: string): string[] {
  return COLOR_PALETTES[paletteId]?.colors || COLOR_PALETTES.corporate.colors;
}

export function getAllPalettes(): ColorPaletteConfig[] {
  return Object.values(COLOR_PALETTES);
}

export function getPalettesByCategory(
  category: string
): ColorPaletteConfig[] {
  return Object.values(COLOR_PALETTES).filter(
    (p) => p.category === category
  );
}

export function getAccessiblePalettes(): ColorPaletteConfig[] {
  return Object.values(COLOR_PALETTES).filter((p) => p.isAccessible);
}
