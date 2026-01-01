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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
}

interface DepartmentManagerProps {
  selectedDepartmentId: number | null;
  onSelectDepartment: (id: number | null) => void;
}

const DEPARTMENT_COLORS = [
  "#3B82F6", // Blue
  "#22C55E", // Green
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
];

export function DepartmentManager({ selectedDepartmentId, onSelectDepartment }: DepartmentManagerProps) {
  const utils = trpc.useUtils();
  const { data: departments = [], isLoading } = trpc.departments.list.useQuery();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#3B82F6" });

  const createDepartment = trpc.departments.create.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", color: "#3B82F6" });
      toast.success("Department created");
    },
  });

  const updateDepartment = trpc.departments.update.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      setIsEditOpen(false);
      setEditingDepartment(null);
      toast.success("Department updated");
    },
  });

  const deleteDepartment = trpc.departments.delete.useMutation({
    onSuccess: () => {
      utils.departments.list.invalidate();
      utils.monthlyData.get.invalidate();
      utils.patientCases.listByDepartment.invalidate();
      if (selectedDepartmentId === editingDepartment?.id) {
        onSelectDepartment(null);
      }
      toast.success("Department deleted");
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    createDepartment.mutate({
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
    });
  };

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      color: dept.color || "#3B82F6",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingDepartment || !formData.name.trim()) return;
    updateDepartment.mutate({
      id: editingDepartment.id,
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
    });
  };

  const handleDelete = (dept: Department) => {
    if (confirm(`Are you sure you want to delete "${dept.name}"? All KPI entries in this department will also be deleted.`)) {
      deleteDepartment.mutate({ id: dept.id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Departments
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Department"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createDepartment.isPending}>
                {createDepartment.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Departments option */}
      <button
        onClick={() => onSelectDepartment(null)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
          selectedDepartmentId === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        }`}
      >
        <Building2 className="h-4 w-4" />
        <span className="font-medium">All Departments</span>
      </button>

      {/* Department list */}
      {departments.map((dept: Department) => (
        <div
          key={dept.id}
          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
            selectedDepartmentId === dept.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <button
            onClick={() => onSelectDepartment(dept.id)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dept.color || "#3B82F6" }}
            />
            <span className="font-medium truncate">{dept.name}</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${
                  selectedDepartmentId === dept.id ? "hover:bg-primary-foreground/20" : ""
                }`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(dept)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(dept)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {departments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No departments yet. Create one to get started.
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {DEPARTMENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateDepartment.isPending}>
              {updateDepartment.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
