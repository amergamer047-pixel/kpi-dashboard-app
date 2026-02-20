"use client";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect } from "react";
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
import { ColorPaletteSettings } from "@/components/ColorPaletteSettings";
import { Checkbox } from "@/components/ui/checkbox";

const DEPARTMENT_COLORS = [
  "#3B82F6", "#22C55E", "#EF4444", "#F59E0B",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kpiDashboardColorPalette") || "corporate";
    }
    return "corporate";
  });

  useEffect(() => {
    localStorage.setItem("kpiDashboardColorPalette", selectedColorPalette);
    window.dispatchEvent(
      new CustomEvent("colorPaletteChanged", { detail: { paletteId: selectedColorPalette } })
    );
  }, [selectedColorPalette]);

  // ===== DEPARTMENTS =====
  const { data: departments = [], isLoading: deptLoading } = trpc.departments.list.useQuery();
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#3B82F6" });
  const [deptToDelete, setDeptToDelete] = useState<number | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Set first department as selected by default
  useEffect(() => {
    if (departments.length > 0 && !selectedDepartmentId) {
      setSelectedDepartmentId(departments[0].id);
    }
  }, [departments, selectedDepartmentId]);

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

  const bulkDeleteDepts = trpc.departments.bulkDelete.useMutation({
    onSuccess: (result) => {
      utils.departments.list.invalidate();
      setShowBulkDeleteDialog(false);
      toast.success(`Deleted ${result.deletedCount} departments`);
    },
    onError: (err) => toast.error("Failed to delete departments"),
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
  const { data: allCategories = [], isLoading: catLoading } = trpc.categories.list.useQuery();
  const categories = useMemo(() => {
    if (!selectedDepartmentId) return allCategories;
    return allCategories.filter(cat => true);
  }, [allCategories, selectedDepartmentId]);
  
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", requiresPatientInfo: false });
  const [catToDelete, setCatToDelete] = useState<number | null>(null);
  const [selectedCatIds, setSelectedCatIds] = useState<Set<number>>(new Set());
  const [showCatBulkDeleteDialog, setShowCatBulkDeleteDialog] = useState(false);
  
  const bulkDeleteCat = trpc.categories.bulkDelete.useMutation({
    onSuccess: (result) => {
      utils.categories.list.invalidate();
      utils.indicators.list.invalidate();
      setShowCatBulkDeleteDialog(false);
      setSelectedCatIds(new Set());
      toast.success(`Deleted ${result.deletedCount} categories`);
    },
    onError: (err) => toast.error("Failed to delete categories"),
  });

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

  const handleCatCheckboxChange = (catId: number) => {
    const newSet = new Set(selectedCatIds);
    if (newSet.has(catId)) {
      newSet.delete(catId);
    } else {
      newSet.add(catId);
    }
    setSelectedCatIds(newSet);
  };
  
  const handleCatSelectAll = () => {
    if (selectedCatIds.size === categories.length) {
      setSelectedCatIds(new Set());
    } else {
      setSelectedCatIds(new Set(categories.map((c: any) => c.id)));
    }
  };

  // ===== INDICATORS =====
  const { data: allIndicators = [], isLoading: indLoading } = trpc.indicators.list.useQuery();
  const indicators = useMemo(() => {
    if (!selectedDepartmentId) return allIndicators;
    return allIndicators.filter(ind => true);
  }, [allIndicators, selectedDepartmentId]);
  
  const [showIndDialog, setShowIndDialog] = useState(false);
  const [editingInd, setEditingInd] = useState<any>(null);
  const [indForm, setIndForm] = useState({ name: "", categoryId: 0, unit: "", requiresPatientInfo: false });
  const [indToDelete, setIndToDelete] = useState<number | null>(null);
  const [selectedIndIds, setSelectedIndIds] = useState<Set<number>>(new Set());
  const [showIndBulkDeleteDialog, setShowIndBulkDeleteDialog] = useState(false);
  
  const bulkDeleteInd = trpc.indicators.bulkDelete.useMutation({
    onSuccess: (result) => {
      utils.indicators.list.invalidate();
      setShowIndBulkDeleteDialog(false);
      setSelectedIndIds(new Set());
      toast.success(`Deleted ${result.deletedCount} indicators`);
    },
    onError: (err) => toast.error("Failed to delete indicators"),
  });

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

  const handleIndCheckboxChange = (indId: number) => {
    const newSet = new Set(selectedIndIds);
    if (newSet.has(indId)) {
      newSet.delete(indId);
    } else {
      newSet.add(indId);
    }
    setSelectedIndIds(newSet);
  };
  
  const handleIndSelectAll = () => {
    if (selectedIndIds.size === indicators.length) {
      setSelectedIndIds(new Set());
    } else {
      setSelectedIndIds(new Set(indicators.map((i: any) => i.id)));
    }
  };
  
  // Clear selections when data changes
  useEffect(() => {
    setSelectedCatIds(new Set());
  }, [categories]);
  
  useEffect(() => {
    setSelectedIndIds(new Set());
  }, [indicators]);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">KPI Configuration</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Manage departments, categories, and KPI indicators</p>
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 sm:mb-6 gap-1 sm:gap-2">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* DEPARTMENTS TAB */}
          <TabsContent value="departments">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <CardTitle className="text-lg sm:text-xl">Manage Departments</CardTitle>
                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkDeleteDialog(true)}
                  >
                    Delete All
                  </Button>
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
                </div>
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
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <CardTitle className="text-lg sm:text-xl">Manage Categories</CardTitle>
                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                  {selectedCatIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowCatBulkDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedCatIds.size})
                    </Button>
                  )}
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
                </div>
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
                    {/* Select All Row */}
                    <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedCatIds.size === categories.length && categories.length > 0}
                          onCheckedChange={handleCatSelectAll}
                        />
                        <span className="font-medium text-sm">Select All</span>
                      </div>
                      {selectedCatIds.size > 0 && (
                        <span className="text-sm text-muted-foreground">{selectedCatIds.size} selected</span>
                      )}
                    </div>

                    {/* Category Items */}
                    {categories.map((cat: any) => {
                      const catInds = indicators.filter((ind: any) => ind.categoryId === cat.id);
                      const isSelected = selectedCatIds.has(cat.id);
                      return (
                        <div
                          key={cat.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleCatCheckboxChange(cat.id)}
                              />
                              <div>
                                <h4 className="font-medium">{cat.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {catInds.length} indicator{catInds.length !== 1 ? "s" : ""}
                                </p>
                              </div>
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
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <CardTitle className="text-lg sm:text-xl">Manage Indicators</CardTitle>
                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                  {selectedIndIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowIndBulkDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedIndIds.size})
                    </Button>
                  )}
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
                </div>
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
                    {/* Select All Row */}
                    <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedIndIds.size === indicators.length && indicators.length > 0}
                          onCheckedChange={handleIndSelectAll}
                        />
                        <span className="font-medium text-sm">Select All</span>
                      </div>
                      {selectedIndIds.size > 0 && (
                        <span className="text-sm text-muted-foreground">{selectedIndIds.size} selected</span>
                      )}
                    </div>

                    {/* Indicator Items */}
                    {indicators.map((ind: any) => {
                      const cat = categories.find((c: any) => c.id === ind.categoryId);
                      const isSelected = selectedIndIds.has(ind.id);
                      return (
                        <div
                          key={ind.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleIndCheckboxChange(ind.id)}
                              />
                              <div>
                                <h4 className="font-medium">{ind.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {cat?.name || "Unknown Category"} • {ind.unit || "cases"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {ind.requiresPatientInfo && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Patient Tracking
                                </span>
                              )}
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

          {/* APPEARANCE TAB */}
          <TabsContent value="appearance">
            <ColorPaletteSettings
              selectedPalette={selectedColorPalette}
              onPaletteChange={setSelectedColorPalette}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOGS */}
      {/* Department Dialog */}
      <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Create Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department Name</Label>
              <Input
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g., ICU Ward"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      deptForm.color === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setDeptForm({ ...deptForm, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeptSave}>
              {editingDept ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="e.g., Mandatory"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={catForm.requiresPatientInfo}
                onCheckedChange={(checked) =>
                  setCatForm({ ...catForm, requiresPatientInfo: checked === true })
                }
              />
              <Label>Requires Patient Tracking</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCatSave}>
              {editingCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Indicator Dialog */}
      <Dialog open={showIndDialog} onOpenChange={setShowIndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInd ? "Edit Indicator" : "Create Indicator"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Indicator Name</Label>
              <Input
                value={indForm.name}
                onChange={(e) => setIndForm({ ...indForm, name: e.target.value })}
                placeholder="e.g., Fall Incidents"
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={indForm.categoryId}
                onChange={(e) => setIndForm({ ...indForm, categoryId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value={0}>Select a category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Unit</Label>
              <Input
                value={indForm.unit}
                onChange={(e) => setIndForm({ ...indForm, unit: e.target.value })}
                placeholder="e.g., cases"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={indForm.requiresPatientInfo}
                onCheckedChange={(checked) =>
                  setIndForm({ ...indForm, requiresPatientInfo: checked === true })
                }
              />
              <Label>Requires Patient Tracking</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndSave}>
              {editingInd ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      {/* Department Delete */}
      <AlertDialog open={deptToDelete !== null} onOpenChange={(open) => !open && setDeptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Department?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All categories and indicators associated with this department will be deleted.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deptToDelete && deleteDept.mutate({ id: deptToDelete })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Departments */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete All Departments?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete all {departments.length} departments and all their associated categories and indicators. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteDepts.mutate({ ids: departments.map(d => d.id) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Delete */}
      <AlertDialog open={catToDelete !== null} onOpenChange={(open) => !open && setCatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Category?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All indicators in this category will be deleted.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => catToDelete && deleteCat.mutate({ id: catToDelete })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Categories */}
      <AlertDialog open={showCatBulkDeleteDialog} onOpenChange={setShowCatBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {selectedCatIds.size} Categories?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete {selectedCatIds.size} selected categories and all their associated indicators. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteCat.mutate({ ids: Array.from(selectedCatIds) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Indicator Delete */}
      <AlertDialog open={indToDelete !== null} onOpenChange={(open) => !open && setIndToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Indicator?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => indToDelete && deleteInd.mutate({ id: indToDelete })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Indicators */}
      <AlertDialog open={showIndBulkDeleteDialog} onOpenChange={setShowIndBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {selectedIndIds.size} Indicators?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete {selectedIndIds.size} selected indicators. This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteInd.mutate({ ids: Array.from(selectedIndIds) })}
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
