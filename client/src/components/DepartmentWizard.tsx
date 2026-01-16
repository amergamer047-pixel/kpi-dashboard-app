import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Category {
  name: string;
  requiresPatientTracking: boolean;
  indicators: {
    name: string;
    unit: string;
  }[];
}

export function DepartmentWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [deptName, setDeptName] = useState("");
  const [deptColor, setDeptColor] = useState("#3B82F6");
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCatName, setCurrentCatName] = useState("");
  const [currentCatPatient, setCurrentCatPatient] = useState(false);
  const [currentCatIndicators, setCurrentCatIndicators] = useState<
    { name: string; unit: string }[]
  >([]);
  const [newIndName, setNewIndName] = useState("");
  const [newIndUnit, setNewIndUnit] = useState("cases");

  const createDeptMutation = trpc.departments.create.useMutation();
  const createCatMutation = trpc.categories.create.useMutation();
  const createIndMutation = trpc.indicators.create.useMutation();

  const handleAddIndicator = () => {
    if (!newIndName.trim()) {
      toast.error("Indicator name is required");
      return;
    }
    setCurrentCatIndicators([
      ...currentCatIndicators,
      { name: newIndName, unit: newIndUnit },
    ]);
    setNewIndName("");
    setNewIndUnit("cases");
  };

  const handleRemoveIndicator = (index: number) => {
    setCurrentCatIndicators(currentCatIndicators.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    if (!currentCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (currentCatIndicators.length === 0) {
      toast.error("Add at least one indicator to the category");
      return;
    }
    setCategories([
      ...categories,
      {
        name: currentCatName,
        requiresPatientTracking: currentCatPatient,
        indicators: currentCatIndicators,
      },
    ]);
    setCurrentCatName("");
    setCurrentCatPatient(false);
    setCurrentCatIndicators([]);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCreateDepartment = async () => {
    if (!deptName.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (categories.length === 0) {
      toast.error("Add at least one category");
      return;
    }

    try {
      // Create department
      const dept = await createDeptMutation.mutateAsync({
        name: deptName,
        color: deptColor,
      });

      // Create categories and indicators
      for (const cat of categories) {
        const category = await createCatMutation.mutateAsync({
          name: cat.name,
          requiresPatientInfo: cat.requiresPatientTracking,
        });

        // Create indicators for this category
        for (const ind of cat.indicators) {
          await createIndMutation.mutateAsync({
            categoryId: category.id,
            name: ind.name,
            unit: ind.unit,
          });
        }
      }

      toast.success("Department created successfully!");
      setOpen(false);
      resetWizard();
    } catch (error) {
      toast.error("Failed to create department");
      console.error(error);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setDeptName("");
    setDeptColor("#3B82F6");
    setCategories([]);
    setCurrentCatName("");
    setCurrentCatPatient(false);
    setCurrentCatIndicators([]);
    setNewIndName("");
    setNewIndUnit("cases");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={18} /> Add Department
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Department with Categories & KPIs</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Department Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 1: Department Details</h3>
              <div>
                <Label htmlFor="deptName">Department Name</Label>
                <Input
                  id="deptName"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g., Male Ward, ICU, Emergency"
                />
              </div>
              <div>
                <Label htmlFor="deptColor">Department Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="deptColor"
                    type="color"
                    value={deptColor}
                    onChange={(e) => setDeptColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <div
                    className="flex-1 rounded border"
                    style={{ backgroundColor: deptColor }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Categories & Indicators */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 2: Add Categories & KPIs</h3>

              {/* Current Category Form */}
              <div className="border rounded-lg p-4 space-y-4 bg-blue-50">
                <h4 className="font-semibold">Add Category</h4>
                <div>
                  <Label htmlFor="catName">Category Name</Label>
                  <Input
                    id="catName"
                    value={currentCatName}
                    onChange={(e) => setCurrentCatName(e.target.value)}
                    placeholder="e.g., Mandatory, Respiratory, Renal"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="patientTracking"
                    type="checkbox"
                    checked={currentCatPatient}
                    onChange={(e) => setCurrentCatPatient(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="patientTracking" className="mb-0">
                    Enable Patient Tracking (Hospital ID & Name)
                  </Label>
                </div>

                {/* Add Indicators */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm">Add KPI Indicators</h5>
                  <div className="flex gap-2">
                    <Input
                      value={newIndName}
                      onChange={(e) => setNewIndName(e.target.value)}
                      placeholder="Indicator name"
                    />
                    <Input
                      value={newIndUnit}
                      onChange={(e) => setNewIndUnit(e.target.value)}
                      placeholder="Unit"
                      className="w-24"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddIndicator}
                      className="gap-1"
                    >
                      <Plus size={14} /> Add
                    </Button>
                  </div>

                  {/* Indicators List */}
                  {currentCatIndicators.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {currentCatIndicators.map((ind, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded border"
                        >
                          <div className="text-sm">
                            <span className="font-medium">{ind.name}</span>
                            <span className="text-gray-500 ml-2">({ind.unit})</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveIndicator(idx)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddCategory}
                  className="w-full"
                  disabled={!currentCatName || currentCatIndicators.length === 0}
                >
                  Add This Category
                </Button>
              </div>

              {/* Categories List */}
              {categories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Categories Added</h4>
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded bg-gray-50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold">{cat.name}</h5>
                          {cat.requiresPatientTracking && (
                            <p className="text-xs text-gray-600">
                              ✓ Patient tracking enabled
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCategory(idx)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {cat.indicators.map((ind, indIdx) => (
                          <div key={indIdx}>
                            • {ind.name} ({ind.unit})
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Step 3: Review & Create</h3>
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div>
                  <h4 className="font-semibold">Department</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: deptColor }}
                    />
                    <span>{deptName}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Categories & KPIs</h4>
                  <div className="space-y-3">
                    {categories.map((cat, idx) => (
                      <div key={idx} className="border rounded p-3 bg-white">
                        <h5 className="font-semibold text-sm">{cat.name}</h5>
                        {cat.requiresPatientTracking && (
                          <p className="text-xs text-blue-600 mt-1">
                            ✓ Patient tracking enabled
                          </p>
                        )}
                        <ul className="text-sm text-gray-600 mt-2 space-y-1">
                          {cat.indicators.map((ind, indIdx) => (
                            <li key={indIdx}>• {ind.name} ({ind.unit})</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else setOpen(false);
              }}
              className="gap-2"
            >
              <ChevronLeft size={16} />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step < 3 && (
              <Button
                onClick={() => {
                  if (step === 1 && !deptName.trim()) {
                    toast.error("Enter department name");
                    return;
                  }
                  if (step === 2 && categories.length === 0) {
                    toast.error("Add at least one category");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="gap-2"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleCreateDepartment}
                disabled={
                  createDeptMutation.isPending ||
                  createCatMutation.isPending ||
                  createIndMutation.isPending
                }
              >
                {createDeptMutation.isPending ? "Creating..." : "Create Department"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
