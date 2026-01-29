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
import { Plus, Trash2, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface KpiSpreadsheetProps {
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
  unit: string | null;
  requiresPatientInfo: number | null;
}

interface PatientCase {
  id: number;
  hospitalId: string;
  patientName: string;
  caseDate: Date | null;
  notes: string | null;
  month: number;
  indicatorId: number;
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

export function KpiSpreadsheet({ departmentId, departmentName }: KpiSpreadsheetProps) {
  const utils = trpc.useUtils();
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [editingCell, setEditingCell] = useState<{ indicatorId: number; month: number } | null>(null);
  const [cellValue, setCellValue] = useState("");
  
  // Patient case dialog
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [patientForm, setPatientForm] = useState({ hospitalId: "", patientName: "", notes: "" });
  
  // View cases dialog
  const [viewCasesOpen, setViewCasesOpen] = useState(false);
  const [viewingIndicator, setViewingIndicator] = useState<Indicator | null>(null);
  const [viewingMonth, setViewingMonth] = useState<number | null>(null);

  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: indicators = [] } = trpc.indicators.list.useQuery();
  const { data: monthlyData = [] } = trpc.monthlyData.get.useQuery({
    departmentId,
    year,
    quarter,
  });
  const { data: patientCases = [] } = trpc.patientCases.listByDepartment.useQuery({
    departmentId,
    year,
    quarter,
  });

  const upsertMonthlyData = trpc.monthlyData.upsert.useMutation({
    onSuccess: () => {
      utils.monthlyData.get.invalidate();
      setEditingCell(null);
      setCellValue("");
    },
  });

  const createPatientCase = trpc.patientCases.create.useMutation({
    onSuccess: () => {
      utils.patientCases.listByDepartment.invalidate();
      setPatientDialogOpen(false);
      setPatientForm({ hospitalId: "", patientName: "", notes: "" });
      toast.success("Patient case added");
    },
    onError: (error) => {
      toast.error(`Failed to add patient case: ${error.message}`);
    },
  });

  const deletePatientCase = trpc.patientCases.delete.useMutation({
    onSuccess: () => {
      utils.patientCases.listByDepartment.invalidate();
      toast.success("Patient case deleted");
    },
  });

  const quarterMonths = QUARTERS.find(q => q.value === quarter)?.months || [];

  // Group indicators by category
  const indicatorsByCategory = useMemo(() => {
    const grouped: Record<number, Indicator[]> = {};
    indicators.forEach((ind: Indicator) => {
      if (!grouped[ind.categoryId]) {
        grouped[ind.categoryId] = [];
      }
      grouped[ind.categoryId].push(ind);
    });
    return grouped;
  }, [indicators]);

  // Get value for a specific cell
  const getCellValue = (indicatorId: number, month: number): string => {
    const indicator = indicators.find((i: Indicator) => i.id === indicatorId);
    
    // For indicators that require patient info, count patient cases
    if (indicator && indicator.requiresPatientInfo) {
      const count = (patientCases as any[]).filter(
        (c: any) => c.indicatorId === indicatorId && c.month === month
      ).length;
      return count.toString();
    }
    
    // For other indicators, get from monthly data
    const data = monthlyData.find(
      (d: any) => 
        d.indicatorId === indicatorId && d.month === month
    );
    return data?.value?.toString() || "0";
  };

  // Get quarterly total for an indicator
  const getQuarterlyTotal = (indicatorId: number): number => {
    return quarterMonths.reduce((sum, month) => {
      return sum + parseFloat(getCellValue(indicatorId, month) || "0");
    }, 0);
  };

  // Handle cell click
  const handleCellClick = (indicator: Indicator, month: number) => {
    if (indicator.requiresPatientInfo) {
      // Open patient case dialog
      setSelectedIndicator(indicator);
      setSelectedMonth(month);
      setPatientDialogOpen(true);
    } else {
      // Edit cell directly
      setEditingCell({ indicatorId: indicator.id, month });
      setCellValue(getCellValue(indicator.id, month));
    }
  };

  // Handle cell value save
  const handleCellSave = () => {
    if (!editingCell) return;
    upsertMonthlyData.mutate({
      departmentId,
      indicatorId: editingCell.indicatorId,
      year,
      month: editingCell.month,
      value: cellValue || "0",
    });
  };

  // Handle add patient case
  const handleAddPatientCase = () => {
    if (!selectedIndicator || !selectedMonth) return;
    if (!patientForm.hospitalId.trim() || !patientForm.patientName.trim()) {
      toast.error("Hospital ID and Patient Name are required");
      return;
    }
    createPatientCase.mutate({
      departmentId,
      indicatorId: selectedIndicator.id,
      year,
      month: selectedMonth,
      hospitalId: patientForm.hospitalId,
      patientName: patientForm.patientName,
      notes: patientForm.notes || undefined,
    });
  };

  // View patient cases for a cell
  const handleViewCases = (indicator: Indicator, month: number) => {
    setViewingIndicator(indicator);
    setViewingMonth(month);
    setViewCasesOpen(true);
  };

  // Get patient cases for viewing
  const viewingCases = useMemo(() => {
    if (!viewingIndicator || !viewingMonth) return [];
    return (patientCases as any[]).filter(
      (c: any) => 
        c.indicatorId === viewingIndicator.id && c.month === viewingMonth
    );
  }, [patientCases, viewingIndicator, viewingMonth]);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Initialize all categories as expanded
  useMemo(() => {
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set(categories.map((c: Category) => c.id)));
    }
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Year:</Label>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-24 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Quarter:</Label>
          <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
            <SelectTrigger className="w-36 text-sm">
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
      {categories.map((category: Category) => (
        <div key={category.id} className="border rounded-lg overflow-hidden">
          {/* Category Header */}
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full bg-muted/30 hover:bg-muted/50 px-4 py-3 flex items-center gap-2 font-semibold text-left transition-colors"
          >
            {expandedCategories.has(category.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{category.name}</span>
            {category.requiresPatientInfo ? (
              <span className="text-xs text-muted-foreground ml-2">
                (Patient tracking required)
              </span>
            ) : null}
          </button>

          {/* Indicators */}
          {expandedCategories.has(category.id) && (
            <div className="divide-y">
              {indicatorsByCategory[category.id]?.map((indicator: Indicator) => {
                const requiresPatient = !!indicator.requiresPatientInfo;
                
                return (
                  <div key={indicator.id} className="p-4">
                    {/* Indicator Name */}
                    <div className="mb-3">
                      <h4 className="font-medium">
                        {indicator.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({indicator.unit || "cases"})
                        </span>
                      </h4>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                      {quarterMonths.map((month) => {
                        const isEditing =
                          editingCell?.indicatorId === indicator.id &&
                          editingCell?.month === month;
                        const value = getCellValue(indicator.id, month);
                        const monthLabel = MONTHS.find((m) => m.value === month)?.short;

                        return (
                          <div key={month} className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground font-medium">
                              {monthLabel}
                            </label>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCellSave();
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                className="h-8 text-center text-sm"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCellClick(indicator, month)}
                                  className="flex-1 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors border text-sm font-medium"
                                >
                                  {value}
                                  {requiresPatient && (
                                    <Plus className="h-3 w-3 ml-1 text-muted-foreground" />
                                  )}
                                </button>
                                {requiresPatient && parseInt(value) > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewCases(indicator, month);
                                    }}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Quarterly Total */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-medium">
                          Q{quarter} Total
                        </label>
                        <div className="h-8 flex items-center justify-center bg-primary/5 rounded border font-semibold text-sm">
                          {getQuarterlyTotal(indicator.id)}
                        </div>
                      </div>
                    </div>

                    {/* Patient Cases Section */}
                    {requiresPatient && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          onClick={() => {
                            setSelectedIndicator(indicator);
                            setSelectedMonth(null);
                            setPatientDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Add Patient Case
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Add Patient Case Dialog */}
      <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Patient Case - {selectedIndicator?.name}
              {selectedMonth && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({MONTHS.find((m) => m.value === selectedMonth)?.label} {year})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hospitalId">Hospital ID *</Label>
              <Input
                id="hospitalId"
                value={patientForm.hospitalId}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, hospitalId: e.target.value })
                }
                placeholder="e.g., PT-2026-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={patientForm.patientName}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, patientName: e.target.value })
                }
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={patientForm.notes}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, notes: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPatientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPatientCase} disabled={createPatientCase.isPending}>
              {createPatientCase.isPending ? "Adding..." : "Add Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Patient Cases Dialog */}
      <Dialog open={viewCasesOpen} onOpenChange={setViewCasesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Patient Cases - {viewingIndicator?.name}
              {viewingMonth && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({MONTHS.find((m) => m.value === viewingMonth)?.label} {year})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {viewingCases.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No patient cases recorded for this period.
              </p>
            ) : (
              <div className="space-y-2">
                {viewingCases.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm">{c.hospitalId}</p>
                      <p className="text-sm">{c.patientName}</p>
                      {c.notes && (
                        <p className="text-xs text-muted-foreground">{c.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive ml-2 flex-shrink-0"
                      onClick={() => deletePatientCase.mutate({ id: c.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewCasesOpen(false);
                if (viewingIndicator && viewingMonth) {
                  setSelectedIndicator(viewingIndicator);
                  setSelectedMonth(viewingMonth);
                  setPatientDialogOpen(true);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Case
            </Button>
            <Button onClick={() => setViewCasesOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
