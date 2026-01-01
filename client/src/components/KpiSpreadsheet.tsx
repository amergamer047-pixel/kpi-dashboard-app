import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    if (indicator?.requiresPatientInfo) {
      const count = patientCases.filter(
        (c: PatientCase & { indicatorId: number }) => c.indicatorId === indicatorId && c.month === month
      ).length;
      return count.toString();
    }
    
    // For other indicators, get from monthly data
    const data = monthlyData.find(
      (d: { indicatorId: number; month: number; value: string | null }) => 
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
    return patientCases.filter(
      (c: PatientCase & { indicatorId: number }) => 
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg">{departmentName} - KPI Data Entry</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Year:</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="w-24">
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
                <SelectTrigger className="w-36">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px] font-semibold">KPI Indicator</TableHead>
                {quarterMonths.map((month) => (
                  <TableHead key={month} className="text-center font-semibold w-[100px]">
                    {MONTHS.find((m) => m.value === month)?.short}
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold w-[100px] bg-primary/10">
                  Q{quarter} Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category: Category) => (
                <>
                  {/* Category Header Row */}
                  <TableRow
                    key={`cat-${category.id}`}
                    className="bg-muted/30 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <TableCell colSpan={5} className="font-semibold">
                      <div className="flex items-center gap-2">
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {category.name}
                        {category.requiresPatientInfo ? (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Patient tracking required)
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Indicator Rows */}
                  {expandedCategories.has(category.id) &&
                    indicatorsByCategory[category.id]?.map((indicator: Indicator) => (
                      <TableRow key={`ind-${indicator.id}`} className="hover:bg-muted/20">
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-2">
                            <span>{indicator.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({indicator.unit || "cases"})
                            </span>
                          </div>
                        </TableCell>
                        {quarterMonths.map((month) => {
                          const isEditing =
                            editingCell?.indicatorId === indicator.id &&
                            editingCell?.month === month;
                          const value = getCellValue(indicator.id, month);
                          const requiresPatient = indicator.requiresPatientInfo;

                          return (
                            <TableCell
                              key={month}
                              className="text-center p-1"
                            >
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
                                  className="h-8 text-center"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleCellClick(indicator, month)}
                                    className="w-full h-8 flex items-center justify-center hover:bg-muted rounded transition-colors"
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
                                      className="h-6 w-6"
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
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-semibold bg-primary/5">
                          {getQuarterlyTotal(indicator.id)}
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Add Patient Case Dialog */}
        <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Add Patient Case - {selectedIndicator?.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({MONTHS.find((m) => m.value === selectedMonth)?.label} {year})
                </span>
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
                  placeholder="Enter patient hospital ID"
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
                  placeholder="Enter patient name"
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
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({MONTHS.find((m) => m.value === viewingMonth)?.label} {year})
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {viewingCases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No patient cases recorded for this period.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingCases.map((c: PatientCase) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.hospitalId}</TableCell>
                        <TableCell>{c.patientName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deletePatientCase.mutate({ id: c.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
      </CardContent>
    </Card>
  );
}
