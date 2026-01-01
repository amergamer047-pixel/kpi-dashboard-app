import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface KpiChartsProps {
  departmentId?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Indicator {
  id: number;
  categoryId: number;
  name: string;
  requiresPatientInfo: number | null;
}

interface PatientCase {
  indicatorId: number;
  month: number;
}

interface MonthlyData {
  indicatorId: number;
  month: number;
  value: string | null;
}

const MONTHS = [
  { value: 1, short: "Jan" },
  { value: 2, short: "Feb" },
  { value: 3, short: "Mar" },
  { value: 4, short: "Apr" },
  { value: 5, short: "May" },
  { value: 6, short: "Jun" },
  { value: 7, short: "Jul" },
  { value: 8, short: "Aug" },
  { value: 9, short: "Sep" },
  { value: 10, short: "Oct" },
  { value: 11, short: "Nov" },
  { value: 12, short: "Dec" },
];

const QUARTERS = [
  { value: 1, label: "Q1 (Jan-Mar)", months: [1, 2, 3] },
  { value: 2, label: "Q2 (Apr-Jun)", months: [4, 5, 6] },
  { value: 3, label: "Q3 (Jul-Sep)", months: [7, 8, 9] },
  { value: 4, label: "Q4 (Oct-Dec)", months: [10, 11, 12] },
];

const COLORS = ["#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

export function KpiCharts({ departmentId }: KpiChartsProps) {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);

  const { data: departments = [] } = trpc.departments.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: indicators = [] } = trpc.indicators.list.useQuery();

  // Get data for the selected department or all departments
  const selectedDeptId = departmentId || departments[0]?.id;
  
  const { data: monthlyData = [] } = trpc.monthlyData.get.useQuery(
    { departmentId: selectedDeptId!, year, quarter },
    { enabled: !!selectedDeptId }
  );
  
  const { data: patientCases = [] } = trpc.patientCases.listByDepartment.useQuery(
    { departmentId: selectedDeptId!, year, quarter },
    { enabled: !!selectedDeptId }
  );

  const quarterMonths = QUARTERS.find(q => q.value === quarter)?.months || [];

  // Prepare chart data
  const chartData = useMemo(() => {
    return quarterMonths.map(month => {
      const monthData: Record<string, number | string> = {
        month: MONTHS.find(m => m.value === month)?.short || "",
      };
      
      indicators.forEach((ind: Indicator) => {
        // Check if this indicator requires patient info
        const requiresPatient = ind.requiresPatientInfo;
        
        if (requiresPatient) {
          // Count patient cases
          const count = patientCases.filter(
            (c: PatientCase) => c.indicatorId === ind.id && c.month === month
          ).length;
          monthData[ind.name] = count;
        } else {
          // Get from monthly data
          const data = monthlyData.find(
            (d: MonthlyData) => d.indicatorId === ind.id && d.month === month
          );
          monthData[ind.name] = parseFloat(data?.value || "0");
        }
      });
      
      return monthData;
    });
  }, [quarterMonths, indicators, monthlyData, patientCases]);

  // Prepare category totals for pie chart
  const categoryTotals = useMemo(() => {
    return categories.map((cat: Category, index: number) => {
      const catIndicators = indicators.filter((ind: Indicator) => ind.categoryId === cat.id);
      let total = 0;
      
      catIndicators.forEach((ind: Indicator) => {
        const requiresPatient = ind.requiresPatientInfo;
        
        quarterMonths.forEach(month => {
          if (requiresPatient) {
            total += patientCases.filter(
              (c: PatientCase) => c.indicatorId === ind.id && c.month === month
            ).length;
          } else {
            const data = monthlyData.find(
              (d: MonthlyData) => d.indicatorId === ind.id && d.month === month
            );
            total += parseFloat(data?.value || "0");
          }
        });
      });
      
      return {
        name: cat.name,
        value: total,
        color: COLORS[index % COLORS.length],
      };
    }).filter(item => item.value > 0);
  }, [categories, indicators, quarterMonths, monthlyData, patientCases]);

  // Prepare indicator totals for bar chart
  const indicatorTotals = useMemo(() => {
    return indicators.map((ind: Indicator) => {
      const requiresPatient = ind.requiresPatientInfo;
      let total = 0;
      
      quarterMonths.forEach(month => {
        if (requiresPatient) {
          total += patientCases.filter(
            (c: PatientCase) => c.indicatorId === ind.id && c.month === month
          ).length;
        } else {
          const data = monthlyData.find(
            (d: MonthlyData) => d.indicatorId === ind.id && d.month === month
          );
          total += parseFloat(data?.value || "0");
        }
      });
      
      const category = categories.find((c: Category) => c.id === ind.categoryId);
      
      return {
        name: ind.name,
        value: total,
        category: category?.name || "Unknown",
      };
    }).filter(item => item.value > 0);
  }, [indicators, categories, quarterMonths, monthlyData, patientCases]);

  if (departments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Create a department and add KPI data to see charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">KPI Analytics</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Year:</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Quarter:</Label>
                <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q.value} value={q.value.toString()}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend - Q{quarter} {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 && indicators.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {indicators.slice(0, 5).map((ind: Indicator, index: number) => (
                    <Line
                      key={ind.id}
                      type="monotone"
                      dataKey={ind.name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution - Q{quarter} {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTotals.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Indicator Totals Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">KPI Totals by Indicator - Q{quarter} {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {indicatorTotals.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={indicatorTotals} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
