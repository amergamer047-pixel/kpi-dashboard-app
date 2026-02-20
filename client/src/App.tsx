import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import InteractiveDashboard from "@/pages/InteractiveDashboard";
import PublicDashboard from "@/pages/PublicDashboard";
import SimpleNameLogin from "@/components/SimpleNameLogin";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // Check if user already logged in for edit mode
    const storedName = localStorage.getItem("collaboratorName");
    if (storedName) {
      setUserName(storedName);
      setIsEditMode(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (name: string) => {
    setUserName(name);
    setIsEditMode(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("collaboratorName");
    setUserName(null);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If in edit mode but no user logged in, show login screen
  if (isEditMode && !userName) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <SimpleNameLogin onLogin={handleLogin} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // If in edit mode and user is logged in, show edit dashboard
  if (isEditMode && userName) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Switch>
              <Route path="/" component={() => <InteractiveDashboard userName={userName} onLogout={handleLogout} />} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Default: show public dashboard with Edit button
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="relative">
            <PublicDashboard />
            <div className="fixed bottom-4 right-4 z-50">
              <button
                onClick={() => setIsEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
              >
                Edit Dashboard
              </button>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
