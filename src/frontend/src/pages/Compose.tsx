import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useSearch } from "@tanstack/react-router";
import {
  FileText,
  Image,
  Loader2,
  Save,
  Search,
  Send,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lead } from "../backend";
import {
  useCreateTemplate,
  useLeads,
  useRecordSentMessage,
  useTemplates,
} from "../hooks/useQueries";
import { useUpload } from "../hooks/useUpload";

type Attachment = { name: string; url: string };

export default function ComposePage() {
  const search = useSearch({ from: "/compose" });
  const { data: leads = [] } = useLeads();
  const { data: templates = [] } = useTemplates();
  const sendMessage = useRecordSentMessage();
  const createTemplate = useCreateTemplate();
  const { upload, uploading } = useUpload();

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<bigint>>(
    new Set(),
  );
  const [leadSearch, setLeadSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");

  // Pre-select leads from URL search params
  useEffect(() => {
    if (search.leadIds) {
      const ids = search.leadIds
        .split(",")
        .filter(Boolean)
        .map((id) => BigInt(id));
      setSelectedLeadIds(new Set(ids));
    }
  }, [search.leadIds]);

  // Pre-load template from URL search params
  useEffect(() => {
    if (search.templateId && templates.length > 0) {
      const tpl = templates.find((t) => String(t.id) === search.templateId);
      if (tpl) {
        setSubject(tpl.title);
        setBody(tpl.body);
        setAttachments(
          tpl.attachmentUrls.map((url, i) => ({
            name: `Attachment ${i + 1}`,
            url,
          })),
        );
      }
    }
  }, [search.templateId, templates]);

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.email.toLowerCase().includes(leadSearch.toLowerCase()),
  );

  const toggleLead = (id: bigint) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadTemplate = (templateId: string) => {
    if (templateId === "none") return;
    const tpl = templates.find((t) => String(t.id) === templateId);
    if (!tpl) return;
    setSubject(tpl.title);
    setBody(tpl.body);
    setAttachments(
      tpl.attachmentUrls.map((url, i) => ({
        name: `Attachment ${i + 1}`,
        url,
      })),
    );
  };

  const uploadFile = async (file: File) => {
    try {
      const url = await upload(file);
      setAttachments((prev) => [...prev, { name: file.name, url }]);
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleFileInput = (accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadFile(file);
    };
    input.click();
  };

  const handleSend = async () => {
    if (selectedLeadIds.size === 0) {
      toast.error("Please select at least one recipient.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }
    try {
      await sendMessage.mutateAsync({
        leadIds: Array.from(selectedLeadIds),
        subject,
        body,
        attachmentUrls: attachments.map((a) => a.url),
      });
      toast.success("Message sent successfully!");
      setSubject("");
      setBody("");
      setAttachments([]);
      setSelectedLeadIds(new Set());
    } catch {
      toast.error("Failed to send message.");
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) return;
    try {
      await createTemplate.mutateAsync({
        title: templateTitle,
        body,
        attachmentUrls: attachments.map((a) => a.url),
      });
      toast.success("Template saved!");
      setShowSaveModal(false);
      setTemplateTitle("");
    } catch {
      toast.error("Failed to save template.");
    }
  };

  return (
    <div data-ocid="compose.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Compose Message</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Send a message to one or more leads.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recipient picker */}
        <div className="xl:col-span-1">
          <Card className="shadow-card">
            <div className="px-4 py-3.5 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">
                Recipients
              </h2>
              {selectedLeadIds.size > 0 && (
                <p className="text-xs text-primary mt-0.5">
                  {selectedLeadIds.size} selected
                </p>
              )}
            </div>
            <CardContent className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-xs"
                  placeholder="Search leads..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  data-ocid="compose.search_input"
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {filteredLeads.length === 0 ? (
                  <p
                    className="text-xs text-muted-foreground text-center py-4"
                    data-ocid="compose.leads.empty_state"
                  >
                    No leads found
                  </p>
                ) : (
                  filteredLeads.map((lead: Lead) => (
                    <div
                      key={String(lead.id)}
                      className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={`lead-${String(lead.id)}`}
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={() => toggleLead(lead.id)}
                        data-ocid="compose.recipient.checkbox"
                      />
                      <label
                        htmlFor={`lead-${String(lead.id)}`}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <p className="text-xs font-medium text-foreground truncate">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.email}
                        </p>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composer */}
        <div className="xl:col-span-2 space-y-4">
          {/* Template loader */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <Label htmlFor="template-select" className="mb-2 block text-sm">
                Load Template
              </Label>
              <Select onValueChange={loadTemplate}>
                <SelectTrigger
                  id="template-select"
                  data-ocid="compose.template.select"
                >
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={String(t.id)} value={String(t.id)}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Message form */}
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Message subject..."
                  data-ocid="compose.subject.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">Message Body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your message here..."
                  className="resize-none"
                  data-ocid="compose.body.textarea"
                />
              </div>

              {/* Attachments */}
              <div>
                <p className="text-sm font-medium mb-2">Attachments</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileInput("image/*")}
                    disabled={uploading}
                    data-ocid="compose.image.upload_button"
                  >
                    {uploading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Image className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Add Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileInput("video/*")}
                    disabled={uploading}
                    data-ocid="compose.video.upload_button"
                  >
                    <Video className="mr-1.5 h-3.5 w-3.5" />
                    Add Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileInput(".pdf")}
                    disabled={uploading}
                    data-ocid="compose.pdf.upload_button"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Add PDF
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <Badge
                        key={att.url}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1 px-2.5 text-xs"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="max-w-32 truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((a) => a.url !== att.url),
                            )
                          }
                          className="ml-0.5 hover:text-destructive transition-colors"
                          data-ocid="compose.attachment.delete_button.1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveModal(true)}
                  data-ocid="compose.save_template.button"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendMessage.isPending || selectedLeadIds.size === 0}
                  data-ocid="compose.send.primary_button"
                >
                  {sendMessage.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Message
                    </>
                  )}
                </Button>
              </div>

              {sendMessage.isSuccess && (
                <div
                  className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700"
                  data-ocid="compose.success_state"
                >
                  ✓ Message sent to {selectedLeadIds.size} recipient
                  {selectedLeadIds.size !== 1 ? "s" : ""}
                </div>
              )}
              {sendMessage.isError && (
                <div
                  className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"
                  data-ocid="compose.error_state"
                >
                  Failed to send. Please try again.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save as Template Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent data-ocid="compose.save_template.dialog">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="template-title">Template Title *</Label>
              <Input
                id="template-title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="e.g. Follow-up Introduction"
                data-ocid="compose.template_title.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              data-ocid="compose.save_template.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateTitle.trim() || createTemplate.isPending}
              data-ocid="compose.save_template.confirm_button"
            >
              {createTemplate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
