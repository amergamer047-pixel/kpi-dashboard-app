import { useState, useMemo } from "react";
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
  Activity,
  Users,
  Stethoscope,
  TrendingUp,
  Building2,
  Layers,
} from "lucide-react";

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

const QUARTERS = [
  { value: 1, label: "Q1 (Jan-Mar)", months: [1, 2, 3] },
  { value: 2, label: "Q2 (Apr-Jun)", months: [4, 5, 6] },
  { value: 3, label: "Q3 (Jul-Sep)", months: [7, 8, 9] },
  { value: 4, label: "Q4 (Oct-Dec)", months: [10, 11, 12] },
];

export function DashboardSummary() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);

  const { data: departments = [] } = trpc.departments.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: indicators = [] } = trpc.indicators.list.useQuery();

  // Get the first department's data as a sample (for summary)
  const firstDeptId = departments[0]?.id;
  
  const { data: monthlyData = [] } = trpc.monthlyData.get.useQuery(
    { departmentId: firstDeptId!, year, quarter },
    { enabled: !!firstDeptId }
  );
  
  const { data: patientCases = [] } = trpc.patientCases.listByDepartment.useQuery(
    { departmentId: firstDeptId!, year, quarter },
    { enabled: !!firstDeptId }
  );

  const quarterMonths = QUARTERS.find(q => q.value === quarter)?.months || [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    let totalCases = 0;
    let totalPatientCases = patientCases.length;
    const categoryTotals: Record<string, number> = {};

    // Initialize category totals
    categories.forEach((cat: Category) => {
      categoryTotals[cat.name] = 0;
    });

    // Count monthly data values
    monthlyData.forEach((d: MonthlyData) => {
      const value = parseFloat(d.value || "0");
      totalCases += value;
      
      // Find the indicator's category
      const indicator = indicators.find((ind: Indicator) => ind.id === d.indicatorId);
      if (indicator) {
        const category = categories.find((cat: Category) => cat.id === indicator.categoryId);
        if (category) {
          categoryTotals[category.name] += value;
        }
      }
    });

    // Add patient cases to category totals
    patientCases.forEach((pc: PatientCase) => {
      const indicator = indicators.find((ind: Indicator) => ind.id === pc.indicatorId);
      if (indicator) {
        const category = categories.find((cat: Category) => cat.id === indicator.categoryId);
        if (category) {
          categoryTotals[category.name] += 1;
        }
      }
    });

    return {
      totalDepartments: departments.length,
      totalIndicators: indicators.length,
      totalCategories: categories.length,
      totalCases: totalCases + totalPatientCases,
      totalPatientCases,
      categoryTotals,
    };
  }, [monthlyData, patientCases, categories, indicators, departments]);

  const statCards = [
    {
      title: "Departments",
      value: summaryStats.totalDepartments,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "KPI Categories",
      value: summaryStats.totalCategories,
      icon: Layers,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "KPI Indicators",
      value: summaryStats.totalIndicators,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Cases (Q" + quarter + ")",
      value: summaryStats.totalCases,
      icon: Stethoscope,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Patient Cases",
      value: summaryStats.totalPatientCases,
      icon: Users,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Dashboard Summary</CardTitle>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-3 md:pt-6">
              <div className="flex items-center gap-2 md:gap-4">
                <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className="h-4 md:h-6 w-4 md:w-6" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Category Breakdown - Q{quarter} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(summaryStats.categoryTotals).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No categories created yet. Add KPI categories to see breakdown.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {Object.entries(summaryStats.categoryTotals).map(([category, total]) => (
                <div
                  key={category}
                  className="p-3 md:p-4 border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-base font-medium">{category}</span>
                    <span className="text-lg md:text-2xl font-bold">{total}</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Total cases this quarter</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No departments created yet. Add a department to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept: { id: number; name: string; description: string | null }) => (
                <div
                  key={dept.id}
                  className="p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{dept.name}</h4>
                      {dept.description && (
                        <p className="text-sm text-muted-foreground">{dept.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
