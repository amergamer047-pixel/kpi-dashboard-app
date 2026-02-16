import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";


interface UnifiedDataEntryProps {
  selectedDepartmentId: number | null;
  selectedYear: number;
  selectedQuarter: number;
}

const MONTHS = [
  { value: 1, name: "January", short: "Jan" },
  { value: 2, name: "February", short: "Feb" },
  { value: 3, name: "March", short: "Mar" },
  { value: 4, name: "April", short: "Apr" },
  { value: 5, name: "May", short: "May" },
  { value: 6, name: "June", short: "Jun" },
  { value: 7, name: "July", short: "Jul" },
  { value: 8, name: "August", short: "Aug" },
  { value: 9, name: "September", short: "Sep" },
  { value: 10, name: "October", short: "Oct" },
  { value: 11, name: "November", short: "Nov" },
  { value: 12, name: "December", short: "Dec" },
];

export default function UnifiedDataEntry({
  selectedDepartmentId,
  selectedYear,
  selectedQuarter,
}: UnifiedDataEntryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [editingMonthlyData, setEditingMonthlyData] = useState<any>(null);
  const [monthlyDataDialogOpen, setMonthlyDataDialogOpen] = useState(false);
  const [monthlyDataValue, setMonthlyDataValue] = useState("");
  const [monthlyDataNotes, setMonthlyDataNotes] = useState("");

  // Queries
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: indicators = [] } = trpc.indicators.list.useQuery();
  const { data: monthlyData = [], refetch: refetchMonthlyData } = trpc.monthlyData.get.useQuery(
    selectedDepartmentId && selectedYear && selectedQuarter
      ? { departmentId: selectedDepartmentId, year: selectedYear, quarter: selectedQuarter }
      : { departmentId: 0, year: 0, quarter: 0 },
    { enabled: !!selectedDepartmentId }
  );
  const { data: patientCases = [], refetch: refetchPatientCases } = trpc.patientCases.listByDepartment.useQuery(
    selectedDepartmentId && selectedYear
      ? { departmentId: selectedDepartmentId, year: selectedYear, quarter: selectedQuarter }
      : { departmentId: 0, year: 0, quarter: 0 },
    { enabled: !!selectedDepartmentId }
  );

  // Mutations
  const upsertMonthlyMutation = trpc.monthlyData.upsert.useMutation({
    onSuccess: () => {
      refetchMonthlyData();
      setMonthlyDataDialogOpen(false);
      setEditingMonthlyData(null);
      setMonthlyDataValue("");
      setMonthlyDataNotes("");
    },
  });

  const deleteMonthlyMutation = trpc.monthlyData.delete.useMutation({
    onSuccess: () => {
      refetchMonthlyData();
    },
  });

  const deletePatientMutation = trpc.patientCases.delete.useMutation({
    onSuccess: () => {
      refetchPatientCases();
    },
  });

  // Group indicators by category
  const indicatorsByCategory = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    indicators.forEach((ind: any) => {
      if (!grouped[ind.categoryId]) grouped[ind.categoryId] = [];
      grouped[ind.categoryId].push(ind);
    });
    return grouped;
  }, [indicators]);

  // Get quarter months
  const quarterMonths = useMemo(() => {
    const start = (selectedQuarter - 1) * 3 + 1;
    return [start, start + 1, start + 2];
  }, [selectedQuarter]);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getMonthlyValue = (indicatorId: number, month: number) => {
    const data = monthlyData.find(
      (d: any) => d.indicatorId === indicatorId && d.month === month
    );
    return data ? parseFloat(data.value || "0") : 0;
  };

  const getPatientCount = (indicatorId: number, month: number) => {
    return patientCases.filter(
      (pc: any) =>
        pc.indicatorId === indicatorId &&
        pc.month === month &&
        pc.departmentId === selectedDepartmentId
    ).length;
  };

  const getPatients = (indicatorId: number, month: number) => {
    return patientCases.filter(
      (pc: any) =>
        pc.indicatorId === indicatorId &&
        pc.month === month &&
        pc.departmentId === selectedDepartmentId
    );
  };

  const handleEditMonthlyData = (indicatorId: number, month: number) => {
    const existing = monthlyData.find(
      (d: any) => d.indicatorId === indicatorId && d.month === month
    );
    setEditingMonthlyData({ indicatorId, month, id: existing?.id });
    setMonthlyDataValue(existing ? String(existing.value) : "");
    setMonthlyDataNotes(existing?.notes ? String(existing.notes) : "");
    setMonthlyDataDialogOpen(true);
  };

  const handleSaveMonthlyData = async () => {
    if (!selectedDepartmentId || !editingMonthlyData) return;

    try {
      await upsertMonthlyMutation.mutateAsync({
        departmentId: selectedDepartmentId,
        indicatorId: editingMonthlyData.indicatorId,
        year: selectedYear,
        month: editingMonthlyData.month,
        value: monthlyDataValue,
        notes: monthlyDataNotes,
      });
    } catch (error) {
      console.error("Error saving monthly data:", error);
    }
  };

  const handleDeleteMonthlyData = async (indicatorId: number, month: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    if (!selectedDepartmentId) return;
    try {
      await deleteMonthlyMutation.mutateAsync({
        departmentId: selectedDepartmentId,
        indicatorId,
        year: selectedYear,
        month,
      });
    } catch (error) {
      console.error("Error deleting monthly data:", error);
    }
  };

  const handleDeletePatient = async (patientId: number) => {
    if (!confirm("Are you sure you want to delete this patient case?")) return;
    try {
      await deletePatientMutation.mutateAsync({ id: patientId });
    } catch (error) {
      console.error("Error deleting patient case:", error);
    }
  };

  if (!selectedDepartmentId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Please select a department to view and manage data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {categories.map((category: any) => (
          <Card key={category.id}>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center gap-2">
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CardTitle className="text-base">{category.name}</CardTitle>
              </div>
            </CardHeader>

            {expandedCategories.has(category.id) && (
              <CardContent className="space-y-6">
                {(indicatorsByCategory[category.id] || []).length > 0 ? (
                  (indicatorsByCategory[category.id] || []).map((indicator: any) => (
                    <div key={indicator.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{indicator.name}</h4>
                        <span className="text-xs text-gray-500">
                          {indicator.requiresPatientInfo ? "Patient Tracking" : "Direct Entry"}
                        </span>
                      </div>

                      {/* Month columns */}
                      <div className="grid grid-cols-3 gap-3">
                        {MONTHS.filter((m) => quarterMonths.includes(m.value)).map((month) => {
                          const monthlyValue = getMonthlyValue(indicator.id, month.value);
                          const patientCount = getPatientCount(indicator.id, month.value);
                          const patients = getPatients(indicator.id, month.value);
                          const totalValue = monthlyValue + patientCount;

                          return (
                            <div key={month.value} className="space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                {month.short}
                              </label>
                              <div className="border rounded p-3 space-y-2">
                                {/* Display total value */}
                                <div className="text-center font-bold text-lg">
                                  {totalValue}
                                </div>

                                {/* Direct number entry section */}
                                <div className="space-y-2 border-t pt-2">
                                  <div className="text-xs text-gray-600">
                                    Direct: {monthlyValue}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-7 text-xs"
                                    onClick={() =>
                                      handleEditMonthlyData(indicator.id, month.value)
                                    }
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    {monthlyValue > 0 ? "Edit" : "Add"}
                                  </Button>
                                  {monthlyValue > 0 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-full h-7 text-xs text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteMonthlyData(indicator.id, month.value)}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>

                                {/* Patient cases section */}
                                {indicator.requiresPatientInfo && (
                                  <div className="space-y-2 border-t pt-2">
                                    <div className="text-xs text-gray-600">
                                      Patients: {patientCount}
                                    </div>
                                    {patients.length > 0 && (
                                      <div className="mt-2 space-y-1 text-xs max-h-32 overflow-y-auto">
                                        {patients.map((patient: any) => (
                                          <div
                                            key={patient.id}
                                            className="bg-muted/50 p-1 rounded flex items-center justify-between group"
                                          >
                                            <span className="truncate flex-1">
                                              {patient.hospitalId}
                                            </span>
                                            <button
                                              onClick={() => handleDeletePatient(patient.id)}
                                              className="p-0.5 hover:bg-background rounded opacity-0 group-hover:opacity-100"
                                              title="Delete"
                                            >
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No indicators in this category</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Monthly Data Dialog */}
      <Dialog open={monthlyDataDialogOpen} onOpenChange={setMonthlyDataDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMonthlyData?.id ? "Edit" : "Add"} Monthly Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={monthlyDataValue}
                onChange={(e) => setMonthlyDataValue(e.target.value)}
                placeholder="Enter number"
                step="0.01"
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={monthlyDataNotes}
                onChange={(e) => setMonthlyDataNotes(e.target.value)}
                placeholder="Add any notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMonthlyDataDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMonthlyData} disabled={!monthlyDataValue}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
