import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Save, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

type Status = "not_started" | "in_progress" | "complete" | "overdue" | "on_hold";
type Priority = "low" | "medium" | "high";
type Risk = "low" | "medium" | "high";

interface KpiEntry {
  id: number;
  name: string;
  assignedTo: string | null;
  startDate: Date | null;
  endDate: Date | null;
  targetValue: string | null;
  actualValue: string | null;
  unit: string | null;
  status: Status;
  risk: Risk;
  priority: Priority;
  comments: string | null;
  departmentId: number;
}

interface KpiSpreadsheetProps {
  departmentId: number;
  departmentName: string;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "overdue", label: "Overdue" },
  { value: "on_hold", label: "On Hold" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const RISK_OPTIONS: { value: Risk; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function StatusBadge({ status }: { status: Status }) {
  const statusClasses: Record<Status, string> = {
    not_started: "status-badge status-not-started",
    in_progress: "status-badge status-in-progress",
    complete: "status-badge status-complete",
    overdue: "status-badge status-overdue",
    on_hold: "status-badge status-on-hold",
  };
  const statusLabels: Record<Status, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    complete: "Complete",
    overdue: "Overdue",
    on_hold: "On Hold",
  };
  return <span className={statusClasses[status]}>{statusLabels[status]}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const classes: Record<Priority, string> = {
    high: "status-badge priority-high",
    medium: "status-badge priority-medium",
    low: "status-badge priority-low",
  };
  return <span className={classes[priority]}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

function RiskBadge({ risk }: { risk: Risk }) {
  const classes: Record<Risk, string> = {
    high: "status-badge risk-high",
    medium: "status-badge risk-medium",
    low: "status-badge risk-low",
  };
  return <span className={classes[risk]}>{risk.charAt(0).toUpperCase() + risk.slice(1)}</span>;
}

export function KpiSpreadsheet({ departmentId, departmentName }: KpiSpreadsheetProps) {
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.entries.list.useQuery({ departmentId });
  const { data: templates = [] } = trpc.templates.list.useQuery();
  
  const createEntry = trpc.entries.create.useMutation({
    onSuccess: () => {
      utils.entries.list.invalidate();
      utils.analytics.stats.invalidate();
      toast.success("KPI entry added");
    },
  });
  
  const updateEntry = trpc.entries.update.useMutation({
    onSuccess: () => {
      utils.entries.list.invalidate();
      utils.analytics.stats.invalidate();
    },
  });
  
  const deleteEntry = trpc.entries.delete.useMutation({
    onSuccess: () => {
      utils.entries.list.invalidate();
      utils.analytics.stats.invalidate();
      toast.success("KPI entry deleted");
    },
  });

  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (id: number, field: string, currentValue: string | null) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || "");
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const { id, field } = editingCell;
      const entry = entries.find((e: KpiEntry) => e.id === id);
      if (entry) {
        const currentValue = entry[field as keyof KpiEntry];
        const currentStr = currentValue instanceof Date 
          ? currentValue.toISOString().split('T')[0] 
          : (currentValue?.toString() || "");
        
        if (editValue !== currentStr) {
          let updateData: Record<string, unknown> = {};
          
          if (field === "startDate" || field === "endDate") {
            updateData[field] = editValue ? new Date(editValue) : null;
          } else if (field === "targetValue" || field === "actualValue") {
            updateData[field] = editValue || null;
          } else {
            updateData[field] = editValue;
          }
          
          updateEntry.mutate({ id, ...updateData });
        }
      }
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleSelectChange = (id: number, field: string, value: string) => {
    updateEntry.mutate({ id, [field]: value });
  };

  const handleAddFromTemplate = (template: { name: string; description: string | null; unit: string | null; targetValue: string | null }) => {
    createEntry.mutate({
      departmentId,
      name: template.name,
      description: template.description || undefined,
      unit: template.unit || undefined,
      targetValue: template.targetValue || undefined,
      status: "not_started",
      risk: "low",
      priority: "medium",
    });
    setShowTemplateDialog(false);
  };

  const handleAddBlankRow = () => {
    createEntry.mutate({
      departmentId,
      name: "New KPI",
      status: "not_started",
      risk: "low",
      priority: "medium",
    });
  };

  const handleDeleteRow = (id: number) => {
    if (confirm("Are you sure you want to delete this KPI entry?")) {
      deleteEntry.mutate({ id });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().split('T')[0];
  };

  const calculateDuration = (start: Date | null, end: Date | null) => {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  };

  const calculateVariance = (target: string | null, actual: string | null) => {
    if (!target || !actual) return "";
    const t = parseFloat(target);
    const a = parseFloat(actual);
    if (isNaN(t) || isNaN(a) || t === 0) return "";
    const variance = ((a - t) / t) * 100;
    return variance.toFixed(1) + "%";
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted rounded w-full"></div>
          <div className="h-8 bg-muted rounded w-full"></div>
          <div className="h-8 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {departmentName} - KPI Table
        </h3>
        <div className="flex gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add from Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add KPI from Template</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 mt-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleAddFromTemplate(template)}
                    className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {template.category} • Target: {template.targetValue} {template.unit}
                    </div>
                    {template.description && (
                      <div className="text-sm text-muted-foreground mt-1">{template.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="default" size="sm" onClick={handleAddBlankRow}>
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="w-[200px]">KPI Name</th>
              <th className="w-[120px]">Assigned To</th>
              <th className="w-[110px]">Start Date</th>
              <th className="w-[110px]">End Date</th>
              <th className="w-[80px]">Duration</th>
              <th className="w-[90px]">Target</th>
              <th className="w-[90px]">Actual</th>
              <th className="w-[80px]">Variance</th>
              <th className="w-[60px]">Unit</th>
              <th className="w-[110px]">Status</th>
              <th className="w-[90px]">Risk</th>
              <th className="w-[90px]">Priority</th>
              <th className="w-[150px]">Comments</th>
              <th className="w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center py-8 text-muted-foreground">
                  No KPI entries yet. Click "Add Row" or "Add from Template" to get started.
                </td>
              </tr>
            ) : (
              entries.map((entry: KpiEntry) => (
                <tr key={entry.id}>
                  {/* Name */}
                  <td
                    className="excel-cell cursor-pointer"
                    onClick={() => handleCellClick(entry.id, "name", entry.name)}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "name" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input"
                      />
                    ) : (
                      <span className="font-medium">{entry.name}</span>
                    )}
                  </td>

                  {/* Assigned To */}
                  <td
                    className="excel-cell cursor-pointer"
                    onClick={() => handleCellClick(entry.id, "assignedTo", entry.assignedTo)}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "assignedTo" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input"
                      />
                    ) : (
                      entry.assignedTo || "-"
                    )}
                  </td>

                  {/* Start Date */}
                  <td
                    className="excel-cell cursor-pointer"
                    onClick={() => handleCellClick(entry.id, "startDate", formatDate(entry.startDate))}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "startDate" ? (
                      <input
                        ref={inputRef}
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input"
                      />
                    ) : (
                      formatDate(entry.startDate) || "-"
                    )}
                  </td>

                  {/* End Date */}
                  <td
                    className="excel-cell cursor-pointer"
                    onClick={() => handleCellClick(entry.id, "endDate", formatDate(entry.endDate))}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "endDate" ? (
                      <input
                        ref={inputRef}
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input"
                      />
                    ) : (
                      formatDate(entry.endDate) || "-"
                    )}
                  </td>

                  {/* Duration (calculated) */}
                  <td className="excel-cell bg-muted/30 text-center">
                    {calculateDuration(entry.startDate, entry.endDate) || "-"}
                  </td>

                  {/* Target Value */}
                  <td
                    className="excel-cell cursor-pointer text-right"
                    onClick={() => handleCellClick(entry.id, "targetValue", entry.targetValue)}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "targetValue" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input text-right"
                      />
                    ) : (
                      entry.targetValue || "-"
                    )}
                  </td>

                  {/* Actual Value */}
                  <td
                    className="excel-cell cursor-pointer text-right"
                    onClick={() => handleCellClick(entry.id, "actualValue", entry.actualValue)}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "actualValue" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input text-right"
                      />
                    ) : (
                      entry.actualValue || "-"
                    )}
                  </td>

                  {/* Variance (calculated) */}
                  <td className="excel-cell bg-muted/30 text-right">
                    {calculateVariance(entry.targetValue, entry.actualValue) || "-"}
                  </td>

                  {/* Unit */}
                  <td
                    className="excel-cell cursor-pointer"
                    onClick={() => handleCellClick(entry.id, "unit", entry.unit)}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "unit" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input"
                      />
                    ) : (
                      entry.unit || "-"
                    )}
                  </td>

                  {/* Status */}
                  <td className="excel-cell p-1">
                    <Select
                      value={entry.status}
                      onValueChange={(value) => handleSelectChange(entry.id, "status", value)}
                    >
                      <SelectTrigger className="h-7 border-0 shadow-none">
                        <StatusBadge status={entry.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <StatusBadge status={opt.value} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Risk */}
                  <td className="excel-cell p-1">
                    <Select
                      value={entry.risk}
                      onValueChange={(value) => handleSelectChange(entry.id, "risk", value)}
                    >
                      <SelectTrigger className="h-7 border-0 shadow-none">
                        <RiskBadge risk={entry.risk} />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <RiskBadge risk={opt.value} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Priority */}
                  <td className="excel-cell p-1">
                    <Select
                      value={entry.priority}
                      onValueChange={(value) => handleSelectChange(entry.id, "priority", value)}
                    >
                      <SelectTrigger className="h-7 border-0 shadow-none">
                        <PriorityBadge priority={entry.priority} />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <PriorityBadge priority={opt.value} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Comments */}
                  <td
                    className="excel-cell cursor-pointer"
                    onClick={() => handleCellClick(entry.id, "comments", entry.comments)}
                  >
                    {editingCell?.id === entry.id && editingCell?.field === "comments" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="excel-cell-input"
                      />
                    ) : (
                      <span className="truncate block max-w-[140px]">{entry.comments || "-"}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="excel-cell p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRow(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {entries.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {entries.length} KPI entries • Click any cell to edit
        </div>
      )}
    </div>
  );
}
