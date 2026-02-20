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
import { RefreshCw, Users } from "lucide-react";

interface ConnectedUser {
  userId: string;
  userName: string;
  lastActivity: string;
}

interface Activity {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  entityId: number;
  userId: string;
  userName: string;
  timestamp: string;
}

export default function PublicDashboard() {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time activity tracking
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
      const customEvent = event as CustomEvent;
      loadActivities();
    };

    window.addEventListener("kpi-activity", handleActivity);

    // Auto-refresh every 5 seconds
    const interval = autoRefresh
      ? setInterval(() => {
          loadActivities();
          setLastRefresh(new Date());
        }, 5000)
      : undefined;

    return () => {
      window.removeEventListener("kpi-activity", handleActivity);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

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

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
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

            {/* Sample Chart */}
            <Card>
              <CardHeader>
                <CardTitle>KPI Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Jan", value: 45 },
                        { name: "Feb", value: 52 },
                        { name: "Mar", value: 48 },
                        { name: "Apr", value: 61 },
                        { name: "May", value: 55 },
                        { name: "Jun", value: 67 },
                      ]}
                    >
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
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Connected Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Viewing Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {connectedUsers.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No users currently viewing
                    </p>
                  ) : (
                    connectedUsers.map((user, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(user.lastActivity).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-gray-700">Total Activities</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {recentActivities.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-gray-700">Active Users</span>
                  <span className="text-2xl font-bold text-green-600">
                    {connectedUsers.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-gray-700">Status</span>
                  <span className="text-sm font-semibold text-green-600">
                    ● Live
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
            This is a public dashboard. Changes are visible to all users in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
