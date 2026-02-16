import { describe, it, expect } from "vitest";
import {
  COLOR_PALETTES,
  PALETTE_CATEGORIES,
  getPaletteColors,
  getAllPalettes,
  getPalettesByCategory,
  getAccessiblePalettes,
} from "./colorPalettes";

describe("Color Palettes Configuration", () => {
  describe("palette structure", () => {
    it("should have all required palette properties", () => {
      Object.values(COLOR_PALETTES).forEach((palette) => {
        expect(palette).toHaveProperty("id");
        expect(palette).toHaveProperty("name");
        expect(palette).toHaveProperty("description");
        expect(palette).toHaveProperty("colors");
        expect(palette).toHaveProperty("category");
        expect(palette).toHaveProperty("isAccessible");
      });
    });

    it("should have valid color hex values", () => {
      Object.values(COLOR_PALETTES).forEach((palette) => {
        expect(Array.isArray(palette.colors)).toBe(true);
        expect(palette.colors.length).toBeGreaterThan(0);

        palette.colors.forEach((color) => {
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });

    it("should have valid category values", () => {
      const validCategories = [
        "professional",
        "vibrant",
        "pastel",
        "accessible",
      ];

      Object.values(COLOR_PALETTES).forEach((palette) => {
        expect(validCategories).toContain(palette.category);
      });
    });

    it("should have at least 5 colors per palette", () => {
      Object.values(COLOR_PALETTES).forEach((palette) => {
        expect(palette.colors.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  describe("palette categories", () => {
    it("should have all required category labels", () => {
      expect(PALETTE_CATEGORIES).toHaveProperty("professional");
      expect(PALETTE_CATEGORIES).toHaveProperty("vibrant");
      expect(PALETTE_CATEGORIES).toHaveProperty("pastel");
      expect(PALETTE_CATEGORIES).toHaveProperty("accessible");
    });

    it("should have non-empty category labels", () => {
      Object.values(PALETTE_CATEGORIES).forEach((label) => {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe("utility functions", () => {
    it("should return colors for valid palette ID", () => {
      const colors = getPaletteColors("corporate");
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it("should return default colors for invalid palette ID", () => {
      const colors = getPaletteColors("nonexistent");
      expect(Array.isArray(colors)).toBe(true);
      expect(colors).toEqual(COLOR_PALETTES.corporate.colors);
    });

    it("should return all palettes", () => {
      const allPalettes = getAllPalettes();
      expect(Array.isArray(allPalettes)).toBe(true);
      expect(allPalettes.length).toBeGreaterThan(0);
      expect(allPalettes.length).toBe(Object.keys(COLOR_PALETTES).length);
    });

    it("should filter palettes by category", () => {
      const professionalPalettes = getPalettesByCategory("professional");
      expect(Array.isArray(professionalPalettes)).toBe(true);
      expect(professionalPalettes.length).toBeGreaterThan(0);

      professionalPalettes.forEach((palette) => {
        expect(palette.category).toBe("professional");
      });
    });

    it("should return accessible palettes", () => {
      const accessiblePalettes = getAccessiblePalettes();
      expect(Array.isArray(accessiblePalettes)).toBe(true);
      expect(accessiblePalettes.length).toBeGreaterThan(0);

      accessiblePalettes.forEach((palette) => {
        expect(palette.isAccessible).toBe(true);
      });
    });
  });

  describe("specific palettes", () => {
    it("should have corporate palette with professional colors", () => {
      const corporate = COLOR_PALETTES.corporate;
      expect(corporate.name).toBe("Corporate Blue");
      expect(corporate.category).toBe("professional");
      expect(corporate.isAccessible).toBe(true);
    });

    it("should have colorblind-friendly palettes", () => {
      const colorblindPalettes = [
        "deuteranopia",
        "protanopia",
        "tritanopia",
      ];

      colorblindPalettes.forEach((paletteId) => {
        const palette = COLOR_PALETTES[paletteId];
        expect(palette).toBeDefined();
        expect(palette.category).toBe("accessible");
        expect(palette.isAccessible).toBe(true);
      });
    });

    it("should have nature-inspired palettes", () => {
      const naturePalettes = ["forest", "ocean", "autumn"];

      naturePalettes.forEach((paletteId) => {
        const palette = COLOR_PALETTES[paletteId];
        expect(palette).toBeDefined();
        expect(palette.category).toBe("professional");
      });
    });

    it("should have pastel palettes with soft colors", () => {
      const pastelPalettes = ["pastel", "soft", "macarons"];

      pastelPalettes.forEach((paletteId) => {
        const palette = COLOR_PALETTES[paletteId];
        expect(palette).toBeDefined();
        expect(palette.category).toBe("pastel");
      });
    });
  });

  describe("color contrast and accessibility", () => {
    it("should have distinct colors within each palette", () => {
      Object.values(COLOR_PALETTES).forEach((palette) => {
        const uniqueColors = new Set(palette.colors);
        expect(uniqueColors.size).toBe(palette.colors.length);
      });
    });

    it("should mark accessible palettes correctly", () => {
      const accessibleCount = Object.values(COLOR_PALETTES).filter(
        (p) => p.isAccessible
      ).length;
      expect(accessibleCount).toBeGreaterThan(0);

      // At least 3 colorblind-friendly palettes
      const colorblindCount = Object.values(COLOR_PALETTES).filter(
        (p) => p.category === "accessible"
      ).length;
      expect(colorblindCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe("palette metadata", () => {
    it("should have descriptive names for all palettes", () => {
      Object.values(COLOR_PALETTES).forEach((palette) => {
        expect(palette.name.length).toBeGreaterThan(0);
        expect(palette.name.length).toBeLessThan(50);
      });
    });

    it("should have helpful descriptions for all palettes", () => {
      Object.values(COLOR_PALETTES).forEach((palette) => {
        expect(palette.description.length).toBeGreaterThan(0);
        expect(palette.description.length).toBeLessThan(200);
      });
    });

    it("should have unique palette IDs", () => {
      const ids = Object.values(COLOR_PALETTES).map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
