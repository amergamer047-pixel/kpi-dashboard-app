import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface EditKpiEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id?: number;
    value: string;
    notes?: string;
    indicatorName: string;
    month: string;
  } | null;
  onSave: (data: { value: string; notes?: string }) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export function EditKpiEntryDialog({
  open,
  onOpenChange,
  entry,
  onSave,
  onDelete,
  isLoading = false,
}: EditKpiEntryDialogProps) {
  const [value, setValue] = useState(entry?.value || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (!value.trim()) {
      toast.error("Please enter a value");
      return;
    }

    onSave({
      value: value.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  if (!entry) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit KPI Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{entry.indicatorName}</span>
                {" - "}
                <span className="text-gray-600">{entry.month}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter KPI value"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-between">
            <div>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete KPI Entry
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600">
            Are you sure you want to delete this KPI entry for{" "}
            <span className="font-semibold">{entry.indicatorName}</span> in{" "}
            <span className="font-semibold">{entry.month}</span>? This action
            cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
