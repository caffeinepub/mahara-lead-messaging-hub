import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  MessageSquarePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Lead, type LeadCreate, LeadStatus } from "../backend";
import {
  useBulkImportLeads,
  useCreateLead,
  useDeleteLead,
  useLeads,
  useUpdateLead,
} from "../hooks/useQueries";

const STATUS_COLORS: Record<string, string> = {
  [LeadStatus.new_]: "bg-blue-100 text-blue-700",
  [LeadStatus.contacted]: "bg-amber-100 text-amber-700",
  [LeadStatus.qualified]: "bg-green-100 text-green-700",
  [LeadStatus.closed]: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  [LeadStatus.new_]: "New",
  [LeadStatus.contacted]: "Contacted",
  [LeadStatus.qualified]: "Qualified",
  [LeadStatus.closed]: "Closed",
};

const EMPTY_FORM: LeadCreate = {
  name: "",
  email: "",
  phone: "",
  tags: [],
  notes: "",
  status: LeadStatus.new_,
};

function LeadFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  initial: LeadCreate;
  onSubmit: (data: LeadCreate) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<LeadCreate>(initial);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else {
          setForm(initial);
          setTagsInput(initial.tags.join(", "));
        }
      }}
    >
      <DialogContent className="max-w-lg" data-ocid="leads.dialog">
        <DialogHeader>
          <DialogTitle>
            {initial.name ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Name *</Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Jane Smith"
                data-ocid="leads.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+1 555 000 0000"
                data-ocid="leads.phone.input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="jane@example.com"
              data-ocid="leads.email.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, status: v as LeadStatus }))
              }
            >
              <SelectTrigger id="lead-status" data-ocid="leads.status.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-tags">Tags (comma-separated)</Label>
            <Input
              id="lead-tags"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                setForm((p) => ({
                  ...p,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                }));
              }}
              placeholder="enterprise, saas, hot-lead"
              data-ocid="leads.tags.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={3}
              placeholder="Additional notes..."
              data-ocid="leads.notes.textarea"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="leads.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.name}
            data-ocid="leads.submit_button"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial.name ? "Save Changes" : "Add Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const bulkImport = useBulkImportLeads();
  const [preview, setPreview] = useState<LeadCreate[]>([]);
  const [fileName, setFileName] = useState("");

  const parseCSV = (text: string): LeadCreate[] => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const get = (key: string) => cols[headers.indexOf(key)] ?? "";
        const statusMap: Record<string, LeadStatus> = {
          new: LeadStatus.new_,
          contacted: LeadStatus.contacted,
          qualified: LeadStatus.qualified,
          closed: LeadStatus.closed,
        };
        return {
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          tags: get("tags")
            ? get("tags")
                .split(";")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          notes: get("notes"),
          status: statusMap[get("status").toLowerCase()] ?? LeadStatus.new_,
        };
      })
      .filter((l) => l.name);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      await bulkImport.mutateAsync(preview);
      toast.success(`Imported ${preview.length} leads successfully`);
      setPreview([]);
      setFileName("");
      onClose();
    } catch {
      toast.error("Import failed. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setPreview([]);
          setFileName("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg" data-ocid="leads.import.dialog">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with columns:{" "}
            <code className="bg-muted px-1 rounded text-xs">
              name, email, phone, tags, notes, status
            </code>
          </p>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {fileName || "Click to upload CSV"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports .csv files
              </p>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
                data-ocid="leads.upload_button"
              />
            </label>
          </div>
          {preview.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 font-medium">
                ✓ {preview.length} leads ready to import
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                First: {preview[0].name} · Last:{" "}
                {preview[preview.length - 1].name}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="leads.import.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0 || bulkImport.isPending}
            data-ocid="leads.import.confirm_button"
          >
            {bulkImport.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Import {preview.length > 0 ? `${preview.length} Leads` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LeadsPage() {
  const { data: leads = [], isLoading } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<bigint>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: bigint) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  };

  const handleCreate = async (data: LeadCreate) => {
    try {
      await createLead.mutateAsync(data);
      toast.success("Lead added successfully");
      setShowAddModal(false);
    } catch {
      toast.error("Failed to add lead");
    }
  };

  const handleUpdate = async (data: LeadCreate) => {
    if (!editLead) return;
    try {
      await updateLead.mutateAsync({ id: editLead.id, data });
      toast.success("Lead updated");
      setEditLead(null);
    } catch {
      toast.error("Failed to update lead");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteLead.mutateAsync(deleteConfirm.id);
      toast.success("Lead deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const handleComposeSelected = () => {
    navigate({
      to: "/compose",
      search: {
        leadIds: Array.from(selected).map(String).join(","),
        templateId: "",
      },
    });
  };

  return (
    <div data-ocid="leads.page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {leads.length} total leads
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button
              variant="outline"
              onClick={handleComposeSelected}
              data-ocid="leads.compose.button"
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Compose ({selected.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            data-ocid="leads.import.button"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Leads
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            data-ocid="leads.add.primary_button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 shadow-card">
        <div className="flex gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="leads.search_input"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-ocid="leads.filter.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="leads.loading_state">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" data-ocid="leads.empty_state">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No leads found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a lead or import from CSV to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={
                        selected.size === filtered.length && filtered.length > 0
                      }
                      onCheckedChange={toggleAll}
                      data-ocid="leads.select_all.checkbox"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lead, i) => (
                  <tr
                    key={String(lead.id)}
                    className="hover:bg-muted/30 transition-colors"
                    data-ocid={`leads.item.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                        data-ocid={`leads.checkbox.${i + 1}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground shrink-0">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">
                          {lead.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {lead.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`text-xs ${STATUS_COLORS[lead.status]} border-0`}
                      >
                        {STATUS_LABELS[lead.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {lead.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{lead.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditLead(lead)}
                          data-ocid={`leads.edit_button.${i + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(lead)}
                          data-ocid={`leads.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LeadFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        initial={EMPTY_FORM}
        onSubmit={handleCreate}
        loading={createLead.isPending}
      />

      {editLead && (
        <LeadFormModal
          open={!!editLead}
          onClose={() => setEditLead(null)}
          initial={{
            name: editLead.name,
            email: editLead.email,
            phone: editLead.phone,
            tags: editLead.tags,
            notes: editLead.notes,
            status: editLead.status,
          }}
          onSubmit={handleUpdate}
          loading={updateLead.isPending}
        />
      )}

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(v) => {
          if (!v) setDeleteConfirm(null);
        }}
      >
        <DialogContent data-ocid="leads.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteConfirm?.name}</strong>? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              data-ocid="leads.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLead.isPending}
              data-ocid="leads.delete.confirm_button"
            >
              {deleteLead.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
