import { useEffect, useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { DepartmentWizard } from "@/components/DepartmentWizard";
import { PatientRegistry } from "@/components/PatientRegistry";
import UnifiedDataEntry from "@/components/UnifiedDataEntry";
import SettingsPage from "@/pages/SettingsPage";

import { COLOR_PALETTES, getPaletteColors } from "@/lib/colorPalettes";
import { buildColorMapping, getStoredColorMapping, saveColorMapping, resetColorMappingForPalette } from "@/lib/colorMapping";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ChartType = "bar" | "pie" | "line" | "area";

interface InteractiveDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export default function InteractiveDashboard({ userName, onLogout }: InteractiveDashboardProps = {}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [viewMode, setViewMode] = useState<"quarterly" | "yearly">("quarterly");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [colorPalette, setColorPalette] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kpiDashboardColorPalette") || "corporate";
    }
    return "corporate";
  });
  const [colorMapping, setColorMapping] = useState<Record<string, string>>(() => getStoredColorMapping());
  const currentColors = getPaletteColors(colorPalette);

  // Queries
  const { data: departments = [], refetch: refetchDepts } = trpc.departments.list.useQuery();
  const { data: categories = [], refetch: refetchCats } = trpc.categories.list.useQuery(
    selectedDepartmentId ? { departmentId: selectedDepartmentId } : undefined,
    { enabled: !!selectedDepartmentId }
  );
  const { data: indicators = [], refetch: refetchInds } = trpc.indicators.list.useQuery(
    selectedDepartmentId ? { departmentId: selectedDepartmentId } : undefined,
    { enabled: !!selectedDepartmentId }
  );
  const { data: monthlyData = [], refetch: refetchMonthly } = trpc.monthlyData.get.useQuery(
    { departmentId: selectedDepartmentId || 0, year: selectedYear, quarter: viewMode === "quarterly" ? selectedQuarter : 0 },
    { enabled: !!selectedDepartmentId }
  );
  const { data: patientCases = [] } = trpc.patientCases.listByDepartment.useQuery(
    { departmentId: selectedDepartmentId || 0, year: selectedYear },
    { enabled: !!selectedDepartmentId }
  );

  // Listen for color palette changes from Settings page
  useEffect(() => {
    const handleColorPaletteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newPaletteId = customEvent.detail.paletteId;
      setColorPalette(newPaletteId);
      
      // Reset color mapping for both indicators and categories
      let newMapping: Record<string, string> = {};
      
      const indMapping = resetColorMappingForPalette(
        colorMapping,
        newPaletteId,
        indicators,
        'indicator'
      );
      newMapping = { ...newMapping, ...indMapping };
      
      const catMapping = resetColorMappingForPalette(
        colorMapping,
        newPaletteId,
        categories,
        'category'
      );
      newMapping = { ...newMapping, ...catMapping };
      
      setColorMapping(newMapping);
      saveColorMapping(newMapping);
    };

    window.addEventListener("colorPaletteChanged", handleColorPaletteChange);
    return () => {
      window.removeEventListener("colorPaletteChanged", handleColorPaletteChange);
    };
  }, [indicators, colorMapping]);

  // Build color mapping when indicators and categories change
  useEffect(() => {
    if (indicators.length > 0 || categories.length > 0) {
      let newMapping = { ...colorMapping };
      
      if (indicators.length > 0) {
        const { mapping: indicatorMapping } = buildColorMapping(indicators, 'indicator', colorPalette, colorMapping);
        newMapping = { ...newMapping, ...indicatorMapping };
      }
      
      if (categories.length > 0) {
        const { mapping: categoryMapping } = buildColorMapping(categories, 'category', colorPalette, colorMapping);
        newMapping = { ...newMapping, ...categoryMapping };
      }
      
      setColorMapping(newMapping);
      saveColorMapping(newMapping);
    }
  }, [indicators, categories, colorPalette]);

  // Mutations
  const createDeptMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      refetchDepts();
      toast.success("Department created");
    },
  });

  const deleteDeptMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      refetchDepts();
      setSelectedDepartmentId(null);
      toast.success("Department deleted");
    },
  });

  const createCatMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      refetchCats();
      toast.success("Category created");
    },
  });

  const deleteCatMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      refetchCats();
      toast.success("Category deleted");
    },
  });

  const createIndMutation = trpc.indicators.create.useMutation({
    onSuccess: () => {
      refetchInds();
      toast.success("Indicator created");
    },
  });

  const deleteIndMutation = trpc.indicators.delete.useMutation({
    onSuccess: () => {
      refetchInds();
      toast.success("Indicator deleted");
    },
  });

  const upsertDataMutation = trpc.monthlyData.upsert.useMutation({
    onSuccess: () => {
      refetchMonthly();
      toast.success("Data saved");
    },
  });

  // Handlers
  const handleAddDepartment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("deptName") as string;
    const color = formData.get("deptColor") as string;

    if (!name || !color) {
      toast.error("Name and color are required");
      return;
    }

    createDeptMutation.mutate({ name, color });
    e.currentTarget.reset();
  };

  const handleAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("catName") as string;
    const requiresPatient = (formData.get("requiresPatient") as string) === "on" ? 1 : 0;

    if (!name) {
      toast.error("Category name is required");
      return;
    }

    createCatMutation.mutate({ name, requiresPatientInfo: requiresPatient as any });
    e.currentTarget.reset();
  };

  const handleAddIndicator = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("indName") as string;
    const categoryId = parseInt(formData.get("categoryId") as string);
    const unit = formData.get("unit") as string;

    if (!name || !categoryId) {
      toast.error("Name and category are required");
      return;
    }

    createIndMutation.mutate({ name, categoryId, unit: unit || "cases" });
    e.currentTarget.reset();
  };

  const handleSaveValue = (indicatorId: number, month: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    upsertDataMutation.mutate({
      departmentId: selectedDepartmentId!,
      indicatorId,
      year: selectedYear,
      month,
      value: numValue.toString(),
    });
  };

  // Calculate summary
  const quarterMonths = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9],
    4: [10, 11, 12],
  }[selectedQuarter] || [];

  const yearMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const displayMonths = viewMode === "yearly" ? yearMonths : quarterMonths;

  const summaryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    monthlyData.forEach((d: any) => {
      const catName = categories.find((c: any) => {
        const ind = indicators.find((i: any) => i.id === d.indicatorId);
        return ind && ind.categoryId === c.id;
      })?.name;
      if (catName) {
        stats[catName] = (stats[catName] || 0) + parseFloat(d.value || "0");
      }
    });
    
    patientCases.forEach((pc: any) => {
      const indicator = indicators.find((i: any) => i.id === pc.indicatorId);
      if (indicator && indicator.requiresPatientInfo && pc.departmentId === selectedDepartmentId) {
        const catName = categories.find((c: any) => c.id === indicator.categoryId)?.name;
        if (catName && pc.year === selectedYear) {
          const isInQuarter = viewMode === "yearly" || (viewMode === "quarterly" && pc.month >= (selectedQuarter - 1) * 3 + 1 && pc.month <= selectedQuarter * 3);
          if (isInQuarter) {
            stats[catName] = (stats[catName] || 0) + 1;
          }
        }
      }
    });
    
    return stats;
  }, [monthlyData, categories, indicators, patientCases, selectedYear, selectedQuarter, viewMode, selectedDepartmentId, colorMapping, currentColors]);

  const monthlyChartData = useMemo(() => {
    const data: Record<number, Record<string, number>> = {};
    displayMonths.forEach((m) => {
      data[m] = {};
      categories.forEach((c: any) => {
        data[m][c.name] = 0;
      });
    });

    monthlyData.forEach((d: any) => {
      const catName = categories.find((c: any) => {
        const ind = indicators.find((i: any) => i.id === d.indicatorId);
        return ind && ind.categoryId === c.id;
      })?.name;
      if (catName && data[d.month]) {
        data[d.month][catName] = (data[d.month][catName] || 0) + parseFloat(d.value || "0");
      }
    });

    patientCases.forEach((pc: any) => {
      if (pc.departmentId === selectedDepartmentId && pc.year === selectedYear && displayMonths.includes(pc.month)) {
        const indicator = indicators.find((i: any) => i.id === pc.indicatorId);
        if (indicator && indicator.requiresPatientInfo) {
          const catName = categories.find((c: any) => c.id === indicator.categoryId)?.name;
          if (catName && data[pc.month]) {
            data[pc.month][catName] = (data[pc.month][catName] || 0) + 1;
          }
        }
      }
    });

    return displayMonths.map((m) => ({
      month: MONTHS[m - 1].slice(0, 3),
      ...data[m],
    }));
  }, [monthlyData, categories, indicators, displayMonths, patientCases]);

  const chartData = useMemo(() => {
    return Object.entries(summaryStats).map(([name, value]) => {
      const category = categories.find((c: any) => c.name === name);
      const colorKey = category ? `category-${category.id}` : '';
      const categoryColor = colorKey && colorMapping[colorKey] ? colorMapping[colorKey] : currentColors[Object.keys(summaryStats).indexOf(name) % currentColors.length];
      
      return {
        name,
        value,
        color: categoryColor,
      };
    });
  }, [summaryStats, categories, colorMapping, currentColors]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-full sm:flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Healthcare KPI Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Monitor and track key performance indicators across departments</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-start sm:items-center">
              {userName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900">{userName}</span>
                    <span className="text-xs text-gray-500">Editing</span>
                  </div>
                </div>
              )}
              {onLogout && (
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Logout
                </Button>
              )}
              <DepartmentWizard />
            </div>
          </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
          <div>
            <Label className="text-xs sm:text-sm">Department</Label>
            <Select value={selectedDepartmentId?.toString() || ""} onValueChange={(v) => setSelectedDepartmentId(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d: any) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs sm:text-sm">Year</Label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs sm:text-sm">View Mode</Label>
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {viewMode === "quarterly" && (
            <div>
              <Label className="text-xs sm:text-sm">Quarter</Label>
              <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((q) => (
                    <SelectItem key={q} value={q.toString()}>
                      Q{q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Entry</TabsTrigger>
            <TabsTrigger value="registry">Patient Registry</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <Card className="p-2 sm:p-4">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Departments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">{departments.length}</div>
                </CardContent>
              </Card>
              <Card className="p-2 sm:p-4">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">{categories.length}</div>
                </CardContent>
              </Card>
              <Card className="p-2 sm:p-4">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Indicators</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">{indicators.length}</div>
                </CardContent>
              </Card>
              <Card className="p-2 sm:p-4">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Cases ({viewMode === "quarterly" ? `Q${selectedQuarter}` : "Year"})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">{Object.values(summaryStats).reduce((a, b) => a + b, 0)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Type Selector & Customization */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap items-start sm:items-center">
              <div className="flex gap-1 sm:gap-2 flex-wrap w-full sm:w-auto">
                {(["bar", "pie", "line", "area"] as ChartType[]).map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "default" : "outline"}
                    onClick={() => setChartType(type)}
                    className="capitalize text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3"
                    size="sm"
                  >
                    {type} Chart
                  </Button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Label className="text-xs sm:text-sm">Filter by Category</Label>
                <Select 
                  value={selectedCategory?.toString() || "all"} 
                  onValueChange={(v) => setSelectedCategory(v === "all" ? null : parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {chartData.length > 0 && (
                <>
                  {/* Category Summary Chart */}
                  <Card className="w-full">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-sm sm:text-base md:text-lg">Category Summary ({chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4">
                      {chartType === "bar" && (
                        <ResponsiveContainer width="100%" height={Math.max(250, window.innerHeight * 0.3)}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={currentColors[0]}>
                              {chartData.map((item: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={item.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {chartType === "pie" && (
                        <ResponsiveContainer width="100%" height={Math.max(250, window.innerHeight * 0.3)}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.map((item: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={item.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      {chartType === "line" && (
                        <ResponsiveContainer width="100%" height={Math.max(250, window.innerHeight * 0.3)}>
                          <LineChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {categories.map((c: any) => {
                              const colorKey = `category-${c.id}`;
                              const categoryColor = colorMapping[colorKey] || currentColors[categories.indexOf(c) % currentColors.length];
                              return (
                                <Line key={c.id} type="monotone" dataKey={c.name} stroke={categoryColor} />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {chartType === "area" && (
                        <ResponsiveContainer width="100%" height={Math.max(250, window.innerHeight * 0.3)}>
                          <AreaChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {categories.map((c: any) => {
                              const colorKey = `category-${c.id}`;
                              const categoryColor = colorMapping[colorKey] || currentColors[categories.indexOf(c) % currentColors.length];
                              return (
                                <Area key={c.id} type="monotone" dataKey={c.name} fill={categoryColor} stroke={categoryColor} />
                              );
                            })}
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Monthly Trend */}
                  <Card className="w-full">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-sm sm:text-base md:text-lg">Monthly Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4">
                      <ResponsiveContainer width="100%" height={Math.max(250, window.innerHeight * 0.3)}>
                        <LineChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {categories.map((c: any) => {
                            const colorKey = `category-${c.id}`;
                            const categoryColor = colorMapping[colorKey] || currentColors[categories.indexOf(c) % currentColors.length];
                            return (
                              <Line key={c.id} type="monotone" dataKey={c.name} stroke={categoryColor} />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Indicator Comparison Chart */}
                  <Card className="w-full lg:col-span-2">
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-sm sm:text-base md:text-lg">
                        Indicator Comparison - {selectedCategory ? categories.find((c: any) => c.id === selectedCategory)?.name : "All Categories"} ({viewMode === "quarterly" ? `Q${selectedQuarter}` : "Year"})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4 overflow-x-auto">
                      {(() => {
                        const categoryId = selectedCategory;
                        const filteredIndicators = categoryId 
                          ? indicators.filter((ind: any) => ind.categoryId === categoryId)
                          : indicators;
                        
                        const indicatorData = filteredIndicators.map((ind: any, index: number) => {
                          // Count from monthlyData
                          const monthlyTotal = monthlyData
                            .filter((d: any) => d.indicatorId === ind.id)
                            .reduce((sum: number, d: any) => sum + parseFloat(d.value || "0"), 0);
                          
                          // Count from patientCases
                          const patientTotal = patientCases
                            .filter((pc: any) => {
                              if (pc.indicatorId !== ind.id) return false;
                              if (pc.departmentId !== selectedDepartmentId) return false;
                              if (pc.year !== selectedYear) return false;
                              if (viewMode === "quarterly") {
                                return pc.month >= (selectedQuarter - 1) * 3 + 1 && pc.month <= selectedQuarter * 3;
                              }
                              return true;
                            }).length;
                          
                          // Get persistent color for this indicator
                          const colorKey = `indicator-${ind.id}`;
                          const indicatorColor = colorMapping[colorKey] || currentColors[index % currentColors.length];
                          
                          return { name: ind.name, value: monthlyTotal + patientTotal, color: indicatorColor };
                        });

                        if (indicatorData.length === 0) {
                          return <div className="text-center text-gray-500">No data available</div>;
                        }

                        if (chartType === "bar") {
                          return (
                            <ResponsiveContainer width="100%" height={Math.max(300, window.innerHeight * 0.4)}>
                              <BarChart data={indicatorData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill={currentColors[0]}>
                                  {indicatorData.map((item: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={item.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        }
                        if (chartType === "pie") {
                          return (
                            <ResponsiveContainer width="100%" height={Math.max(300, window.innerHeight * 0.4)}>
                              <PieChart>
                                <Pie data={indicatorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                  {indicatorData.map((item: any, i: number) => (
                                    <Cell key={`cell-${i}`} fill={item.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          );
                        }
                        if (chartType === "line") {
                          return (
                            <ResponsiveContainer width="100%" height={Math.max(300, window.innerHeight * 0.4)}>
                              <LineChart data={indicatorData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                {indicatorData.map((item: any, index: number) => (
                                  <Line key={`line-${index}`} type="monotone" dataKey="value" stroke={item.color} />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          );
                        }
                        return (
                          <ResponsiveContainer width="100%" height={Math.max(300, window.innerHeight * 0.4)}>
                            <AreaChart data={indicatorData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip />
                              {indicatorData.map((item: any, index: number) => (
                                <Area key={`area-${index}`} type="monotone" dataKey="value" fill={item.color} stroke={item.color} />
                              ))}
                            </AreaChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </>
              )}
              {chartData.length === 0 && (
                <Card className="lg:col-span-2">
                  <CardContent className="pt-6 text-center text-gray-500">
                    No data to display. Add values in the Data Entry tab.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Data Entry Tab - Unified Patient Data Entry */}
          <TabsContent value="data" className="space-y-6">
            <UnifiedDataEntry
              selectedDepartmentId={selectedDepartmentId}
              selectedYear={selectedYear}
              selectedQuarter={selectedQuarter}
            />
            {!selectedDepartmentId && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Please select a department to begin data entry</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Patient Registry Tab */}
          <TabsContent value="registry" className="space-y-6">
            <PatientRegistry />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <SettingsPage />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6 px-4 md:px-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            <p>© 2026 Thuraiya Almutaani. All rights reserved.</p>
            <p className="text-gray-500 mt-1">Healthcare KPI Dashboard - Professional Performance Tracking</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Version 1.0 | Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
