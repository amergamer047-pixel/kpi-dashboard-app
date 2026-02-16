import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnifiedPatientDataEntryProps {
  departmentId: number;
  departmentName: string;
}

interface Category {
  id: number;
  name: string;
  requiresPatientInfo: number | null;
}

interface Indicator {
  id: number;
  categoryId: number;
  name: string;
  requiresPatientInfo: number | null;
}

interface PatientCase {
  id: number;
  hospitalId: string;
  patientName: string;
  month: number;
  notes: string | null;
}

const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" },
];

const QUARTERS = [
  { value: 1, label: "Q1 (Jan-Mar)", months: [1, 2, 3] },
  { value: 2, label: "Q2 (Apr-Jun)", months: [4, 5, 6] },
  { value: 3, label: "Q3 (Jul-Sep)", months: [7, 8, 9] },
  { value: 4, label: "Q4 (Oct-Dec)", months: [10, 11, 12] },
];

/**
 * Unified Patient Data Entry Component
 * 
 * This component integrates Data Entry directly with the Patient Registry.
 * All patient data is stored in the patientCases table (single source of truth).
 * KPI counts are automatically calculated from patient records.
 * 
 * Benefits:
 * - Centralized patient data management
 * - No data duplication
 * - Real-time consistency between Data Entry and Patient Registry
 * - Automatic KPI aggregation
 */
export function UnifiedPatientDataEntry({
  departmentId,
  departmentName,
}: UnifiedPatientDataEntryProps) {
  const utils = trpc.useUtils();
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  // Patient entry dialog
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [patientForm, setPatientForm] = useState({
    hospitalId: "",
    patientName: "",
    notes: "",
  });

  // Edit patient dialog
  const [editPatientDialogOpen, setEditPatientDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientCase | null>(null);
  const [editForm, setEditForm] = useState({
    hospitalId: "",
    patientName: "",
    notes: "",
  });

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientCase | null>(
    null
  );

  // Queries
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: indicators = [] } = trpc.indicators.list.useQuery();
  const { data: allPatientCases = [] } = trpc.patientCases.listByDepartment.useQuery({
    departmentId,
    year,
  });

  // Mutations
  const createPatientMutation = trpc.patientCases.create.useMutation({
    onSuccess: () => {
      utils.patientCases.list.invalidate();
      setAddPatientDialogOpen(false);
      setPatientForm({ hospitalId: "", patientName: "", notes: "" });
      toast.success("Patient case added to repository");
    },
    onError: (error) => {
      toast.error(`Failed to add patient: ${error.message}`);
    },
  });

  const updatePatientMutation = trpc.patientCases.update.useMutation({
    onSuccess: () => {
      utils.patientCases.list.invalidate();
      setEditPatientDialogOpen(false);
      setEditingPatient(null);
      toast.success("Patient case updated in repository");
    },
    onError: (error) => {
      toast.error(`Failed to update patient: ${error.message}`);
    },
  });

  const deletePatientMutation = trpc.patientCases.delete.useMutation({
    onSuccess: () => {
      utils.patientCases.list.invalidate();
      setDeleteConfirmOpen(false);
      setPatientToDelete(null);
      toast.success("Patient case removed from repository");
    },
    onError: (error) => {
      toast.error(`Failed to delete patient: ${error.message}`);
    },
  });

  // Filter patient cases by quarter
  const quarterMonths = useMemo(() => {
    const q = QUARTERS.find((q) => q.value === quarter);
    return q?.months || [];
  }, [quarter]);

  const patientsByIndicatorMonth = useMemo(() => {
    const grouped: Record<string, PatientCase[]> = {};
    allPatientCases.forEach((pc) => {
      if (quarterMonths.includes(pc.month)) {
        const key = `${pc.indicatorId}-${pc.month}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(pc);
      }
    });
    return grouped;
  }, [allPatientCases, quarterMonths]);

  const getPatientCount = (indicatorId: number, month: number): number => {
    const key = `${indicatorId}-${month}`;
    return patientsByIndicatorMonth[key]?.length || 0;
  };

  const getPatients = (indicatorId: number, month: number): PatientCase[] => {
    const key = `${indicatorId}-${month}`;
    return patientsByIndicatorMonth[key] || [];
  };

  const handleAddPatient = () => {
    if (!selectedIndicator || !selectedMonth) {
      toast.error("Please select indicator and month");
      return;
    }
    if (!patientForm.hospitalId.trim() || !patientForm.patientName.trim()) {
      toast.error("Please fill in Hospital ID and Patient Name");
      return;
    }

    createPatientMutation.mutate({
      departmentId,
      indicatorId: selectedIndicator.id,
      year,
      month: selectedMonth,
      hospitalId: patientForm.hospitalId,
      patientName: patientForm.patientName,
      notes: patientForm.notes || undefined,
    });
  };

  const handleEditPatient = (patient: PatientCase) => {
    setEditingPatient(patient);
    setEditForm({
      hospitalId: patient.hospitalId,
      patientName: patient.patientName,
      notes: patient.notes || "",
    });
    setEditPatientDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingPatient) return;
    if (!editForm.hospitalId.trim() || !editForm.patientName.trim()) {
      toast.error("Please fill in Hospital ID and Patient Name");
      return;
    }

    updatePatientMutation.mutate({
      id: editingPatient.id,
      hospitalId: editForm.hospitalId,
      patientName: editForm.patientName,
      notes: editForm.notes || undefined,
    });
  };

  const handleDeletePatient = (patient: PatientCase) => {
    setPatientToDelete(patient);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (patientToDelete) {
      deletePatientMutation.mutate({ id: patientToDelete.id });
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const indicatorsByCategory = useMemo(() => {
    const grouped: Record<number, Indicator[]> = {};
    indicators.forEach((ind) => {
      if (!grouped[ind.categoryId]) grouped[ind.categoryId] = [];
      grouped[ind.categoryId].push(ind);
    });
    return grouped;
  }, [indicators]);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <Label className="text-sm font-medium">Year</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-32">
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
          <Label className="text-sm font-medium">Quarter</Label>
          <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={q.value.toString()}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories and Indicators */}
      <div className="space-y-4">
        {categories.map((category) => (
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
                  {(indicatorsByCategory[category.id] || []).map((indicator) => (
                    <div key={indicator.id} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sm">{indicator.name}</h4>

                      {/* Month columns */}
                      <div className="grid grid-cols-3 gap-3">
                        {MONTHS.filter((m) => quarterMonths.includes(m.value)).map(
                          (month) => {
                            const count = getPatientCount(indicator.id, month.value);
                            const patients = getPatients(indicator.id, month.value);

                            return (
                              <div key={month.value} className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  {month.short}
                                </label>
                                <div className="border rounded p-2 space-y-1">
                                  <div className="text-center font-bold text-lg">
                                    {count}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-8 text-xs"
                                    onClick={() => {
                                      setSelectedIndicator(indicator);
                                      setSelectedMonth(month.value);
                                      setAddPatientDialogOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>

                                  {/* Patient list */}
                                  {patients.length > 0 && (
                                    <div className="mt-2 space-y-1 text-xs max-h-32 overflow-y-auto">
                                      {patients.map((patient) => (
                                        <div
                                          key={patient.id}
                                          className="bg-muted/50 p-1 rounded flex items-center justify-between group"
                                        >
                                          <span className="truncate flex-1">
                                            {patient.hospitalId}
                                          </span>
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => handleEditPatient(patient)}
                                              className="p-0.5 hover:bg-background rounded"
                                              title="Edit"
                                            >
                                              <Edit className="h-3 w-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeletePatient(patient)}
                                              className="p-0.5 hover:bg-background rounded"
                                              title="Delete"
                                            >
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={addPatientDialogOpen} onOpenChange={setAddPatientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Patient Case to Repository</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Indicator</Label>
              <Input value={selectedIndicator?.name || ""} disabled />
            </div>
            <div>
              <Label>Month</Label>
              <Input
                value={
                  MONTHS.find((m) => m.value === selectedMonth)?.label || ""
                }
                disabled
              />
            </div>
            <div>
              <Label>Hospital ID *</Label>
              <Input
                placeholder="Enter hospital ID"
                value={patientForm.hospitalId}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, hospitalId: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Patient Name *</Label>
              <Input
                placeholder="Enter patient name"
                value={patientForm.patientName}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, patientName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                placeholder="Optional notes"
                value={patientForm.notes || ""}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPatientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPatient} disabled={createPatientMutation.isPending}>
              {createPatientMutation.isPending ? "Adding..." : "Add to Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={editPatientDialogOpen} onOpenChange={setEditPatientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Patient Case in Repository</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hospital ID *</Label>
              <Input
                value={editForm.hospitalId}
                onChange={(e) =>
                  setEditForm({ ...editForm, hospitalId: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Patient Name *</Label>
              <Input
                value={editForm.patientName}
                onChange={(e) =>
                  setEditForm({ ...editForm, patientName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPatientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updatePatientMutation.isPending}>
              {updatePatientMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {patientToDelete?.patientName} (
              {patientToDelete?.hospitalId}) from the repository. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={deletePatientMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deletePatientMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Unified Data Entry:</strong> All patient data entered here is
            stored directly in the Patient Registry. KPI counts are automatically
            calculated from patient records. Changes appear immediately in all tabs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
