import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Download, RotateCcw } from "lucide-react";

interface ChartCustomizerProps {
  onColorsChange: (colors: string[]) => void;
  onExport: () => void;
  currentColors: string[];
}

const PRESET_PALETTES = {
  default: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"],
  pastel: ["#FFB3BA", "#FFCCCB", "#FFFFBA", "#BAE1FF", "#E0BBE4"],
  vibrant: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC", "#3A86FF"],
  ocean: ["#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8", "#03045E"],
  sunset: ["#FF6B35", "#F7931E", "#FDB833", "#F37335", "#C1272D"],
  forest: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#B7E4C7"],
  professional: ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD"],
};

export function ChartCustomizer({
  onColorsChange,
  onExport,
  currentColors,
}: ChartCustomizerProps) {
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof PRESET_PALETTES>("default");

  const handlePaletteSelect = (palette: keyof typeof PRESET_PALETTES) => {
    setSelectedPalette(palette);
    onColorsChange(PRESET_PALETTES[palette]);
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...currentColors];
    newColors[index] = color;
    onColorsChange(newColors);
  };

  const handleReset = () => {
    onColorsChange(PRESET_PALETTES.default);
    setSelectedPalette("default");
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Chart Customization</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Palettes */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Preset Color Palettes</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PRESET_PALETTES).map(([name, colors]) => (
              <button
                key={name}
                onClick={() => handlePaletteSelect(name as keyof typeof PRESET_PALETTES)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPalette === name
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex gap-1 mb-1">
                  {colors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium capitalize text-gray-700">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color Picker */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Custom Colors</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {currentColors.map((color, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border rounded font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={onExport}
            className="gap-2 flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Download className="h-4 w-4" />
            Export Chart as Image
          </Button>
        </div>

        {/* Color Preview */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-sm font-semibold">Color Preview</Label>
          <div className="flex gap-2 flex-wrap">
            {currentColors.map((color, index) => (
              <div
                key={index}
                className="flex-1 min-w-[60px] h-12 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
