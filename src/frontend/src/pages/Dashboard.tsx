import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MessageSquare, TrendingUp, Users } from "lucide-react";
import { LeadStatus } from "../backend";
import {
  useDashboardStats,
  useLeads,
  useSentMessages,
  useUserProfile,
} from "../hooks/useQueries";

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1000000n)).toLocaleDateString();
}

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

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: leads } = useLeads();
  const { data: sentMessages } = useSentMessages();
  const { data: profile } = useUserProfile();

  const recentLeads = leads?.slice(-5).reverse() ?? [];
  const recentMessages = sentMessages?.slice(-5).reverse() ?? [];

  const kpiCards = [
    {
      label: "Total Leads",
      value: stats
        ? Number(
            stats.newLeads +
              stats.contactedLeads +
              stats.qualifiedLeads +
              stats.closedLeads,
          )
        : 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "New Leads",
      value: stats ? Number(stats.newLeads) : 0,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Messages Sent",
      value: stats ? Number(stats.totalSentMessages) : 0,
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Templates",
      value: stats ? Number(stats.totalTemplates) : 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div data-ocid="dashboard.page">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.name ?? "User"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your leads today.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}
                >
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              {statsLoading ? (
                <Skeleton
                  className="h-8 w-16"
                  data-ocid="dashboard.loading_state"
                />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {kpi.value.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Leads</h2>
          </div>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div
                className="px-5 py-8 text-center text-muted-foreground text-sm"
                data-ocid="dashboard.leads.empty_state"
              >
                No leads yet. Import or add your first lead.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentLeads.map((lead, i) => (
                  <li
                    key={String(lead.id)}
                    className="flex items-center gap-3 px-5 py-3"
                    data-ocid={`dashboard.leads.item.${i + 1}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground shrink-0">
                      {lead.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.email}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs ${STATUS_COLORS[lead.status]} border-0`}
                    >
                      {STATUS_LABELS[lead.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Messages</h2>
          </div>
          <CardContent className="p-0">
            {recentMessages.length === 0 ? (
              <div
                className="px-5 py-8 text-center text-muted-foreground text-sm"
                data-ocid="dashboard.messages.empty_state"
              >
                No messages sent yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentMessages.map((msg, i) => (
                  <li
                    key={String(msg.id)}
                    className="flex items-start gap-3 px-5 py-3"
                    data-ocid={`dashboard.messages.item.${i + 1}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(msg.sentAt)} · {msg.leadIds.length} recipient
                        {msg.leadIds.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
