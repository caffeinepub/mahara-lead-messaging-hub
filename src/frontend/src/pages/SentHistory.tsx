import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Paperclip,
} from "lucide-react";
import { useState } from "react";
import type { SentMessage } from "../backend";
import { useLeads, useSentMessages } from "../hooks/useQueries";

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1000000n)).toLocaleString();
}

function ExpandedRow({
  msg,
  leadNames,
}: { msg: SentMessage; leadNames: string[] }) {
  return (
    <div className="bg-muted/30 px-6 py-4 border-t border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Recipients
          </p>
          <div className="flex flex-wrap gap-1">
            {leadNames.map((name) => (
              <Badge key={name} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
            {leadNames.length === 0 && (
              <span className="text-xs text-muted-foreground">
                Unknown recipients
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Message Body
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {msg.body || "(no body)"}
          </p>
        </div>
        {msg.attachmentUrls.length > 0 && (
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Attachments
            </p>
            <div className="flex flex-wrap gap-2">
              {msg.attachmentUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Paperclip className="w-3 h-3" />
                  Attachment
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SentHistoryPage() {
  const { data: messages = [], isLoading } = useSentMessages();
  const { data: leads = [] } = useLeads();
  const [expanded, setExpanded] = useState<Set<bigint>>(new Set());

  const getLeadNames = (leadIds: bigint[]) =>
    leadIds.map((id) => leads.find((l) => l.id === id)?.name ?? String(id));

  const toggle = (id: bigint) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sampleMessages: SentMessage[] = [
    {
      id: BigInt(-1),
      leadIds: [],
      subject: "Product Demo Follow-Up",
      body: "Hi there,\n\nThank you for attending our product demo. We'd love to discuss next steps...",
      sentAt: BigInt(Date.now() - 86400000) * 1000000n,
      attachmentUrls: [],
    },
    {
      id: BigInt(-2),
      leadIds: [],
      subject: "Q4 Campaign: Special Pricing",
      body: "Hi,\n\nWe're excited to announce our end-of-year pricing special exclusively for qualified leads...",
      sentAt: BigInt(Date.now() - 172800000) * 1000000n,
      attachmentUrls: [],
    },
    {
      id: BigInt(-3),
      leadIds: [],
      subject: "Onboarding Checklist & Resources",
      body: "Welcome aboard! Here's everything you need to get started with Mahara...",
      sentAt: BigInt(Date.now() - 259200000) * 1000000n,
      attachmentUrls: [],
    },
  ];

  const displayMessages = messages.length > 0 ? messages : sampleMessages;

  return (
    <div data-ocid="sent.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sent History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {messages.length} messages sent
        </p>
      </div>

      <Card className="shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="sent.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="p-12 text-center" data-ocid="sent.empty_state">
            <p className="font-medium text-foreground">No messages sent yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Messages you send will appear here.
            </p>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="col-span-1" />
              <div className="col-span-3">Subject</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Recipients</div>
              <div className="col-span-4">Preview</div>
              <div className="col-span-1">Attachments</div>
            </div>

            {displayMessages.map((msg, i) => (
              <div key={String(msg.id)} data-ocid={`sent.item.${i + 1}`}>
                <button
                  type="button"
                  className="w-full text-left grid grid-cols-12 gap-4 px-5 py-4 border-b border-border hover:bg-muted/20 cursor-pointer transition-colors items-center"
                  onClick={() => toggle(msg.id)}
                >
                  <div className="col-span-1">
                    {expanded.has(msg.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="col-span-3">
                    <p className="font-medium text-sm text-foreground truncate">
                      {msg.subject}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(msg.sentAt)}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <Badge variant="secondary" className="text-xs">
                      {msg.leadIds.length}
                    </Badge>
                  </div>
                  <div className="col-span-4">
                    <p className="text-xs text-muted-foreground truncate">
                      {msg.body}
                    </p>
                  </div>
                  <div className="col-span-1">
                    {msg.attachmentUrls.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="w-3 h-3" />
                        {msg.attachmentUrls.length}
                      </span>
                    )}
                  </div>
                </button>
                {expanded.has(msg.id) && (
                  <ExpandedRow
                    msg={msg}
                    leadNames={getLeadNames(msg.leadIds)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
