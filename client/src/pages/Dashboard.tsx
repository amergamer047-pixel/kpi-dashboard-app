import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardSummary } from "@/components/DashboardSummary";
import { KpiSpreadsheet } from "@/components/KpiSpreadsheet";
import { KpiCharts } from "@/components/KpiCharts";
import { DepartmentManager } from "@/components/DepartmentManager";
import { ExcelExport } from "@/components/ExcelExport";
import { KpiSettings } from "@/components/KpiSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Table2,
  BarChart3,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";

interface Department {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
}

interface Indicator {
  id: number;
  name: string;
  categoryId: number;
  requiresPatientInfo: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface MonthlyData {
  indicatorId: number;
  month: number;
  value: string | null;
}

interface PatientCase {
  id: number;
  indicatorId: number;
  hospitalId: string;
  patientName: string;
  month: number;
  notes: string | null;
}

export default function Dashboard() {
  const { loading, user, logout } = useAuth();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const { data: departments = [] } = trpc.departments.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: categories = [] } = trpc.categories.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: indicators = [] } = trpc.indicators.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Get data for export
  const firstDeptId = departments[0]?.id;
  const { data: monthlyData = [] } = trpc.monthlyData.get.useQuery(
    { departmentId: firstDeptId!, year: currentYear, quarter: currentQuarter },
    { enabled: !!user && !!firstDeptId }
  );
  const { data: patientCases = [] } = trpc.patientCases.listByDepartment.useQuery(
    { departmentId: firstDeptId!, year: currentYear, quarter: currentQuarter },
    { enabled: !!user && !!firstDeptId }
  );

  const selectedDepartment = departments.find((d: Department) => d.id === selectedDepartmentId);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Healthcare KPI Dashboard
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Track and visualize key performance indicators for your healthcare organization.
              Sign in to access your dashboard.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to Continue
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", value: "overview" },
    { icon: Table2, label: "KPI Data", value: "data" },
    { icon: BarChart3, label: "Charts", value: "charts" },
    { icon: Settings, label: "Settings", value: "settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r bg-card flex-shrink-0 overflow-hidden`}
      >
        <div className="flex flex-col h-full w-64">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="font-semibold">KPI Dashboard</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Nav Items */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Department Manager */}
              <div className="border-t pt-4">
                <DepartmentManager
                  selectedDepartmentId={selectedDepartmentId}
                  onSelectDepartment={setSelectedDepartmentId}
                />
              </div>
            </div>
          </ScrollArea>

          {/* User Footer */}
          <div className="border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors w-full text-left">
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card/50 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "data" && "KPI Data Entry"}
                {activeTab === "charts" && "KPI Analytics"}
                {activeTab === "settings" && "Settings"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedDepartment ? selectedDepartment.name : "All Departments"}
              </p>
            </div>
          </div>
          {firstDeptId && (
            <ExcelExport
              departmentName={selectedDepartment?.name || "All Departments"}
              year={currentYear}
              quarter={currentQuarter}
              categories={categories}
              indicators={indicators}
              monthlyData={monthlyData}
              patientCases={patientCases}
            />
          )}
        </header>

        {/* Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <DashboardSummary />
              <KpiCharts departmentId={selectedDepartmentId || undefined} />
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6">
              {selectedDepartmentId ? (
                <KpiSpreadsheet
                  departmentId={selectedDepartmentId}
                  departmentName={selectedDepartment?.name || ""}
                />
              ) : departments.length > 0 ? (
                <div className="space-y-8">
                  {departments.map((dept: Department) => (
                    <Card key={dept.id}>
                      <CardContent className="pt-6">
                        <KpiSpreadsheet
                          departmentId={dept.id}
                          departmentName={dept.name}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Departments Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a department from the sidebar to start tracking KPIs.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "charts" && (
            <KpiCharts departmentId={selectedDepartmentId || undefined} />
          )}

          {activeTab === "settings" && (
            <KpiSettings />
          )}
        </div>
      </main>
    </div>
  );
}

