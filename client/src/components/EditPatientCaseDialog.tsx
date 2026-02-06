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

interface EditPatientCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientCase: {
    id: number;
    hospitalId: string;
    patientName: string;
    notes?: string;
    indicatorName: string;
    month: string;
  } | null;
  onSave: (data: {
    hospitalId: string;
    patientName: string;
    notes?: string;
  }) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export function EditPatientCaseDialog({
  open,
  onOpenChange,
  patientCase,
  onSave,
  onDelete,
  isLoading = false,
}: EditPatientCaseDialogProps) {
  const [hospitalId, setHospitalId] = useState(patientCase?.hospitalId || "");
  const [patientName, setPatientName] = useState(patientCase?.patientName || "");
  const [notes, setNotes] = useState(patientCase?.notes || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (!hospitalId.trim() || !patientName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    onSave({
      hospitalId: hospitalId.trim(),
      patientName: patientName.trim(),
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

  if (!patientCase) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Patient Case</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{patientCase.indicatorName}</span>
                {" - "}
                <span className="text-gray-600">{patientCase.month}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="hospitalId">Hospital ID *</Label>
              <Input
                id="hospitalId"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                placeholder="e.g., PT-2026-001"
              />
            </div>

            <div>
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g., John Doe"
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
              Delete Patient Case
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600">
            Are you sure you want to delete this patient case for{" "}
            <span className="font-semibold">{patientCase.patientName}</span> (ID:{" "}
            <span className="font-semibold">{patientCase.hospitalId}</span>)? This
            action cannot be undone.
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
              Delete Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
