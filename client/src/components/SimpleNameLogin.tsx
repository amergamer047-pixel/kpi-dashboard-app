import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SimpleNameLoginProps {
  onLogin: (name: string) => void;
}

export default function SimpleNameLogin({ onLogin }: SimpleNameLoginProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      // Store name in localStorage
      localStorage.setItem("collaboratorName", name.trim());
      onLogin(name.trim());
    } catch (error) {
      toast.error("Failed to login");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Healthcare KPI Dashboard
          </CardTitle>
          <p className="text-gray-600 mt-2">Collaborative Real-time Monitoring</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Enter Your Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="text-base"
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Your name will be used to track your activities on the shared dashboard
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 h-10"
            >
              {isLoading ? "Entering Dashboard..." : "Enter Dashboard"}
            </Button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Shared Dashboard</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Real-time collaborative editing</li>
                <li>✓ Live chart updates</li>
                <li>✓ Instant forecasting</li>
                <li>✓ Activity tracking</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
