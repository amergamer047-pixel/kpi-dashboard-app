import {
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

interface AdvancedChartsProps {
  data: any[];
  type: "scatter" | "radar" | "gauge" | "heatmap" | "waterfall" | "funnel";
  colors: string[];
  title?: string;
}

export function ScatterPlotChart({ data, colors }: { data: any[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" />
        <YAxis type="number" dataKey="y" />
        <Tooltip />
        <Legend />
        <Scatter name="Data Points" data={data} fill={colors[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function RadarChartCustom({ data, colors }: { data: any[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis />
        <Radar name="Performance" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
        <Tooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function GaugeChart({ value, max = 100, colors }: { value: number; max?: number; colors: string[] }) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-80">
      <svg width="200" height="200" className="transform -rotate-90">
        <circle cx="100" cy="100" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="100"
          cy="100"
          r="45"
          fill="none"
          stroke={colors[0]}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        <text x="100" y="100" textAnchor="middle" dy="0.3em" className="text-2xl font-bold" fill="currentColor">
          {Math.round(percentage)}%
        </text>
      </svg>
      <p className="mt-4 text-gray-600">
        {value} / {max}
      </p>
    </div>
  );
}

export function HeatmapChart({ data, colors }: { data: any[]; colors: string[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      {data.map((item, idx) => {
        const intensity = item.value / maxValue;
        const colorIndex = Math.floor(intensity * (colors.length - 1));
        return (
          <div
            key={idx}
            className="p-4 rounded text-white text-center text-sm font-semibold"
            style={{ backgroundColor: colors[colorIndex] }}
          >
            <div>{item.name}</div>
            <div className="text-xs">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}

export function WaterfallChart({ data, colors }: { data: any[]; colors: string[] }) {
  let runningTotal = 0;
  const chartData = data.map((item) => {
    const start = runningTotal;
    const end = runningTotal + item.value;
    runningTotal = end;
    return {
      name: item.name,
      value: item.value,
      start,
      end,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" stackId="a" fill={colors[0]} name="Change" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({ data, colors }: { data: any[]; colors: string[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-2 p-4">
      {data.map((item, idx) => {
        const percentage = (item.value / maxValue) * 100;
        return (
          <div key={idx} className="flex flex-col">
            <div className="text-sm font-semibold text-gray-700">{item.name}</div>
            <div className="relative h-8 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[idx % colors.length],
                }}
              />
            </div>
            <div className="text-xs text-gray-600">{item.value}</div>
          </div>
        );
      })}
    </div>
  );
}

export function AdvancedCharts({ data, type, colors, title }: AdvancedChartsProps) {
  switch (type) {
    case "scatter":
      return <ScatterPlotChart data={data} colors={colors} />;
    case "radar":
      return <RadarChartCustom data={data} colors={colors} />;
    case "gauge":
      return <GaugeChart value={data[0]?.value || 50} max={data[0]?.max || 100} colors={colors} />;
    case "heatmap":
      return <HeatmapChart data={data} colors={colors} />;
    case "waterfall":
      return <WaterfallChart data={data} colors={colors} />;
    case "funnel":
      return <FunnelChart data={data} colors={colors} />;
    default:
      return null;
  }
}
