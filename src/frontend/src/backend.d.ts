import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type LeadId = bigint;
export type TemplateId = bigint;
export interface LeadCreate {
    status: LeadStatus;
    name: string;
    tags: Array<string>;
    email: string;
    notes: string;
    phone: string;
}
export interface SentMessageCreate {
    leadIds: Array<LeadId>;
    subject: string;
    templateId?: TemplateId;
    body: string;
    attachmentUrls: Array<string>;
}
export interface Lead {
    id: LeadId;
    status: LeadStatus;
    name: string;
    createdAt: bigint;
    tags: Array<string>;
    email: string;
    notes: string;
    phone: string;
}
export interface MessageTemplate {
    id: TemplateId;
    title: string;
    body: string;
    createdAt: bigint;
    attachmentUrls: Array<string>;
}
export interface SentMessage {
    id: SentMessageId;
    leadIds: Array<LeadId>;
    subject: string;
    templateId?: TemplateId;
    body: string;
    sentAt: bigint;
    attachmentUrls: Array<string>;
}
export type SentMessageId = bigint;
export interface MessageTemplateCreate {
    title: string;
    body: string;
    attachmentUrls: Array<string>;
}
export interface UserProfile {
    name: string;
}
export enum LeadStatus {
    new_ = "new",
    closed = "closed",
    contacted = "contacted",
    qualified = "qualified"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface WhatsAppResult {
    successCount: bigint;
    failedCount: bigint;
    errors: Array<string>;
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkImportLeads(leadsCreate: Array<LeadCreate>): Promise<Array<Lead>>;
    createLead(leadCreate: LeadCreate): Promise<Lead>;
    createMessageTemplate(templateCreate: MessageTemplateCreate): Promise<MessageTemplate>;
    deleteLead(id: LeadId): Promise<void>;
    deleteMessageTemplate(id: TemplateId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<{
        closedLeads: bigint;
        newLeads: bigint;
        totalSentMessages: bigint;
        qualifiedLeads: bigint;
        totalTemplates: bigint;
        contactedLeads: bigint;
    }>;
    getLead(id: LeadId): Promise<Lead>;
    getMessageTemplate(id: TemplateId): Promise<MessageTemplate>;
    getSentMessage(id: SentMessageId): Promise<SentMessage>;
    getSentMessagesByLead(leadId: LeadId): Promise<Array<SentMessage>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listLeads(): Promise<Array<Lead>>;
    listMessageTemplates(): Promise<Array<MessageTemplate>>;
    listSentMessages(): Promise<Array<SentMessage>>;
    recordSentMessage(messageCreate: SentMessageCreate): Promise<SentMessage>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendWhatsAppMessages(leadIds: Array<LeadId>, messageBody: string): Promise<WhatsAppResult>;
    updateLead(id: LeadId, leadUpdate: LeadCreate): Promise<Lead>;
    updateMessageTemplate(id: TemplateId, templateUpdate: MessageTemplateCreate): Promise<MessageTemplate>;
}
