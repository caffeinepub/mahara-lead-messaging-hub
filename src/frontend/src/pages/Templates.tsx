import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MessageTemplate, MessageTemplateCreate } from "../backend";
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
} from "../hooks/useQueries";

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1000000n)).toLocaleDateString();
}

const EMPTY_FORM: MessageTemplateCreate = {
  title: "",
  body: "",
  attachmentUrls: [],
};

function TemplateModal({
  open,
  onClose,
  initial,
  onSubmit,
  loading,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initial: MessageTemplateCreate;
  onSubmit: (data: MessageTemplateCreate) => void;
  loading: boolean;
  title: string;
}) {
  const [form, setForm] = useState(initial);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else setForm(initial);
      }}
    >
      <DialogContent className="max-w-lg" data-ocid="templates.dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-title">Title *</Label>
            <Input
              id="tpl-title"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Template name..."
              data-ocid="templates.title.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Body</Label>
            <Textarea
              id="tpl-body"
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={6}
              placeholder="Template message body..."
              data-ocid="templates.body.textarea"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="templates.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.title}
            data-ocid="templates.submit_button"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const navigate = useNavigate();

  const [showNew, setShowNew] = useState(false);
  const [editTpl, setEditTpl] = useState<MessageTemplate | null>(null);
  const [deleteTpl, setDeleteTpl] = useState<MessageTemplate | null>(null);

  const handleCreate = async (data: MessageTemplateCreate) => {
    try {
      await createTemplate.mutateAsync(data);
      toast.success("Template created");
      setShowNew(false);
    } catch {
      toast.error("Failed to create template");
    }
  };

  const handleUpdate = async (data: MessageTemplateCreate) => {
    if (!editTpl) return;
    try {
      await updateTemplate.mutateAsync({ id: editTpl.id, data });
      toast.success("Template updated");
      setEditTpl(null);
    } catch {
      toast.error("Failed to update template");
    }
  };

  const handleDelete = async () => {
    if (!deleteTpl) return;
    try {
      await deleteTemplate.mutateAsync(deleteTpl.id);
      toast.success("Template deleted");
      setDeleteTpl(null);
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const sampleTemplates: MessageTemplate[] = [
    {
      id: BigInt(-1),
      title: "Initial Outreach",
      body: "Hi {name},\n\nI came across your profile and wanted to reach out. We help companies like yours streamline their lead management and outreach process...\n\nWould you be open to a quick 15-minute call this week?",
      createdAt: BigInt(Date.now()) * 1000000n,
      attachmentUrls: [],
    },
    {
      id: BigInt(-2),
      title: "Follow-Up After Demo",
      body: "Hi {name},\n\nThank you for joining our demo yesterday! I wanted to follow up and answer any questions you might have.\n\nAs discussed, here are the key features that stood out for your use case...",
      createdAt: BigInt(Date.now()) * 1000000n,
      attachmentUrls: [],
    },
    {
      id: BigInt(-3),
      title: "Re-engagement Campaign",
      body: "Hi {name},\n\nIt's been a while since we last connected! A lot has changed since then — we've launched new features that might be exactly what you were looking for...",
      createdAt: BigInt(Date.now()) * 1000000n,
      attachmentUrls: [],
    },
  ];

  const displayTemplates = templates.length > 0 ? templates : sampleTemplates;

  return (
    <div data-ocid="templates.page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reusable message templates for your campaigns.
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          data-ocid="templates.add.primary_button"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="templates.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : displayTemplates.length === 0 ? (
        <div className="text-center py-16" data-ocid="templates.empty_state">
          <p className="font-medium text-foreground">No templates yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first template to speed up messaging.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTemplates.map((tpl, i) => (
            <Card
              key={String(tpl.id)}
              className="shadow-card flex flex-col"
              data-ocid={`templates.item.${i + 1}`}
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm leading-snug">
                    {tpl.title}
                  </h3>
                  {tpl.attachmentUrls.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
                      <Paperclip className="w-3 h-3" />
                      {tpl.attachmentUrls.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {tpl.body}
                </p>
              </div>
              <div className="px-5 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(tpl.createdAt)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        navigate({
                          to: "/compose",
                          search: { templateId: String(tpl.id), leadIds: "" },
                        })
                      }
                      data-ocid={`templates.use.button.${i + 1}`}
                    >
                      Use <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                    {tpl.id >= 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditTpl(tpl)}
                          data-ocid={`templates.edit_button.${i + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTpl(tpl)}
                          data-ocid={`templates.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TemplateModal
        open={showNew}
        onClose={() => setShowNew(false)}
        initial={EMPTY_FORM}
        onSubmit={handleCreate}
        loading={createTemplate.isPending}
        title="New Template"
      />

      {editTpl && (
        <TemplateModal
          open={!!editTpl}
          onClose={() => setEditTpl(null)}
          initial={{
            title: editTpl.title,
            body: editTpl.body,
            attachmentUrls: editTpl.attachmentUrls,
          }}
          onSubmit={handleUpdate}
          loading={updateTemplate.isPending}
          title="Edit Template"
        />
      )}

      <Dialog
        open={!!deleteTpl}
        onOpenChange={(v) => {
          if (!v) setDeleteTpl(null);
        }}
      >
        <DialogContent data-ocid="templates.delete.dialog">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTpl?.title}</strong>?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTpl(null)}
              data-ocid="templates.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
              data-ocid="templates.delete.confirm_button"
            >
              {deleteTemplate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
