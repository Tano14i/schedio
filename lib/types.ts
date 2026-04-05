export type UserRole = "owner" | "worker" | "customer";

export type LeadStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "quoted"
  | "won"
  | "lost";

export type QualificationStatus =
  | "unqualified"
  | "qualified"
  | "needs_clarification"
  | "out_of_area"
  | "low_priority"
  | "rejected";

export type ServiceAreaMatch = "unknown" | "inside" | "outside";
export type JobSize = "unknown" | "small" | "medium" | "large";
export type BudgetRange = "unknown" | "low" | "medium" | "high";
export type NextBestAction = "propose_visit" | "ask_clarification" | "reject" | "defer";
export type QualificationConfidence = "high" | "medium" | "low";
export type AiIntakeSource = "heuristic" | "openai";
export type AiIntakeNextAction = "ask_clarification" | "schedule_visit" | "book_intervention";

export type JobStatus =
  | "scheduled"
  | "on_the_way"
  | "in_progress"
  | "completed"
  | "canceled";

export type JobCompletionStatus = "pending" | "completed";
export type JobCostCategory = "labor" | "material" | "other";

export type EstimateStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";
export type InvoiceReminderStatus = "scheduled" | "sent" | "canceled" | "failed";
export type InvoiceReminderReason = "before_due" | "overdue";
export type ReviewRequestStatus = "pending" | "sent" | "clicked" | "canceled";

export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  customerId: string;
  source: "manual" | "web_form" | "phone" | "whatsapp" | "referral";
  serviceType: string;
  description: string;
  urgency: "low" | "medium" | "high";
  preferredDate?: string;
  photos?: string[];
  status: LeadStatus;
  qualificationStatus?: QualificationStatus;
  serviceAreaMatch?: ServiceAreaMatch;
  jobSize?: JobSize;
  budgetRange?: BudgetRange;
  urgencyLevel?: "low" | "medium" | "high";
  qualificationReason?: string;
  qualificationConfidence?: QualificationConfidence;
  nextBestAction?: NextBestAction;
  qualifiedAt?: string;
  createdAt: string;
  nextAction: string;
};

export type AiIntakeSuggestion = {
  customerName?: string;
  serviceType: string;
  address?: string;
  urgency: "low" | "medium" | "high";
  preferredWindow?: string;
  materialsMentioned: string[];
  measurements?: string;
  visitNeeded: boolean;
  nextAction: AiIntakeNextAction;
  summary: string;
  missingFields: string[];
  confidence: QualificationConfidence;
  source: AiIntakeSource;
};

export type Job = {
  id: string;
  leadId?: string;
  customerId: string;
  title: string;
  type: "estimate_visit" | "job";
  assignedTo?: string;
  assignedHourlyCost?: number;
  startAt: string;
  endAt?: string;
  status: JobStatus;
  address: string;
  notes?: string;
  completionStatus?: JobCompletionStatus;
  completedAt?: string;
  completionNotes?: string;
  internalSummary?: string;
  estimateDraftedAt?: string;
  costItems?: JobCostItem[];
  workLogs?: JobWorkLog[];
  financials?: JobFinancialSummary;
  workedHours?: number;
  laborCost?: number;
};

export type JobCostItem = {
  id: string;
  jobId: string;
  label: string;
  category: JobCostCategory;
  qty: number;
  unitCost: number;
  note?: string;
  createdAt: string;
};

export type JobWorkLog = {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  hours: number;
  hourlyCostSnapshot: number;
  note?: string;
  workedAt: string;
  createdAt: string;
};

export type JobFinancialSummary = {
  estimatedRevenue: number;
  invoicedRevenue: number;
  expectedRevenue: number;
  totalCost: number;
  margin: number;
  marginRate: number | null;
};

export type EstimateLineItem = {
  id: string;
  label: string;
  description?: string;
  qty: number;
  unitPrice: number;
};

export type Estimate = {
  id: string;
  customerId: string;
  leadId?: string;
  jobId?: string;
  number: string;
  status: EstimateStatus;
  title?: string;
  introText?: string;
  scopeSummary?: string;
  notes?: string;
  terms?: string;
  items: EstimateLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  validUntil?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  publicToken: string;
  followUpStatus?: "scheduled" | "sent" | "canceled" | "failed";
  followUpReason?: "no_view" | "viewed_not_accepted";
};

export type EstimateFollowUp = {
  id: string;
  companyId: string;
  estimateId: string;
  channel: string;
  scheduledFor: string;
  sentAt?: string;
  canceledAt?: string;
  status: "scheduled" | "sent" | "canceled" | "failed";
  reason?: "no_view" | "viewed_not_accepted";
  createdAt: string;
  updatedAt: string;
};

export type FunnelMetrics = {
  leadsReceived: number;
  leadsQualified: number;
  visitsConfirmed: number;
  visitsCompleted: number;
  estimatesCreated: number;
  estimatesSent: number;
  estimatesViewed: number;
  estimatesAccepted: number;
};

export type OperationalMetrics = {
  avgLeadToQualificationHours: number | null;
  avgLeadToVisitConfirmationHours: number | null;
  avgVisitCompletedToEstimateSentHours: number | null;
  avgEstimateSentToViewedHours: number | null;
};

export type FollowUpWorkItem = {
  estimateId: string;
  customerName: string;
  total: number;
  sentAt: string;
  viewedAt?: string | null;
  followUpStatus: "due" | "scheduled" | "sent" | "failed";
  recommendation: "follow_up_now" | "wait" | "call_customer";
};

export type EstimateTemplate = {
  id: string;
  companyId: string;
  name: string;
  serviceType?: string;
  active: boolean;
  introText?: string;
  scopeSummary?: string;
  notes?: string;
  terms?: string;
  itemsJson: Array<{
    label: string;
    description?: string;
    qty: number;
    unitPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  customerId: string;
  leadId?: string;
  jobId?: string;
  estimateId?: string;
  number: string;
  status: InvoiceStatus;
  title?: string;
  notes?: string;
  terms?: string;
  items?: Array<{
    id: string;
    label: string;
    description?: string;
    qty: number;
    unitPrice: number;
    sortOrder?: number;
  }>;
  dueDate?: string;
  subtotal: number;
  tax: number;
  total: number;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  voidedAt?: string;
  publicToken: string;
  latestReminderStatus?: InvoiceReminderStatus;
};

export type InvoiceReminder = {
  id: string;
  companyId: string;
  invoiceId: string;
  channel: string;
  scheduledFor: string;
  sentAt?: string;
  canceledAt?: string;
  status: InvoiceReminderStatus;
  reason: InvoiceReminderReason;
  createdAt: string;
  updatedAt: string;
};

export type ReviewRequest = {
  id: string;
  companyId: string;
  customerId: string;
  jobId?: string;
  invoiceId?: string;
  channel: string;
  reviewLink?: string;
  scheduledFor?: string;
  sentAt?: string;
  clickedAt?: string;
  status: ReviewRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceMetrics = {
  openInvoices: number;
  overdueInvoices: number;
  paidInvoices: number;
  cashCollectedMonth: number;
  reviewRequestsSent: number;
  reviewRequestsClicked: number;
  avgInvoiceSentToPaidHours: number | null;
};

export type InvoiceWorkItem = {
  invoiceId: string;
  customerName: string;
  number: string;
  total: number;
  dueDate?: string | null;
  sentAt?: string | null;
  paidAt?: string | null;
  reminderStatus: InvoiceReminderStatus | "due" | "none";
  reviewRequestStatus?: ReviewRequestStatus | "due";
  recommendation: "send_invoice" | "send_reminder" | "mark_paid" | "send_review";
};

export type AutomationType =
  | "appointment_confirmation"
  | "appointment_reminder"
  | "estimate_followup"
  | "invoice_reminder"
  | "review_request";

export type Automation = {
  id: string;
  name: string;
  type: AutomationType;
  channel: "sms" | "email";
  enabled: boolean;
  delayLabel: string;
  conditions: string;
  message: string;
};

export type ActivityLog = {
  id: string;
  entityType: "lead" | "job" | "estimate" | "invoice" | "customer" | "whatsapp" | "user";
  entityId: string;
  eventType: string;
  message: string;
  createdAt: string;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type ServiceArea = {
  id: string;
  companyId: string;
  label: string;
  city?: string;
  postalCodePrefix?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type WhatsAppThreadStatus =
  | "new_request"
  | "awaiting_photos"
  | "intake_ready"
  | "awaiting_internal_approval"
  | "awaiting_customer_confirmation"
  | "visit_confirmed";

export type WhatsAppMessageType = "text" | "image" | "flow" | "system" | "interactive";

export type WhatsAppThread = {
  id: string;
  customerId?: string;
  leadId?: string;
  phone: string;
  customerName: string;
  status: WhatsAppThreadStatus;
  serviceType?: string;
  description?: string;
  address?: string;
  measurements?: string;
  preferredWindow?: string;
  photoCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
};

export type WhatsAppMessage = {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound" | "internal";
  type: WhatsAppMessageType;
  text: string;
  createdAt: string;
  mediaUrl?: string;
};

export type VisitSlotProposalStatus =
  | "pending_internal_approval"
  | "approved"
  | "sent_to_customer"
  | "confirmed_by_customer"
  | "rejected";

export type VisitSlotProposal = {
  id: string;
  threadId: string;
  customerId?: string;
  leadId?: string;
  kind: "estimate_visit" | "job";
  assignedTo: string;
  address: string;
  startAt: string;
  endAt?: string;
  status: VisitSlotProposalStatus;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
  confirmedAt?: string;
};

export type WhatsAppIntakeInput = {
  customerName: string;
  phone: string;
  serviceType: string;
  description: string;
  address?: string;
  measurements?: string;
  preferredWindow?: string;
  photos?: string[];
};
