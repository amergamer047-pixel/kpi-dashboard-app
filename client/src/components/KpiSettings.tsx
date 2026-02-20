import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { BulkDepartmentOps } from "./BulkDepartmentOps";

interface Department {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  isFrozen?: number | null;
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

const DEPARTMENT_COLORS = [
  "#3B82F6", "#22C55E", "#EF4444", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

export function KpiSettings() {
  const utils = trpc.useUtils();
  
  // Departments
  const { data: departments = [] } = trpc.departments.list.useQuery();
  const [deptDialog, setDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3B82F6" });
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
  const [selectedDepts, setSelectedDepts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Categories
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", requiresPatientInfo: false });
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  // Indicators
  const { data: indicators = [] } = trpc.indicators.list.useQuery();
  const [indDialog, setIndDialog] = useState(false);
  const [editingInd, setEditingInd] = useState<Indicator | null>(null);
  const [indForm, setIndForm] = useState({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
  const [deleteIndId, setDeleteIndId] = useState<number | null>(null);

  // Mutations
  const createDept = trpc.departments.create.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setDeptDialog(false);
      setDeptForm({ name: "", description: "", color: "#3B82F6" });
      toast.success("Department created");
    },
  });

  const updateDept = trpc.departments.update.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setDeptDialog(false);
      setEditingDept(null);
      setDeptForm({ name: "", description: "", color: "#3B82F6" });
      toast.success("Department updated");
    },
  });

  const deleteDept = trpc.departments.delete.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setDeleteDeptId(null);
      toast.success("Department deleted");
    },
  });

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setCatDialog(false);
      setCatForm({ name: "", requiresPatientInfo: false });
      toast.success("Category created");
    },
  });

  const deleteCat = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      utils.indicators.list.invalidate();
      setDeleteCatId(null);
      toast.success("Category deleted");
    },
  });

  const createInd = trpc.indicators.create.useMutation({
    onSuccess: () => {
      utils.indicators.list.invalidate();
      setIndDialog(false);
      setIndForm({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
      toast.success("Indicator created");
    },
  });

  const deleteInd = trpc.indicators.delete.useMutation({
    onSuccess: () => {
      utils.indicators.list.invalidate();
      setDeleteIndId(null);
      toast.success("Indicator deleted");
    },
  });

  // Department handlers
  const handleDeptSave = () => {
    if (!deptForm.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (editingDept) {
      updateDept.mutate({
        id: editingDept.id,
        name: deptForm.name,
        description: deptForm.description || undefined,
        color: deptForm.color,
      });
    } else {
      createDept.mutate({
        name: deptForm.name,
        description: deptForm.description || undefined,
        color: deptForm.color,
      });
    }
  };

  const handleDeptEdit = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || "",
      color: dept.color || "#3B82F6",
    });
    setDeptDialog(true);
  };

  // Category handlers
  const handleCatSave = () => {
    if (!catForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    createCat.mutate({
      name: catForm.name,
      requiresPatientInfo: catForm.requiresPatientInfo,
    });
  };

  // Indicator handlers
  const handleIndSave = () => {
    if (!indForm.name.trim()) {
      toast.error("Indicator name is required");
      return;
    }
    if (indForm.categoryId === 0) {
      toast.error("Please select a category");
      return;
    }
    createInd.mutate({
      categoryId: indForm.categoryId,
      name: indForm.name,
      unit: indForm.unit || "cases",
      requiresPatientInfo: indForm.requiresPatientInfo,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Departments</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDept(null);
                  setDeptForm({ name: "", description: "", color: "#3B82F6" });
                  setDeptDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No departments yet. Create one to get started.
                </p>
              ) : (
                <BulkDepartmentOps
                  departments={departments}
                  onRefresh={() => utils.departments.list.invalidate()}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Categories</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setCatForm({ name: "", requiresPatientInfo: false });
                  setCatDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No categories yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat: Category) => {
                    const catIndicators = indicators.filter(
                      (ind: Indicator) => ind.categoryId === cat.id
                    );
                    return (
                      <div
                        key={cat.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{cat.name}</h4>
                            {cat.requiresPatientInfo ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Patient Tracking
                              </span>
                            ) : null}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteCatId(cat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {catIndicators.length} indicator{catIndicators.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indicators Tab */}
        <TabsContent value="indicators">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Indicators (KPIs)</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setIndForm({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
                  setIndDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Indicator
              </Button>
            </CardHeader>
            <CardContent>
              {indicators.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No indicators yet. Create categories first.
                </p>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat: Category) => {
                    const catIndicators = indicators.filter(
                      (ind: Indicator) => ind.categoryId === cat.id
                    );
                    if (catIndicators.length === 0) return null;

                    return (
                      <div key={cat.id}>
                        <h4 className="font-semibold text-sm mb-3 text-muted-foreground">
                          {cat.name}
                        </h4>
                        <div className="space-y-2 ml-4">
                          {catIndicators.map((ind: Indicator) => (
                            <div
                              key={ind.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <div>
                                  <h5 className="font-medium text-sm">{ind.name}</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      Unit: {ind.unit || "cases"}
                                    </span>
                                    {ind.requiresPatientInfo ? (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Patient Tracking
                                      </span>
                                    ) : (
                                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded flex items-center gap-1">
                                        <X className="h-3 w-3" /> No Patient Tracking
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setDeleteIndId(ind.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDept ? "Edit Department" : "Create Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name *</Label>
              <Input
                id="dept-name"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g., Male Ward"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-desc">Description</Label>
              <Input
                id="dept-desc"
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDeptForm({ ...deptForm, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      deptForm.color === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeptSave} disabled={createDept.isPending || updateDept.isPending}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="e.g., Mandatory, Respiratory, Renal"
              />
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
              <input
                type="checkbox"
                id="patient-tracking"
                checked={catForm.requiresPatientInfo}
                onChange={(e) => setCatForm({ ...catForm, requiresPatientInfo: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="patient-tracking" className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">Enable Patient Tracking</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Allows recording Hospital ID and Patient Name for incidents in this category
                </p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCatSave} disabled={createCat.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Indicator Dialog */}
      <Dialog open={indDialog} onOpenChange={setIndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Indicator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ind-name">Indicator Name *</Label>
              <Input
                id="ind-name"
                value={indForm.name}
                onChange={(e) => setIndForm({ ...indForm, name: e.target.value })}
                placeholder="e.g., Fall Incidents"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ind-category">Category *</Label>
              <select
                id="ind-category"
                value={indForm.categoryId}
                onChange={(e) => setIndForm({ ...indForm, categoryId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={0}>Select a category</option>
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ind-unit">Unit of Measurement</Label>
              <Input
                id="ind-unit"
                value={indForm.unit}
                onChange={(e) => setIndForm({ ...indForm, unit: e.target.value })}
                placeholder="e.g., cases, sessions, incidents"
              />
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
              <input
                type="checkbox"
                id="ind-patient-tracking"
                checked={indForm.requiresPatientInfo}
                onChange={(e) => setIndForm({ ...indForm, requiresPatientInfo: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="ind-patient-tracking" className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">Track Patient Details</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Record Hospital ID and Patient Name for each case
                </p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndSave} disabled={createInd.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <AlertDialog open={deleteDeptId !== null} onOpenChange={() => setDeleteDeptId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Department?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the department and all associated KPI data. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDeptId) {
                  deleteDept.mutate({ id: deleteDeptId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCatId !== null} onOpenChange={() => setDeleteCatId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Category?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the category and all associated indicators. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCatId) {
                  deleteCat.mutate({ id: deleteCatId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteIndId !== null} onOpenChange={() => setDeleteIndId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Indicator?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the indicator and all associated data. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteIndId) {
                  deleteInd.mutate({ id: deleteIndId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
