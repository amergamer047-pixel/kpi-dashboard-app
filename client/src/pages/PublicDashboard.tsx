import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { RefreshCw, Users, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Activity {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  entityId: number;
  userId: string;
  userName: string;
  timestamp: string;
}

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function PublicDashboard() {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch real data from database using public procedures (no auth required)
  const { data: departments = [] } = trpc.public.departments.useQuery();
  const { data: categories = [] } = trpc.public.categories.useQuery();
  const { data: indicators = [] } = trpc.public.indicators.useQuery();
  const { data: monthlyData = [] } = trpc.public.monthlyData.useQuery();

  // Load activities from localStorage - run once on mount
  useEffect(() => {
    const loadActivities = () => {
      try {
        const stored = localStorage.getItem("kpi-activities");
        if (stored) {
          const activities = JSON.parse(stored).slice(-10); // Last 10 activities
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error("Error loading activities:", error);
      }
    };

    loadActivities();

    // Listen for activity updates
    const handleActivity = (event: Event) => {
      loadActivities();
    };

    window.addEventListener("kpi-activity", handleActivity);

    return () => {
      window.removeEventListener("kpi-activity", handleActivity);
    };
  }, []);

  // Auto-refresh effect (separate from activity loading)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Generate chart data from monthly data
  useEffect(() => {
    if (monthlyData && monthlyData.length > 0) {
      try {
        // Group by month
        const grouped: Record<string, number> = {};
        monthlyData.forEach((item: any) => {
          // Handle both numeric and string month values
          let month = "Unknown";
          if (item.month) {
            try {
              const monthNum = typeof item.month === "string" ? parseInt(item.month) : item.month;
              const monthDate = new Date(2026, monthNum - 1, 1);
              month = monthDate.toLocaleString("default", { month: "short" });
            } catch (e) {
              month = `Month ${item.month}`;
            }
          }
          grouped[month] = (grouped[month] || 0) + (parseFloat(item.value) || 0);
        });

        const data = Object.entries(grouped).map(([month, value]) => ({
          name: month,
          value: Math.round(value * 100) / 100,
        }));

        setChartData(data.length > 0 ? data : getDefaultChartData());
      } catch (error) {
        console.error("Error processing chart data:", error);
        setChartData(getDefaultChartData());
      }
    } else {
      setChartData(getDefaultChartData());
    }
  }, [monthlyData?.length]); // Use length as dependency instead of entire array

  const getDefaultChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => ({ name: month, value: 0 }));
  };

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

  const departmentCount = departments.length;
  const categoryCount = categories.length;
  const indicatorCount = indicators.length;
  const totalCases = monthlyData.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Healthcare KPI Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring and tracking of key performance indicators
          </p>
        </div>

        {/* Live Status Bar */}
        <Card className="mb-8 bg-white border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-semibold text-gray-900">Live Dashboard</p>
                  <p className="text-sm text-gray-600">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Auto-refresh</span>
                </label>
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Departments</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {departmentCount}
                  </p>
                </div>
                <div className="text-blue-200 text-4xl">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-3xl font-bold text-green-600">
                    {categoryCount}
                  </p>
                </div>
                <div className="text-green-200 text-4xl">📁</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Indicators</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {indicatorCount}
                  </p>
                </div>
                <div className="text-purple-200 text-4xl">📈</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {totalCases}
                  </p>
                </div>
                <div className="text-orange-200 text-4xl">📋</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No recent activities. Changes will appear here in real-time.
                    </p>
                  ) : (
                    recentActivities.map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                      >
                        <div
                          className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                            activity.type === "create"
                              ? "bg-green-500"
                              : activity.type === "update"
                                ? "bg-blue-500"
                                : "bg-red-500"
                          }`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {activity.userName}
                            <span className="text-gray-600 font-normal">
                              {" "}
                              {activity.type}d{" "}
                              <span className="text-blue-600">
                                {activity.entity}
                              </span>
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPI Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>KPI Trends (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Departments Overview */}
            {departments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Departments Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {departments.map((dept: any) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200"
                      >
                        <span className="font-medium text-gray-900">
                          {dept.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {indicators.filter((i: any) => i.departmentId === dept.id)
                            .length || 0}{" "}
                          indicators
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Categories List */}
            {categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.slice(0, 5).map((cat: any) => (
                      <div
                        key={cat.id}
                        className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200"
                      >
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">
                          {cat.name}
                        </span>
                      </div>
                    ))}
                    {categories.length > 5 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{categories.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dashboard Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-gray-700 text-sm">Activities</span>
                  <span className="text-xl font-bold text-blue-600">
                    {recentActivities.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-gray-700 text-sm">Status</span>
                  <span className="text-sm font-semibold text-green-600">
                    ● Live
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-gray-700 text-sm">Last Update</span>
                  <span className="text-xs font-semibold text-purple-600">
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>© 2026 Healthcare KPI Dashboard. All rights reserved.</p>
          <p className="mt-2">
            This is a public dashboard. All changes are visible to everyone in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
