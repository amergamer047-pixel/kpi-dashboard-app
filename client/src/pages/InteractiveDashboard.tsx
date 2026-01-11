import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
} from "recharts";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

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

export default function InteractiveDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  // Queries
  const { data: departments = [], refetch: refetchDepts } = trpc.departments.list.useQuery();
  const { data: categories = [], refetch: refetchCats } = trpc.categories.list.useQuery();
  const { data: indicators = [], refetch: refetchInds } = trpc.indicators.list.useQuery();
  const { data: monthlyData = [], refetch: refetchMonthly } = trpc.monthlyData.get.useQuery(
    { departmentId: selectedDepartmentId || 0, year: selectedYear, quarter: selectedQuarter },
    { enabled: !!selectedDepartmentId }
  );

  // Mutations
  const createDeptMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Department created!");
      refetchDepts();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDeptMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Department deleted!");
      refetchDepts();
    },
    onError: (err) => toast.error(err.message),
  });

  const createCatMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created!");
      refetchCats();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCatMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted!");
      refetchCats();
    },
    onError: (err) => toast.error(err.message),
  });

  const createIndMutation = trpc.indicators.create.useMutation({
    onSuccess: () => {
      toast.success("Indicator created!");
      refetchInds();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteIndMutation = trpc.indicators.delete.useMutation({
    onSuccess: () => {
      toast.success("Indicator deleted!");
      refetchInds();
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertDataMutation = trpc.monthlyData.upsert.useMutation({
    onSuccess: () => {
      toast.success("Data saved!");
      refetchMonthly();
    },
    onError: (err) => toast.error(err.message),
  });

  // Form handlers
  const handleAddDepartment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("deptName") as string;
    const color = formData.get("deptColor") as string;

    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }

    createDeptMutation.mutate({ name, color: color || "#3B82F6" });
    e.currentTarget.reset();
  };

  const handleAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("catName") as string;
    const requiresPatientInfo = (formData.get("requiresPatient") as string) === "on" ? 1 : 0;

    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    createCatMutation.mutate({ name, requiresPatientInfo: requiresPatientInfo === 1 });
    e.currentTarget.reset();
  };

  const handleAddIndicator = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("indName") as string;
    const categoryId = parseInt(formData.get("categoryId") as string);
    const unit = (formData.get("unit") as string) || "cases";
    const requiresPatientInfo = (formData.get("requiresPatient") as string) === "on" ? 1 : 0;

    if (!name.trim() || !categoryId) {
      toast.error("Indicator name and category are required");
      return;
    }

    createIndMutation.mutate({ name, categoryId, unit, requiresPatientInfo: requiresPatientInfo === 1 });
    e.currentTarget.reset();
  };

  const handleSaveValue = (indicatorId: number, month: number, value: string) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department");
      return;
    }

    const numValue = parseFloat(value) || 0;
    upsertDataMutation.mutate({
      departmentId: selectedDepartmentId,
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
    return stats;
  }, [monthlyData, categories, indicators]);

  const chartData = useMemo(() => {
    return Object.entries(summaryStats).map(([name, value]) => ({
      name,
      value,
    }));
  }, [summaryStats]);

  if (!selectedDepartmentId && departments.length > 0) {
    setSelectedDepartmentId(departments[0].id);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Healthcare KPI Dashboard</h1>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} /> Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Department</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDepartment} className="space-y-4">
                  <div>
                    <Label htmlFor="deptName">Department Name</Label>
                    <Input id="deptName" name="deptName" placeholder="e.g., Male Ward" required />
                  </div>
                  <div>
                    <Label htmlFor="deptColor">Color</Label>
                    <Input id="deptColor" name="deptColor" type="color" defaultValue="#3B82F6" />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Department
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Department & Quarter Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Department</Label>
            <Select
              value={selectedDepartmentId?.toString() || ""}
              onValueChange={(v) => setSelectedDepartmentId(parseInt(v))}
            >
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
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Entry</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{departments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{indicators.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Cases (Q{selectedQuarter})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(summaryStats).reduce((a: number, b: number) => a + b, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartData.length > 0 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Breakdown (Bar Chart)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution (Pie Chart)</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {chartData.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-gray-500">No data to display. Add values in the Data Entry tab.</p>
              </Card>
            )}
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
                              if (d.indicatorId === ind.id) {
                                monthlyValues[d.month] = d.value || "0";
                              }
                            });

                            return (
                              <div key={ind.id} className="border rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold">{ind.name}</h4>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                  {quarterMonths.map((month) => (
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
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                          className="w-4 h-4"
                          defaultChecked={false}
                        />
                        <Label htmlFor="requiresPatient">Requires Patient Tracking</Label>
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
                        <p className="font-medium">{cat.name}</p>
                        {cat.requiresPatientInfo && <p className="text-xs text-gray-500">Requires patient tracking</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCatMutation.mutate({ id: cat.id })}
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
                        <Select name="categoryId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c: any) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Input id="unit" name="unit" placeholder="e.g., cases" defaultValue="cases" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="requiresPatient"
                          name="requiresPatient"
                          type="checkbox"
                          className="w-4 h-4"
                          defaultChecked={false}
                        />
                        <Label htmlFor="requiresPatient">Requires Patient Tracking</Label>
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
                          <p className="font-medium">{ind.name}</p>
                          <p className="text-xs text-gray-500">
                            {cat?.name} • {ind.unit}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIndMutation.mutate({ id: ind.id })}
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
              <CardHeader>
                <CardTitle>Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {departments.map((dept: any) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: dept.color || "#3B82F6" }}
                        />
                        <p className="font-medium">{dept.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDeptMutation.mutate({ id: dept.id })}
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
  );
}
