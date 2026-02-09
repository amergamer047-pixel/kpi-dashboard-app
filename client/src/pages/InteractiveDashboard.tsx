import { useState, useMemo } from "react";
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

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
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

export default function InteractiveDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [viewMode, setViewMode] = useState<"quarterly" | "yearly">("quarterly");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Queries
  const { data: departments = [], refetch: refetchDepts } = trpc.departments.list.useQuery();
  const { data: categories = [], refetch: refetchCats } = trpc.categories.list.useQuery();
  const { data: indicators = [], refetch: refetchInds } = trpc.indicators.list.useQuery();
  const { data: monthlyData = [], refetch: refetchMonthly } = trpc.monthlyData.get.useQuery(
    { departmentId: selectedDepartmentId || 0, year: selectedYear, quarter: viewMode === "quarterly" ? selectedQuarter : 0 },
    { enabled: !!selectedDepartmentId }
  );
  const { data: patientCases = [] } = trpc.patientCases.listAll.useQuery();

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
  }, [monthlyData, categories, indicators, patientCases, selectedYear, selectedQuarter, viewMode, selectedDepartmentId]);

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
    return Object.entries(summaryStats).map(([name, value]) => ({
      name,
      value,
    }));
  }, [summaryStats]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Healthcare KPI Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor and track key performance indicators across departments</p>
            </div>
            <DepartmentWizard />
          </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div>
            <Label>Department</Label>
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
            <Label>Year</Label>
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
            <Label>View Mode</Label>
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
              <Label>Quarter</Label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{departments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{categories.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{indicators.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Cases ({viewMode === "quarterly" ? `Q${selectedQuarter}` : "Year"})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Object.values(summaryStats).reduce((a, b) => a + b, 0)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Type Selector & Category Filter */}
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex gap-2 flex-wrap">
                {(["bar", "pie", "line", "area"] as ChartType[]).map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "default" : "outline"}
                    onClick={() => setChartType(type)}
                    className="capitalize"
                  >
                    {type} Chart
                  </Button>
                ))}
              </div>
              
              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <Label>Filter by Category</Label>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartData.length > 0 && (
                <>
                  {/* Category Summary Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Summary ({chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartType === "bar" && (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {chartType === "pie" && (
                        <ResponsiveContainer width="100%" height={300}>
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
                              {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      {chartType === "line" && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {categories.map((c: any, i: number) => (
                              <Line key={c.id} type="monotone" dataKey={c.name} stroke={COLORS[i % COLORS.length]} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {chartType === "area" && (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {categories.map((c: any, i: number) => (
                              <Area key={c.id} type="monotone" dataKey={c.name} fill={COLORS[i % COLORS.length]} stroke={COLORS[i % COLORS.length]} />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Monthly Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {categories.map((c: any, i: number) => (
                            <Line key={c.id} type="monotone" dataKey={c.name} stroke={COLORS[i % COLORS.length]} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Indicator Comparison Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>
                        Indicator Comparison - {selectedCategory ? categories.find((c: any) => c.id === selectedCategory)?.name : "All Categories"} ({viewMode === "quarterly" ? `Q${selectedQuarter}` : "Year"})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const categoryId = selectedCategory;
                        const filteredIndicators = categoryId 
                          ? indicators.filter((ind: any) => ind.categoryId === categoryId)
                          : indicators;
                        
                        const indicatorData = filteredIndicators.map((ind: any) => {
                          const total = monthlyData
                            .filter((d: any) => d.indicatorId === ind.id)
                            .reduce((sum: number, d: any) => sum + parseFloat(d.value || "0"), 0);
                          return { name: ind.name, value: total };
                        });

                        if (indicatorData.length === 0) {
                          return <div className="text-center text-gray-500">No data available</div>;
                        }

                        return (
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={indicatorData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#10B981" />
                            </BarChart>
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

          {/* Data Entry Tab */}
          <TabsContent value="data" className="space-y-6">
            {selectedDepartmentId && (
              <div className="space-y-6">
                {categories.map((cat: any) => (
                  <Card key={cat.id}>
                    <CardHeader>
                      <CardTitle>{cat.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {indicators
                          .filter((ind: any) => ind.categoryId === cat.id)
                          .map((ind: any) => {
                            const monthlyValues: Record<number, string> = {};
                            monthlyData.forEach((d: any) => {
                              if (d.indicatorId === ind.id && !d.hospitalId) {
                                monthlyValues[d.month] = d.value || "0";
                              }
                            });

                            const requiresPatient = (cat.requiresPatientInfo as any) === 1;
                            return (
                              <div key={ind.id} className="border rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold">{ind.name}</h4>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                  {displayMonths.map((month) => (
                                    <div key={month} className="space-y-1">
                                      <label className="text-xs text-gray-600">{MONTHS[month - 1].slice(0, 3)}</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={monthlyValues[month] || ""}
                                        onChange={(e) => handleSaveValue(ind.id, month, e.target.value)}
                                        placeholder="0"
                                        className="text-center"
                                      />
                                    </div>
                                  ))}
                                </div>
                                {requiresPatient && (
                                  <div className="mt-4 pt-4 border-t">
                                    <h5 className="text-sm font-semibold mb-3">Patient Cases</h5>
                                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                                      {monthlyData
                                        .filter((d: any) => d.indicatorId === ind.id && d.hospitalId)
                                        .map((d: any, idx: number) => (
                                          <div key={idx} className="flex gap-2 text-sm p-2 bg-gray-50 rounded justify-between items-center">
                                            <div className="flex gap-2">
                                              <span className="font-medium">{MONTHS[d.month - 1].slice(0, 3)}:</span>
                                              <span className="text-gray-600">ID: {d.hospitalId}</span>
                                              <span className="text-gray-600">Name: {d.patientName}</span>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                // Delete patient case
                                                upsertDataMutation.mutate({
                                                  departmentId: selectedDepartmentId!,
                                                  indicatorId: ind.id,
                                                  year: selectedYear,
                                                  month: d.month,
                                                  value: "0",
                                                  hospitalId: "",
                                                  patientName: "",
                                                });
                                              }}
                                            >
                                              <Trash2 size={14} />
                                            </Button>
                                          </div>
                                        ))}
                                    </div>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" className="gap-2 w-full">
                                          <Plus size={14} /> Add Patient Case
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Add Patient Case - {ind.name}</DialogTitle>
                                        </DialogHeader>
                                        <form
                                          onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const month = parseInt(formData.get("patientMonth") as string);
                                            const hospitalId = formData.get("hospitalId") as string;
                                            const patientName = formData.get("patientName") as string;

                                            if (!month || !hospitalId || !patientName) {
                                              toast.error("All fields are required");
                                              return;
                                            }

                                            upsertDataMutation.mutate(
                                              {
                                                departmentId: selectedDepartmentId!,
                                                indicatorId: ind.id,
                                                year: selectedYear,
                                                month,
                                                value: "1",
                                                hospitalId,
                                                patientName,
                                              },
                                              {
                                                onSuccess: () => {
                                                  e.currentTarget.reset();
                                                },
                                              }
                                            );
                                          }}
                                          className="space-y-4"
                                        >
                                          <div>
                                            <Label htmlFor="patientMonth">Month</Label>
                                            <select name="patientMonth" required className="w-full border rounded px-3 py-2">
                                              <option value="">Select month</option>
                                              {displayMonths.map((m) => (
                                                <option key={m} value={m}>
                                                  {MONTHS[m - 1]}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <Label htmlFor="hospitalId">Hospital ID</Label>
                                            <Input id="hospitalId" name="hospitalId" placeholder="e.g., PT-2026-001" required />
                                          </div>
                                          <div>
                                            <Label htmlFor="patientName">Patient Name</Label>
                                            <Input id="patientName" name="patientName" placeholder="e.g., John Doe" required />
                                          </div>
                                          <Button type="submit" className="w-full">
                                            Add Patient Case
                                          </Button>
                                        </form>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!selectedDepartmentId && (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  Please select a department to enter data.
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
            {/* Categories Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus size={16} /> Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div>
                        <Label htmlFor="catName">Category Name</Label>
                        <Input id="catName" name="catName" placeholder="e.g., Mandatory" required />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="requiresPatient"
                          name="requiresPatient"
                          type="checkbox"
                          className="rounded"
                        />
                        <Label htmlFor="requiresPatient" className="mb-0">
                          Requires Patient Tracking
                        </Label>
                      </div>
                      <Button type="submit" className="w-full">
                        Create Category
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-semibold">{cat.name}</h4>
                        {cat.requiresPatientInfo === 1 && (
                          <p className="text-sm text-gray-600">Patient tracking enabled</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this category?")) {
                            deleteCatMutation.mutate({ id: cat.id });
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Indicators Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Indicators</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus size={16} /> Add Indicator
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Indicator</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddIndicator} className="space-y-4">
                      <div>
                        <Label htmlFor="indName">Indicator Name</Label>
                        <Input id="indName" name="indName" placeholder="e.g., Fall Incidents" required />
                      </div>
                      <div>
                        <Label htmlFor="categoryId">Category</Label>
                        <select name="categoryId" required className="w-full border rounded px-3 py-2">
                          <option value="">Select category</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Input id="unit" name="unit" placeholder="e.g., cases" />
                      </div>
                      <Button type="submit" className="w-full">
                        Create Indicator
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {indicators.map((ind: any) => {
                    const cat = categories.find((c: any) => c.id === ind.categoryId);
                    return (
                      <div key={ind.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h4 className="font-semibold">{ind.name}</h4>
                          <p className="text-sm text-gray-600">
                            {cat?.name} • {ind.unit}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this indicator?")) {
                              deleteIndMutation.mutate({ id: ind.id });
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Departments Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {departments.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: dept.color }}
                        />
                        <h4 className="font-semibold">{dept.name}</h4>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this department?")) {
                            deleteDeptMutation.mutate({ id: dept.id });
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
