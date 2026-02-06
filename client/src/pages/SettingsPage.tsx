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

const DEPARTMENT_COLORS = [
  "#3B82F6", "#22C55E", "#EF4444", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

export default function SettingsPage() {
  const utils = trpc.useUtils();

  // ===== DEPARTMENTS =====
  const { data: departments = [], isLoading: deptLoading } = trpc.departments.list.useQuery();
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3B82F6" });
  const [deptToDelete, setDeptToDelete] = useState<number | null>(null);

  const createDept = trpc.departments.create.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setShowDeptDialog(false);
      setDeptForm({ name: "", description: "", color: "#3B82F6" });
      toast.success("Department created successfully");
    },
    onError: (err) => toast.error("Failed to create department"),
  });

  const updateDept = trpc.departments.update.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setShowDeptDialog(false);
      setEditingDept(null);
      setDeptForm({ name: "", description: "", color: "#3B82F6" });
      toast.success("Department updated successfully");
    },
    onError: (err) => toast.error("Failed to update department"),
  });

  const deleteDept = trpc.departments.delete.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setDeptToDelete(null);
      toast.success("Department deleted successfully");
    },
    onError: (err) => toast.error("Failed to delete department"),
  });

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

  const handleDeptEdit = (dept: any) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || "",
      color: dept.color || "#3B82F6",
    });
    setShowDeptDialog(true);
  };

  // ===== CATEGORIES =====
  const { data: categories = [], isLoading: catLoading } = trpc.categories.list.useQuery();
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", requiresPatientInfo: false });
  const [catToDelete, setCatToDelete] = useState<number | null>(null);

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setShowCatDialog(false);
      setCatForm({ name: "", requiresPatientInfo: false });
      toast.success("Category created successfully");
    },
    onError: (err) => toast.error("Failed to create category"),
  });

  const updateCat = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      setShowCatDialog(false);
      setEditingCat(null);
      setCatForm({ name: "", requiresPatientInfo: false });
      toast.success("Category updated successfully");
    },
    onError: (err) => toast.error("Failed to update category"),
  });

  const deleteCat = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      utils.indicators.list.invalidate();
      setCatToDelete(null);
      toast.success("Category deleted successfully");
    },
    onError: (err) => toast.error("Failed to delete category"),
  });

  const handleCatSave = () => {
    if (!catForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (editingCat) {
      updateCat.mutate({
        id: editingCat.id,
        name: catForm.name,
        requiresPatientInfo: catForm.requiresPatientInfo,
      });
    } else {
      createCat.mutate({
        name: catForm.name,
        requiresPatientInfo: catForm.requiresPatientInfo,
      });
    }
  };

  const handleCatEdit = (cat: any) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      requiresPatientInfo: cat.requiresPatientInfo === 1,
    });
    setShowCatDialog(true);
  };

  // ===== INDICATORS =====
  const { data: indicators = [], isLoading: indLoading } = trpc.indicators.list.useQuery();
  const [showIndDialog, setShowIndDialog] = useState(false);
  const [editingInd, setEditingInd] = useState<any>(null);
  const [indForm, setIndForm] = useState({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
  const [indToDelete, setIndToDelete] = useState<number | null>(null);

  const createInd = trpc.indicators.create.useMutation({
    onSuccess: () => {
      utils.indicators.list.invalidate();
      setShowIndDialog(false);
      setIndForm({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
      toast.success("Indicator created successfully");
    },
    onError: (err) => toast.error("Failed to create indicator"),
  });

  const updateInd = trpc.indicators.update.useMutation({
    onSuccess: () => {
      utils.indicators.list.invalidate();
      setShowIndDialog(false);
      setIndForm({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
      toast.success("Indicator updated successfully");
    },
    onError: (err) => toast.error("Failed to update indicator"),
  });

  const deleteInd = trpc.indicators.delete.useMutation({
    onSuccess: () => {
      utils.indicators.list.invalidate();
      setIndToDelete(null);
      toast.success("Indicator deleted successfully");
    },
    onError: (err) => toast.error("Failed to delete indicator"),
  });

  const handleIndSave = () => {
    if (!indForm.name.trim()) {
      toast.error("Indicator name is required");
      return;
    }
    if (indForm.categoryId === 0) {
      toast.error("Please select a category");
      return;
    }
    if (editingInd) {
      updateInd.mutate({
        id: editingInd.id,
        categoryId: indForm.categoryId,
        name: indForm.name,
        unit: indForm.unit || "cases",
        requiresPatientInfo: indForm.requiresPatientInfo,
      });
    } else {
      createInd.mutate({
        categoryId: indForm.categoryId,
        name: indForm.name,
        unit: indForm.unit || "cases",
        requiresPatientInfo: indForm.requiresPatientInfo,
      });
    }
  };

  const handleIndEdit = (ind: any) => {
    setEditingInd(ind);
    setIndForm({
      name: ind.name,
      categoryId: ind.categoryId,
      unit: ind.unit || "cases",
      requiresPatientInfo: ind.requiresPatientInfo === 1,
    });
    setShowIndDialog(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">KPI Configuration</h1>
          <p className="text-muted-foreground mt-2">Manage departments, categories, and KPI indicators</p>
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
          </TabsList>

          {/* DEPARTMENTS TAB */}
          <TabsContent value="departments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Departments</CardTitle>
                <Button
                  onClick={() => {
                    setEditingDept(null);
                    setDeptForm({ name: "", description: "", color: "#3B82F6" });
                    setShowDeptDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </CardHeader>
              <CardContent>
                {deptLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No departments yet. Create one to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {departments.map((dept: any) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: dept.color || "#3B82F6" }}
                          />
                          <div>
                            <h4 className="font-medium">{dept.name}</h4>
                            {dept.description && (
                              <p className="text-sm text-muted-foreground">{dept.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeptEdit(dept)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeptToDelete(dept.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Categories</CardTitle>
                <Button
                  onClick={() => {
                    setEditingCat(null);
                    setCatForm({ name: "", requiresPatientInfo: false });
                    setShowCatDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                {catLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No categories yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((cat: any) => {
                      const catInds = indicators.filter((ind: any) => ind.categoryId === cat.id);
                      return (
                        <div
                          key={cat.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{cat.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {catInds.length} indicator{catInds.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {cat.requiresPatientInfo && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Patient Tracking
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCatEdit(cat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setCatToDelete(cat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INDICATORS TAB */}
          <TabsContent value="indicators">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Indicators</CardTitle>
                <Button
                  onClick={() => {
                    setEditingInd(null);
                    setIndForm({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
                    setShowIndDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Indicator
                </Button>
              </CardHeader>
              <CardContent>
                {indLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : indicators.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No indicators yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {indicators.map((ind: any) => {
                      const cat = categories.find((c: any) => c.id === ind.categoryId);
                      return (
                        <div
                          key={ind.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{ind.name}</h4>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {cat?.name || "Unknown"}
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  Unit: {ind.unit || "cases"}
                                </span>
                                {ind.requiresPatientInfo ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Patient Tracking
                                  </span>
                                ) : (
                                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                    <X className="h-3 w-3" /> No Patient Tracking
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleIndEdit(ind)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setIndToDelete(ind.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </div>

      {/* DEPARTMENT DIALOG */}
      <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Create Department"}</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowDeptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeptSave} disabled={createDept.isPending || updateDept.isPending}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Create Category"}</DialogTitle>
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
                id="cat-patient-tracking"
                checked={catForm.requiresPatientInfo}
                onChange={(e) => setCatForm({ ...catForm, requiresPatientInfo: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="cat-patient-tracking" className="flex-1 cursor-pointer">
                <span className="font-medium text-sm">Enable Patient Tracking</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Allows recording Hospital ID and Patient Name for incidents in this category
                </p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCatSave} disabled={createCat.isPending || updateCat.isPending}>
              {editingCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INDICATOR DIALOG */}
      <Dialog open={showIndDialog} onOpenChange={setShowIndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInd ? "Edit Indicator" : "Create Indicator"}</DialogTitle>
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
                {categories.map((cat: any) => (
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
            <Button variant="outline" onClick={() => setShowIndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndSave} disabled={createInd.isPending || updateInd.isPending}>
              {editingInd ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOGS */}
      <AlertDialog open={deptToDelete !== null} onOpenChange={() => setDeptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Department?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the department and all associated KPI data. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deptToDelete) {
                  deleteDept.mutate({ id: deptToDelete });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={catToDelete !== null} onOpenChange={() => setCatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Category?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the category and all associated indicators. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (catToDelete) {
                  deleteCat.mutate({ id: catToDelete });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={indToDelete !== null} onOpenChange={() => setIndToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Indicator?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the indicator and all associated data. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (indToDelete) {
                  deleteInd.mutate({ id: indToDelete });
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
