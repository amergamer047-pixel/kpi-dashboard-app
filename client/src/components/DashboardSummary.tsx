import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

export function DashboardSummary() {
  const { data: stats, isLoading } = trpc.analytics.stats.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const projectStatus = settings?.projectStatus || "on_track";
  const projectName = settings?.projectName || "Healthcare KPI Dashboard";

  const statusConfig = {
    on_track: { label: "On Track", color: "text-green-600", bg: "bg-green-50" },
    at_risk: { label: "At Risk", color: "text-yellow-600", bg: "bg-yellow-50" },
    off_track: { label: "Off Track", color: "text-red-600", bg: "bg-red-50" },
  };

  const currentStatus = statusConfig[projectStatus as keyof typeof statusConfig];

  const varianceIcon = stats.variance > 0 ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : stats.variance < 0 ? (
    <TrendingDown className="h-4 w-4 text-red-500" />
  ) : (
    <Minus className="h-4 w-4 text-gray-500" />
  );

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-card border rounded-lg">
        <div>
          <h2 className="text-xl font-bold">{projectName}</h2>
          <p className="text-sm text-muted-foreground">KPI Dashboard Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full ${currentStatus.bg}`}>
            <span className={`font-semibold ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total KPIs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total KPIs</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.statusCounts.complete}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={stats.completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.statusCounts.in_progress}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.statusCounts.overdue}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status and Priority Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statusCounts).map(([status, count]) => {
                const percentage = stats.total > 0 ? ((count as number) / stats.total) * 100 : 0;
                const statusLabels: Record<string, string> = {
                  not_started: "Not Started",
                  in_progress: "In Progress",
                  complete: "Complete",
                  overdue: "Overdue",
                  on_hold: "On Hold",
                };
                const statusColors: Record<string, string> = {
                  not_started: "bg-gray-500",
                  in_progress: "bg-blue-500",
                  complete: "bg-green-500",
                  overdue: "bg-red-500",
                  on_hold: "bg-orange-500",
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                      <span className="text-sm">{statusLabels[status]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count as number}</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.priorityCounts).map(([priority, count]) => {
                const percentage = stats.total > 0 ? ((count as number) / stats.total) * 100 : 0;
                const priorityColors: Record<string, string> = {
                  high: "bg-red-500",
                  medium: "bg-yellow-500",
                  low: "bg-green-500",
                };
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${priorityColors[priority]}`}></div>
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count as number}</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.riskCounts).map(([risk, count]) => {
                const percentage = stats.total > 0 ? ((count as number) / stats.total) * 100 : 0;
                const riskColors: Record<string, string> = {
                  high: "bg-red-500",
                  medium: "bg-yellow-500",
                  low: "bg-green-500",
                };
                return (
                  <div key={risk} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${riskColors[risk]}`}></div>
                      <span className="text-sm capitalize">{risk}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count as number}</span>
                      <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">{stats.totalTarget.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actual</p>
                <p className="text-2xl font-bold">{stats.totalActual.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Variance</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${stats.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {stats.variance >= 0 ? "+" : ""}{stats.variance.toFixed(1)}%
                  </p>
                  {varianceIcon}
                </div>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
