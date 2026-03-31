import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  type LeadId = Nat;
  type TemplateId = Nat;
  type SentMessageId = Nat;

  let accessControlState = AccessControl.initState();

  public type UserProfile = {
    name : Text;
  };

  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();

  let leads = Map.empty<LeadId, Lead>();
  let messageTemplates = Map.empty<TemplateId, MessageTemplate>();
  let sentMessages = Map.empty<SentMessageId, SentMessage>();

  var nextLeadId = 1;
  var nextTemplateId = 1;
  var nextSentMessageId = 1;

  type ISO_4217_CurrencyCode = Text;
  type ICAN_Sample1_AssetId = Nat;

  module ICAN_Sample1_AssetId {
    public func fromNat(n : Nat) : ICAN_Sample1_AssetId {
      n;
    };
    public func toNat(id : ICAN_Sample1_AssetId) : Nat {
      id;
    };
    public func toText(id : ICAN_Sample1_AssetId) : Text {
      id.toNat().toText();
    };
  };

  // Lead Types
  public type LeadStatus = {
    #new;
    #contacted;
    #qualified;
    #closed;
  };

  public type Lead = {
    id : LeadId;
    name : Text;
    phone : Text;
    email : Text;
    tags : [Text];
    notes : Text;
    status : LeadStatus;
    createdAt : Int;
  };

  public type LeadCreate = {
    name : Text;
    phone : Text;
    email : Text;
    tags : [Text];
    notes : Text;
    status : LeadStatus;
  };

  // Message Template Types
  public type MessageTemplate = {
    id : TemplateId;
    title : Text;
    body : Text;
    attachmentUrls : [Text];
    createdAt : Int;
  };

  public type MessageTemplateCreate = {
    title : Text;
    body : Text;
    attachmentUrls : [Text];
  };

  // Sent Message Types
  public type SentMessage = {
    id : SentMessageId;
    leadIds : [LeadId];
    templateId : ?TemplateId;
    subject : Text;
    body : Text;
    attachmentUrls : [Text];
    sentAt : Int;
  };

  public type SentMessageCreate = {
    leadIds : [LeadId];
    templateId : ?TemplateId;
    subject : Text;
    body : Text;
    attachmentUrls : [Text];
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Lead CRUD Operations

  public shared ({ caller }) func createLead(leadCreate : LeadCreate) : async Lead {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create leads");
    };

    let id = nextLeadId;
    nextLeadId += 1;

    let lead : Lead = {
      id;
      name = leadCreate.name;
      phone = leadCreate.phone;
      email = leadCreate.email;
      tags = leadCreate.tags;
      notes = leadCreate.notes;
      status = leadCreate.status;
      createdAt = Time.now();
    };

    leads.add(id, lead);
    lead;
  };

  public shared ({ caller }) func bulkImportLeads(leadsCreate : [LeadCreate]) : async [Lead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can import leads");
    };

    let newLeads = List.empty<Lead>();
    for (leadCreate in leadsCreate.values()) {
      let id = nextLeadId;
      nextLeadId += 1;

      let lead : Lead = {
        id;
        name = leadCreate.name;
        phone = leadCreate.phone;
        email = leadCreate.email;
        tags = leadCreate.tags;
        notes = leadCreate.notes;
        status = leadCreate.status;
        createdAt = Time.now();
      };

      leads.add(id, lead);
      newLeads.add(lead);
    };
    newLeads.toArray();
  };

  public shared ({ caller }) func updateLead(id : LeadId, leadUpdate : LeadCreate) : async Lead {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update leads");
    };

    switch (leads.get(id)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?existing) {
        let updatedLead : Lead = {
          id = existing.id;
          name = leadUpdate.name;
          phone = leadUpdate.phone;
          email = leadUpdate.email;
          tags = leadUpdate.tags;
          notes = leadUpdate.notes;
          status = leadUpdate.status;
          createdAt = existing.createdAt;
        };
        leads.add(id, updatedLead);
        updatedLead;
      };
    };
  };

  public shared ({ caller }) func deleteLead(id : LeadId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete leads");
    };

    if (not leads.containsKey(id)) { Runtime.trap("Lead not found") };
    leads.remove(id);
  };

  public query ({ caller }) func getLead(id : LeadId) : async Lead {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view leads");
    };

    switch (leads.get(id)) {
      case (null) { Runtime.trap("Lead not found") };
      case (?lead) { lead };
    };
  };

  public query ({ caller }) func listLeads() : async [Lead] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list leads");
    };

    leads.values().toArray();
  };

  // Message Template CRUD Operations

  public shared ({ caller }) func createMessageTemplate(templateCreate : MessageTemplateCreate) : async MessageTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create templates");
    };

    let id = nextTemplateId;
    nextTemplateId += 1;

    let template : MessageTemplate = {
      id;
      title = templateCreate.title;
      body = templateCreate.body;
      attachmentUrls = templateCreate.attachmentUrls;
      createdAt = Time.now();
    };

    messageTemplates.add(id, template);
    template;
  };

  public shared ({ caller }) func updateMessageTemplate(id : TemplateId, templateUpdate : MessageTemplateCreate) : async MessageTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update templates");
    };

    switch (messageTemplates.get(id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?existing) {
        let updatedTemplate : MessageTemplate = {
          id = existing.id;
          title = templateUpdate.title;
          body = templateUpdate.body;
          attachmentUrls = templateUpdate.attachmentUrls;
          createdAt = existing.createdAt;
        };
        messageTemplates.add(id, updatedTemplate);
        updatedTemplate;
      };
    };
  };

  public shared ({ caller }) func deleteMessageTemplate(id : TemplateId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete templates");
    };

    if (not messageTemplates.containsKey(id)) { Runtime.trap("Template not found") };
    messageTemplates.remove(id);
  };

  public query ({ caller }) func getMessageTemplate(id : TemplateId) : async MessageTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view templates");
    };

    switch (messageTemplates.get(id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?template) { template };
    };
  };

  public query ({ caller }) func listMessageTemplates() : async [MessageTemplate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list templates");
    };

    messageTemplates.values().toArray();
  };

  // Sent Message Operations

  public shared ({ caller }) func recordSentMessage(messageCreate : SentMessageCreate) : async SentMessage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record sent messages");
    };

    let id = nextSentMessageId;
    nextSentMessageId += 1;

    let message : SentMessage = {
      id;
      leadIds = messageCreate.leadIds;
      templateId = messageCreate.templateId;
      subject = messageCreate.subject;
      body = messageCreate.body;
      attachmentUrls = messageCreate.attachmentUrls;
      sentAt = Time.now();
    };

    sentMessages.add(id, message);
    message;
  };

  public query ({ caller }) func getSentMessagesByLead(leadId : LeadId) : async [SentMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sent messages");
    };

    sentMessages.values().toArray().filter(
      func(msg) {
        msg.leadIds.find(func(lid) { lid == leadId }) != null;
      }
    );
  };

  public query ({ caller }) func getSentMessage(id : SentMessageId) : async SentMessage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sent messages");
    };

    switch (sentMessages.get(id)) {
      case (null) { Runtime.trap("Sent message not found") };
      case (?message) { message };
    };
  };

  public query ({ caller }) func listSentMessages() : async [SentMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list sent messages");
    };

    sentMessages.values().toArray();
  };

  // Dashboard Stats
  public query ({ caller }) func getDashboardStats() : async {
    newLeads : Nat;
    contactedLeads : Nat;
    qualifiedLeads : Nat;
    closedLeads : Nat;
    totalTemplates : Nat;
    totalSentMessages : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };

    var newLeads = 0;
    var contactedLeads = 0;
    var qualifiedLeads = 0;
    var closedLeads = 0;

    for (lead in leads.values()) {
      switch (lead.status) {
        case (#new) { newLeads += 1 };
        case (#contacted) { contactedLeads += 1 };
        case (#qualified) { qualifiedLeads += 1 };
        case (#closed) { closedLeads += 1 };
      };
    };

    let totalTemplates = messageTemplates.size();
    let totalSentMessages = sentMessages.size();

    {
      newLeads;
      contactedLeads;
      qualifiedLeads;
      closedLeads;
      totalTemplates;
      totalSentMessages;
    };
  };

  // Paganini Blob Storage Integration
  include MixinStorage();
};
