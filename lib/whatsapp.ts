import type {
  Customer,
  Lead,
  VisitSlotProposal,
  WhatsAppIntakeInput,
  WhatsAppMessage,
  WhatsAppThread
} from "@/lib/types";

type MetaWebhookChange = {
  value?: {
    messages?: Array<{
      id?: string;
      from?: string;
      type?: string;
      text?: { body?: string };
      image?: { id?: string; mime_type?: string };
      audio?: { id?: string; mime_type?: string };
      document?: { id?: string; mime_type?: string };
      interactive?: { type?: string };
      timestamp?: string;
    }>;
    contacts?: Array<{
      wa_id?: string;
      profile?: { name?: string };
    }>;
    statuses?: Array<{
      id?: string;
      status?: string;
      timestamp?: string;
      recipient_id?: string;
    }>;
  };
};

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function createLeadFromWhatsAppIntake(input: WhatsAppIntakeInput) {
  const createdAt = new Date().toISOString();
  const customerId = `cust_${crypto.randomUUID()}`;
  const leadId = `lead_${crypto.randomUUID()}`;
  const threadId = `wa_thread_${crypto.randomUUID()}`;

  const customer: Customer = {
    id: customerId,
    fullName: input.customerName.trim(),
    phone: normalizePhone(input.phone),
    address: input.address?.trim() || undefined,
    createdAt
  };

  const lead: Lead = {
    id: leadId,
    customerId,
    source: "whatsapp",
    serviceType: input.serviceType.trim(),
    description: input.description.trim(),
    urgency: "medium",
    preferredDate: undefined,
    photos: input.photos,
    status: "contacted",
    createdAt,
    nextAction: "Preparare proposta data/ora sopralluogo"
  };

  const thread: WhatsAppThread = {
    id: threadId,
    customerId,
    leadId,
    phone: normalizePhone(input.phone),
    customerName: input.customerName.trim(),
    status: "intake_ready",
    serviceType: input.serviceType.trim(),
    description: input.description.trim(),
    address: input.address?.trim() || undefined,
    measurements: input.measurements?.trim() || undefined,
    preferredWindow: input.preferredWindow?.trim() || undefined,
    photoCount: input.photos?.length ?? 0,
    lastMessagePreview: input.description.trim(),
    lastMessageAt: createdAt
  };

  const messages: WhatsAppMessage[] = [
    {
      id: `wa_msg_${crypto.randomUUID()}`,
      threadId,
      direction: "outbound",
      type: "flow",
      text: "Abbiamo inviato il form WhatsApp per raccogliere i dettagli del lavoro.",
      createdAt
    },
    {
      id: `wa_msg_${crypto.randomUUID()}`,
      threadId,
      direction: "inbound",
      type: "text",
      text: input.description.trim(),
      createdAt
    }
  ];

  return { customer, lead, thread, messages };
}

export function buildSuggestedVisitSlot(input: {
  threadId: string;
  customerId?: string;
  leadId?: string;
  address: string;
  assignedTo?: string;
  kind?: "estimate_visit" | "job";
  daysFromNow?: number;
}) {
  const base = new Date();
  const proposalDate = new Date(base);
  proposalDate.setDate(base.getDate() + (input.daysFromNow ?? 1));
  proposalDate.setHours(10, 0, 0, 0);

  const endAt = new Date(proposalDate);
  endAt.setMinutes(endAt.getMinutes() + 45);

  const proposal: VisitSlotProposal = {
    id: `wa_slot_${crypto.randomUUID()}`,
    threadId: input.threadId,
    customerId: input.customerId,
    leadId: input.leadId,
    kind: input.kind ?? "estimate_visit",
    assignedTo: input.assignedTo ?? "Sara Colombo",
    address: input.address,
    startAt: proposalDate.toISOString(),
    endAt: endAt.toISOString(),
    status: "pending_internal_approval",
    createdAt: new Date().toISOString()
  };

  return proposal;
}

export function approveVisitSlot(proposal: VisitSlotProposal): VisitSlotProposal {
  return {
    ...proposal,
    status: "sent_to_customer",
    approvedAt: proposal.approvedAt ?? new Date().toISOString(),
    sentAt: new Date().toISOString()
  };
}

export function confirmVisitSlot(proposal: VisitSlotProposal): VisitSlotProposal {
  return {
    ...proposal,
    status: "confirmed_by_customer",
    confirmedAt: new Date().toISOString()
  };
}

export function buildHandymanApprovalText(input: {
  customerName: string;
  serviceType?: string;
  startAt: string;
}) {
  const when = new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input.startAt));

  return `Nuova proposta sopralluogo per ${input.customerName}${input.serviceType ? ` - ${input.serviceType}` : ""}: ${when}. Confermi?`;
}

export function buildCustomerProposalText(input: {
  customerName: string;
  serviceType?: string;
  startAt: string;
}) {
  const when = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input.startAt));

  return `Ciao ${input.customerName}, possiamo fare il sopralluogo ${when}${input.serviceType ? ` per ${input.serviceType.toLowerCase()}` : ""}. Ti va bene?`;
}

export function buildWhatsAppTextPayload(to: string, body: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body
    }
  };
}

export function buildWhatsAppTemplatePayload(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
}) {
  return {
    messaging_product: "whatsapp",
    to: input.to,
    type: "template",
    template: {
      name: input.templateName,
      language: {
        code: input.languageCode ?? "it"
      },
      components: input.bodyParameters?.length
        ? [
            {
              type: "body",
              parameters: input.bodyParameters.map((parameter) => ({
                type: "text",
                text: parameter
              }))
            }
          ]
        : undefined
    }
  };
}

export function parseWhatsAppWebhookPayload(payload: unknown) {
  const changes =
    typeof payload === "object" && payload !== null
      ? ((payload as { entry?: Array<{ changes?: MetaWebhookChange[] }> }).entry ?? [])
          .flatMap((entry) => entry.changes ?? [])
      : [];

  const inboundMessages = changes.flatMap((change) =>
    (change.value?.messages ?? []).map((message) => ({
      id: message.id ?? `wa_msg_${crypto.randomUUID()}`,
      from: message.from ?? "",
      type: message.type ?? "text",
      mediaId: message.image?.id ?? message.audio?.id ?? message.document?.id,
      mimeType: message.image?.mime_type ?? message.audio?.mime_type ?? message.document?.mime_type,
      interactiveType: message.interactive?.type,
      text:
        message.text?.body ??
        (message.type === "image"
          ? "Foto ricevuta da cliente."
          : message.type === "audio"
            ? "Nota vocale ricevuta."
            : message.type === "document"
              ? "Documento ricevuto."
              : "Messaggio WhatsApp ricevuto."),
      timestamp: message.timestamp ?? new Date().toISOString(),
      raw: message
    }))
  );

  const statuses = changes.flatMap((change) =>
    (change.value?.statuses ?? []).map((status) => ({
      id: status.id ?? "",
      status: status.status ?? "unknown",
      recipient: status.recipient_id ?? "",
      timestamp: status.timestamp ?? new Date().toISOString()
    }))
  );

  const contacts = changes.flatMap((change) =>
    (change.value?.contacts ?? []).map((contact) => ({
      phone: contact.wa_id ?? "",
      name: contact.profile?.name ?? "Cliente WhatsApp"
    }))
  );

  return { inboundMessages, statuses, contacts };
}

export async function sendWhatsAppMessage(input: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  body: string;
  graphVersion?: string;
}) {
  const version = input.graphVersion ?? process.env.WHATSAPP_GRAPH_VERSION ?? "v22.0";

  const response = await fetch(
    `https://graph.facebook.com/${version}/${input.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`
      },
      body: JSON.stringify(buildWhatsAppTextPayload(input.to, input.body))
    }
  );

  return response;
}

export async function sendWhatsAppTemplate(input: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: string[];
  graphVersion?: string;
}) {
  const version = input.graphVersion ?? process.env.WHATSAPP_GRAPH_VERSION ?? "v22.0";

  const response = await fetch(
    `https://graph.facebook.com/${version}/${input.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`
      },
      body: JSON.stringify(
        buildWhatsAppTemplatePayload({
          to: input.to,
          templateName: input.templateName,
          languageCode: input.languageCode,
          bodyParameters: input.bodyParameters
        })
      )
    }
  );

  return response;
}

export const sendWhatsAppTextMessage = sendWhatsAppMessage;
