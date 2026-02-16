import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  COLOR_PALETTES,
  PALETTE_CATEGORIES,
  type ColorPaletteConfig,
} from "@/lib/colorPalettes";
import { Check } from "lucide-react";

interface ColorPaletteSettingsProps {
  selectedPalette: string;
  onPaletteChange: (paletteId: string) => void;
}

export function ColorPaletteSettings({
  selectedPalette,
  onPaletteChange,
}: ColorPaletteSettingsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "professional"
  );

  const categories = Object.keys(PALETTE_CATEGORIES) as Array<
    keyof typeof PALETTE_CATEGORIES
  >;

  const getPalettesByCategory = (category: string) => {
    return Object.values(COLOR_PALETTES).filter((p) => p.category === category);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Chart Color Palettes</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Choose a color scheme for your dashboard charts. All charts will
          update instantly.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => {
          const palettes = getPalettesByCategory(category);
          const categoryLabel =
            PALETTE_CATEGORIES[category as keyof typeof PALETTE_CATEGORIES];

          return (
            <div key={category} className="space-y-3">
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category ? null : category
                  )
                }
                className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">{categoryLabel}</h3>
                <span className="text-sm text-gray-500">
                  {palettes.length} palettes
                </span>
              </button>

              {expandedCategory === category && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                  {palettes.map((palette) => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      isSelected={selectedPalette === palette.id}
                      onSelect={() => onPaletteChange(palette.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface PaletteCardProps {
  palette: ColorPaletteConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function PaletteCard({ palette, isSelected, onSelect }: PaletteCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">
            {palette.name}
          </h4>
          <p className="text-xs text-gray-600 mt-1">{palette.description}</p>
        </div>
        {isSelected && (
          <div className="ml-2 flex-shrink-0">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Color Swatches */}
      <div className="flex gap-2 mb-3">
        {palette.colors.map((color, index) => (
          <div
            key={index}
            className="flex-1 h-8 rounded border border-gray-300 shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Accessibility Badge */}
      {palette.isAccessible && (
        <div className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
          ✓ Colorblind-Friendly
        </div>
      )}
    </button>
  );
}
