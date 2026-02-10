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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, ChevronUp, ChevronDown, Edit } from "lucide-react";
import { toast } from "sonner";

interface PatientCase {
  id: number;
  hospitalId: string;
  patientName: string;
  indicatorId: number;
  indicatorName: string;
  categoryId: number;
  categoryName: string;
  departmentId: number;
  departmentName: string;
  month: number;
  year: number;
  notes: string | null;
  createdAt?: Date;
}

interface Department {
  id: number;
  name: string;
}

interface Indicator {
  id: number;
  name: string;
  categoryId: number;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function PatientRegistry() {
  const currentYear = new Date().getFullYear();
  
  // Filters
  const [searchHospitalId, setSearchHospitalId] = useState("");
  const [searchPatientName, setSearchPatientName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  
  // Sorting
  const [sortBy, setSortBy] = useState<"hospitalId" | "patientName" | "indicator" | "department" | "month">("month");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Edit/Delete
  const [editingCase, setEditingCase] = useState<PatientCase | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Fetch data
  const { data: departments = [] } = trpc.departments.list.useQuery();
  const { data: indicators = [] } = trpc.indicators.list.useQuery();
  const { data: allPatientCases = [] } = trpc.patientCases.listAll.useQuery();

  const updatePatientCase = trpc.patientCases.update.useMutation({
    onSuccess: () => {
      trpc.useUtils().patientCases.listAll.invalidate();
      toast.success("Patient case updated");
      setShowEditDialog(false);
      setEditingCase(null);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deletePatientCase = trpc.patientCases.delete.useMutation({
    onSuccess: () => {
      trpc.useUtils().patientCases.listAll.invalidate();
      toast.success("Patient case deleted");
      setShowDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Filter and sort patient cases
  const filteredCases = useMemo(() => {
    let filtered = (allPatientCases as any[]).filter((c: any) => {
      const matchesHospitalId = c.hospitalId
        .toLowerCase()
        .includes(searchHospitalId.toLowerCase());
      const matchesPatientName = c.patientName
        .toLowerCase()
        .includes(searchPatientName.toLowerCase());
      const matchesDepartment =
        selectedDepartment === "all" ||
        c.departmentId === parseInt(selectedDepartment);
      const matchesIndicator =
        selectedIndicator === "all" ||
        c.indicatorId === parseInt(selectedIndicator);
      const matchesMonth =
        selectedMonth === "all" || c.month === parseInt(selectedMonth);
      const matchesYear = c.year === parseInt(selectedYear);

      return (
        matchesHospitalId &&
        matchesPatientName &&
        matchesDepartment &&
        matchesIndicator &&
        matchesMonth &&
        matchesYear
      );
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "hospitalId":
          aVal = a.hospitalId;
          bVal = b.hospitalId;
          break;
        case "patientName":
          aVal = a.patientName;
          bVal = b.patientName;
          break;
        case "indicator":
          aVal = a.indicatorName;
          bVal = b.indicatorName;
          break;
        case "department":
          aVal = a.departmentName;
          bVal = b.departmentName;
          break;
        case "month":
          aVal = a.month;
          bVal = b.month;
          break;
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    allPatientCases,
    searchHospitalId,
    searchPatientName,
    selectedDepartment,
    selectedIndicator,
    selectedMonth,
    selectedYear,
    sortBy,
    sortOrder,
  ]);

  // Get unique values for dropdowns
  const uniqueDepartments = useMemo(() => {
    return Array.from(
      new Map(
        (allPatientCases as any[]).map((c: any) => [
          c.departmentId,
          { id: c.departmentId, name: c.departmentName },
        ])
      ).values()
    );
  }, [allPatientCases]);

  const uniqueIndicators = useMemo(() => {
    return Array.from(
      new Map(
        (allPatientCases as any[]).map((c: any) => [
          c.indicatorId,
          { id: c.indicatorId, name: c.indicatorName },
        ])
      ).values()
    );
  }, [allPatientCases]);

  const uniqueYears = useMemo(() => {
    const years = new Set((allPatientCases as any[]).map((c: any) => c.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [allPatientCases]);

  const handleSort = (column: "hospitalId" | "patientName" | "indicator" | "department" | "month") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const handleExport = () => {
    if (filteredCases.length === 0) {
      toast.error("No patient cases to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Hospital ID",
      "Patient Name",
      "Indicator",
      "Category",
      "Department",
      "Month",
      "Year",
      "Notes",
    ];
    const rows = filteredCases.map((c: any) => [
      c.hospitalId,
      c.patientName,
      c.indicatorName,
      c.categoryName,
      c.departmentName,
      MONTHS.find((m) => m.value === c.month)?.label || c.month,
      c.year,
      c.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${cell.toString().replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-registry-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredCases.length} patient cases`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Registry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Filters</h3>
            
            {/* Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalId" className="text-sm">
                  Search Hospital ID
                </Label>
                <Input
                  id="hospitalId"
                  placeholder="e.g., PT-2026-001"
                  value={searchHospitalId}
                  onChange={(e) => setSearchHospitalId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientName" className="text-sm">
                  Search Patient Name
                </Label>
                <Input
                  id="patientName"
                  placeholder="e.g., John Doe"
                  value={searchPatientName}
                  onChange={(e) => setSearchPatientName(e.target.value)}
                />
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm">
                  Year
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month" className="text-sm">
                  Month
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month" className="text-sm">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm">
                  Department
                </Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger id="department" className="text-sm">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((dept: any) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.id.toString()}
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indicator" className="text-sm">
                  Indicator
                </Label>
                <Select
                  value={selectedIndicator}
                  onValueChange={setSelectedIndicator}
                >
                  <SelectTrigger id="indicator" className="text-sm">
                    <SelectValue placeholder="All Indicators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Indicators</SelectItem>
                    {uniqueIndicators.map((ind: any) => (
                      <SelectItem
                        key={ind.id}
                        value={ind.id.toString()}
                      >
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold">{filteredCases.length}</span> patient case{filteredCases.length !== 1 ? "s" : ""}
          </div>
          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No patient cases found. Try adjusting your filters.
              </div>
            ) : (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("hospitalId")}>
                      Hospital ID <SortIcon column="hospitalId" />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("patientName")}>
                      Patient Name <SortIcon column="patientName" />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("indicator")}>
                      Indicator <SortIcon column="indicator" />
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("department")}>
                      Department <SortIcon column="department" />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort("month")}>
                      Month <SortIcon column="month" />
                    </TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((patientCase: any) => (
                    <TableRow key={patientCase.id}>
                      <TableCell className="font-mono font-semibold">
                        {patientCase.hospitalId}
                      </TableCell>
                      <TableCell>{patientCase.patientName}</TableCell>
                      <TableCell>{patientCase.indicatorName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {patientCase.categoryName}
                      </TableCell>
                      <TableCell>{patientCase.departmentName}</TableCell>
                      <TableCell>
                        {MONTHS.find((m) => m.value === patientCase.month)?.label}
                      </TableCell>
                      <TableCell>{patientCase.year}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {patientCase.notes || "-"}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            setEditingCase(patientCase);
                            setShowEditDialog(true);
                          }}
                          title="Edit patient case"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setShowDeleteConfirm(patientCase.id)}
                          disabled={deletePatientCase.isPending}
                          title="Delete patient case"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </>
            )}
          </div>

          {/* Edit Dialog */}
          {editingCase && showEditDialog && (
            <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit Patient Case</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Hospital ID</label>
                    <Input
                      value={editingCase.hospitalId}
                      onChange={(e) => setEditingCase({...editingCase, hospitalId: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Patient Name</label>
                    <Input
                      value={editingCase.patientName}
                      onChange={(e) => setEditingCase({...editingCase, patientName: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Input
                      value={editingCase.notes || ""}
                      onChange={(e) => setEditingCase({...editingCase, notes: e.target.value || null})}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!editingCase.hospitalId.trim() || !editingCase.patientName.trim()) {
                        toast.error("Please fill in all required fields");
                        return;
                      }
                      updatePatientCase.mutate({
                        id: editingCase.id,
                        hospitalId: editingCase.hospitalId,
                        patientName: editingCase.patientName,
                        notes: editingCase.notes || undefined,
                      });
                    }}
                    disabled={updatePatientCase.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Patient Case</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this patient case? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (showDeleteConfirm !== null) {
                      deletePatientCase.mutate({ id: showDeleteConfirm });
                    }
                  }}
                  disabled={deletePatientCase.isPending}
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
