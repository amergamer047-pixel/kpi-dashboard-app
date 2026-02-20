import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  isFrozen?: number | null;
}

interface BulkDepartmentOpsProps {
  departments: Department[];
  onRefresh: () => void;
}

export function BulkDepartmentOps({ departments, onRefresh }: BulkDepartmentOpsProps) {
  const [selectedDepts, setSelectedDepts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [freezeAction, setFreezeAction] = useState<"freeze" | "unfreeze">("freeze");
  const utils = trpc.useUtils();

  const bulkDeleteDepts = trpc.departments.bulkDelete.useMutation({
    onSuccess: (result) => {
      utils.departments.list.invalidate();
      setSelectedDepts(new Set());
      setSelectAll(false);
      setShowDeleteConfirm(false);
      toast.success(`${result.deletedCount} department(s) deleted`);
      onRefresh();
    },
    onError: (error) => {
      toast.error("Failed to delete departments");
    },
  });

  const bulkFreezeDepts = trpc.departments.bulkFreeze.useMutation({
    onSuccess: (result) => {
      utils.departments.list.invalidate();
      setShowFreezeConfirm(false);
      const action = result.isFrozen ? "frozen" : "unfrozen";
      toast.success(`${result.updatedCount} department(s) ${action}`);
      onRefresh();
    },
    onError: (error) => {
      toast.error("Failed to update departments");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedDepts(new Set(departments.map(d => d.id)));
    } else {
      setSelectedDepts(new Set());
    }
  };

  const handleSelectDept = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedDepts);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedDepts(newSelected);
    setSelectAll(newSelected.size === departments.length);
  };

  const handleBulkDelete = () => {
    if (selectedDepts.size === 0) {
      toast.error("Please select departments to delete");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleBulkFreeze = (freeze: boolean) => {
    if (selectedDepts.size === 0) {
      toast.error("Please select departments");
      return;
    }
    setFreezeAction(freeze ? "freeze" : "unfreeze");
    setShowFreezeConfirm(true);
  };

  const confirmDelete = () => {
    bulkDeleteDepts.mutate({ ids: Array.from(selectedDepts) });
  };

  const confirmFreeze = () => {
    bulkFreezeDepts.mutate({ ids: Array.from(selectedDepts), isFrozen: freezeAction === "freeze" });
  };

  return (
    <div className="space-y-4">
      {selectedDepts.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {selectedDepts.size} department(s) selected
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteDepts.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkFreeze(true)}
              disabled={bulkFreezeDepts.isPending}
            >
              <Lock className="h-4 w-4 mr-2" />
              Freeze Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkFreeze(false)}
              disabled={bulkFreezeDepts.isPending}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Unfreeze Selected
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
          <Checkbox
            checked={selectAll}
            onCheckedChange={handleSelectAll}
          />
          <span className="font-medium text-sm">Select All Departments</span>
        </div>

        {departments.map((dept) => (
          <div
            key={dept.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <Checkbox
                checked={selectedDepts.has(dept.id)}
                onCheckedChange={(checked) => handleSelectDept(dept.id, checked as boolean)}
              />
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: dept.color || "#3B82F6" }}
              />
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  {dept.name}
                  {dept.isFrozen === 1 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Frozen
                    </span>
                  )}
                </h4>
                {dept.description && (
                  <p className="text-sm text-muted-foreground">{dept.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Departments?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedDepts.size} department(s)? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFreezeConfirm} onOpenChange={setShowFreezeConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {freezeAction === "freeze" ? "Freeze" : "Unfreeze"} Departments?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {freezeAction === "freeze"
              ? `Freeze ${selectedDepts.size} department(s)? Frozen departments will be read-only.`
              : `Unfreeze ${selectedDepts.size} department(s)? They will become editable again.`}
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFreeze}>
              {freezeAction === "freeze" ? "Freeze" : "Unfreeze"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
