import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLOR_PALETTES, getPaletteColors } from "@/lib/colorPalettes";
import { Check } from "lucide-react";

interface ColorPaletteSelectorProps {
  currentPalette: string;
  onPaletteChange: (palette: string) => void;
}

export function ColorPaletteSelector({ currentPalette, onPaletteChange }: ColorPaletteSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Color Palette</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(COLOR_PALETTES).map(([key, palette]) => {
            const colors = getPaletteColors(key);
            const isSelected = currentPalette === key;

            return (
              <button
                key={key}
                onClick={() => onPaletteChange(key)}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  isSelected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Color swatches */}
                <div className="flex gap-1 mb-2">
                  {colors.slice(0, 4).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Palette name */}
                <div className="text-sm font-semibold text-gray-700 capitalize text-left">
                  {key.replace(/_/g, " ")}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Palette description */}
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
          <p>
            <strong>Current:</strong> {currentPalette.replace(/_/g, " ").toUpperCase()}
          </p>
          <p className="mt-2 text-xs">
            The selected palette will be applied to all charts and dashboard elements. Changes are saved automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
