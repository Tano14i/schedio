import type {
  ActivityLog,
  Automation,
  Customer,
  DashboardStat,
  Estimate,
  Invoice,
  Job,
  Lead,
  VisitSlotProposal,
  WhatsAppMessage,
  WhatsAppThread
} from "@/lib/types";

export const company = {
  id: "company_1",
  name: "Schedio",
  phone: "+39 347 555 1200",
  email: "ciao@schedio.it",
  address: "Via Manzoni 24, Milano"
};

export const users = [
  { id: "user_owner", name: "Luca Ferri", role: "owner" },
  { id: "user_worker_1", name: "Sara Colombo", role: "worker" },
  { id: "user_worker_2", name: "Matteo Riva", role: "worker" }
] as const;

export const customers: Customer[] = [
  {
    id: "cust_1",
    fullName: "Mario Rossi",
    phone: "+39 333 111 1001",
    email: "mario.rossi@email.it",
    address: "Via Verdi 5, Monza",
    notes: "Preferisce messaggi WhatsApp nel pomeriggio.",
    createdAt: "2026-03-03T09:15:00.000Z"
  },
  {
    id: "cust_2",
    fullName: "Laura Bianchi",
    phone: "+39 333 111 1002",
    email: "laura.bianchi@email.it",
    address: "Via Torino 18, Milano",
    createdAt: "2026-03-05T10:30:00.000Z"
  },
  {
    id: "cust_3",
    fullName: "Stefano Verdi",
    phone: "+39 333 111 1003",
    address: "Via Cavour 81, Sesto San Giovanni",
    createdAt: "2026-03-07T08:20:00.000Z"
  },
  {
    id: "cust_4",
    fullName: "Giulia Neri",
    phone: "+39 333 111 1004",
    email: "giulia.neri@email.it",
    address: "Via Diaz 43, Cinisello Balsamo",
    createdAt: "2026-03-11T14:10:00.000Z"
  },
  {
    id: "cust_5",
    fullName: "Marco Sala",
    phone: "+39 333 111 1005",
    email: "marco.sala@email.it",
    address: "Via Garibaldi 7, Monza",
    createdAt: "2026-03-14T16:45:00.000Z"
  }
];

export const leads: Lead[] = [
  {
    id: "lead_1",
    customerId: "cust_1",
    source: "phone",
    serviceType: "Riparazione porta",
    description: "Porta interna che non chiude bene, serve verifica cerniere.",
    urgency: "medium",
    preferredDate: "2026-03-27T08:30:00.000Z",
    status: "scheduled",
    createdAt: "2026-03-24T08:10:00.000Z",
    nextAction: "Aprire appuntamento e confermare dettagli"
  },
  {
    id: "lead_2",
    customerId: "cust_2",
    source: "web_form",
    serviceType: "Imbiancatura cucina",
    description: "Pareti e soffitto, cucina da 16 mq con piccole crepe.",
    urgency: "low",
    status: "quoted",
    createdAt: "2026-03-21T10:00:00.000Z",
    nextAction: "Aprire preventivo e fare follow-up oggi"
  },
  {
    id: "lead_3",
    customerId: "cust_3",
    source: "whatsapp",
    serviceType: "Montaggio mensole",
    description: "Tre mensole in salotto, parete in cartongesso.",
    urgency: "low",
    status: "won",
    createdAt: "2026-03-20T12:15:00.000Z",
    nextAction: "Pianificare data lavoro"
  },
  {
    id: "lead_4",
    customerId: "cust_4",
    source: "referral",
    serviceType: "Perdita rubinetto",
    description: "Perdita costante sotto il lavello della cucina.",
    urgency: "high",
    status: "new",
    createdAt: "2026-03-26T07:50:00.000Z",
    nextAction: "Richiamare entro 30 minuti"
  },
  {
    id: "lead_5",
    customerId: "cust_5",
    source: "manual",
    serviceType: "Riparazione tapparella",
    description: "Tapparella bloccata a meta corsa.",
    urgency: "medium",
    status: "contacted",
    createdAt: "2026-03-25T15:20:00.000Z",
    nextAction: "Proporre data/ora sopralluogo"
  }
];

export const jobs: Job[] = [
  {
    id: "job_1",
    leadId: "lead_1",
    customerId: "cust_1",
    title: "Sopralluogo porta interna",
    type: "estimate_visit",
    assignedTo: "Sara Colombo",
    startAt: "2026-03-27T09:00:00.000Z",
    endAt: "2026-03-27T09:45:00.000Z",
    status: "scheduled",
    address: "Via Verdi 5, Monza",
    notes: "Controllare allineamento telaio."
  },
  {
    id: "job_2",
    leadId: "lead_3",
    customerId: "cust_3",
    title: "Montaggio mensole salotto",
    type: "job",
    assignedTo: "Matteo Riva",
    startAt: "2026-03-30T13:00:00.000Z",
    endAt: "2026-03-30T15:00:00.000Z",
    status: "scheduled",
    address: "Via Cavour 81, Sesto San Giovanni"
  },
  {
    id: "job_3",
    customerId: "cust_4",
    title: "Intervento rubinetto cucina",
    type: "job",
    assignedTo: "Sara Colombo",
    startAt: "2026-03-26T15:30:00.000Z",
    endAt: "2026-03-26T17:00:00.000Z",
    status: "on_the_way",
    address: "Via Diaz 43, Cinisello Balsamo",
    notes: "Portare kit guarnizioni."
  }
];

export const estimates: Estimate[] = [
  {
    id: "est_1",
    customerId: "cust_1",
    leadId: "lead_1",
    number: "Q-2026-001",
    status: "sent",
    items: [
      { id: "item_1", label: "Riparazione porta", qty: 1, unitPrice: 230 },
      { id: "item_2", label: "Materiali", qty: 1, unitPrice: 50 }
    ],
    subtotal: 280,
    tax: 0,
    total: 280,
    validUntil: "2026-04-03T00:00:00.000Z",
    sentAt: "2026-03-24T11:30:00.000Z",
    publicToken: "quote-demo-001"
  },
  {
    id: "est_2",
    customerId: "cust_2",
    leadId: "lead_2",
    number: "Q-2026-002",
    status: "viewed",
    items: [
      { id: "item_3", label: "Imbiancatura cucina", qty: 1, unitPrice: 850 },
      { id: "item_4", label: "Preparazione superfici", qty: 1, unitPrice: 100 }
    ],
    subtotal: 950,
    tax: 0,
    total: 950,
    validUntil: "2026-04-01T00:00:00.000Z",
    sentAt: "2026-03-25T09:30:00.000Z",
    viewedAt: "2026-03-25T18:00:00.000Z",
    publicToken: "quote-demo-002"
  },
  {
    id: "est_3",
    customerId: "cust_3",
    leadId: "lead_3",
    jobId: "job_2",
    number: "Q-2026-003",
    status: "accepted",
    items: [
      { id: "item_5", label: "Montaggio mensole", qty: 1, unitPrice: 120 }
    ],
    subtotal: 120,
    tax: 0,
    total: 120,
    sentAt: "2026-03-22T12:30:00.000Z",
    acceptedAt: "2026-03-23T08:00:00.000Z",
    publicToken: "quote-demo-003"
  }
];

export const invoices: Invoice[] = [
  {
    id: "inv_1",
    customerId: "cust_2",
    number: "INV-2026-010",
    status: "sent",
    subtotal: 450,
    tax: 0,
    total: 450,
    dueDate: "2026-03-29T00:00:00.000Z",
    publicToken: "invoice-demo-010"
  },
  {
    id: "inv_2",
    customerId: "cust_3",
    estimateId: "est_3",
    jobId: "job_2",
    number: "INV-2026-011",
    status: "paid",
    subtotal: 220,
    tax: 0,
    total: 220,
    dueDate: "2026-03-24T00:00:00.000Z",
    paidAt: "2026-03-23T17:45:00.000Z",
    publicToken: "invoice-demo-011"
  }
];

export const automations: Automation[] = [
  {
    id: "auto_1",
    name: "Conferma appuntamento",
    type: "appointment_confirmation",
    channel: "sms",
    enabled: true,
    delayLabel: "Subito",
    conditions: "Quando viene creato un job",
    message:
      "Ciao {{firstName}}, appuntamento confermato per {{date}} alle {{time}} in {{address}}."
  },
  {
    id: "auto_2",
    name: "Reminder 24 ore",
    type: "appointment_reminder",
    channel: "sms",
    enabled: true,
    delayLabel: "24h prima",
    conditions: "Solo job non cancellati",
    message: "Promemoria: ci vediamo domani alle {{time}} per {{jobTitle}}."
  },
  {
    id: "auto_3",
    name: "Follow-up preventivo",
    type: "estimate_followup",
    channel: "email",
    enabled: true,
    delayLabel: "2 / 5 / 10 giorni",
    conditions: "Se il preventivo e ancora sent o viewed",
    message:
      "Hai avuto modo di vedere il preventivo? Se vuoi possiamo sentirci per chiarimenti. {{link}}"
  },
  {
    id: "auto_4",
    name: "Reminder fattura",
    type: "invoice_reminder",
    channel: "email",
    enabled: true,
    delayLabel: "-3 giorni / +3 giorni",
    conditions: "Solo fatture non pagate",
    message: "Ecco un promemoria per la fattura aperta: {{link}}"
  },
  {
    id: "auto_5",
    name: "Richiesta recensione",
    type: "review_request",
    channel: "sms",
    enabled: true,
    delayLabel: "24h dopo completamento",
    conditions: "A job completato o invoice paid",
    message:
      "Grazie ancora per averci scelto. Ci lasceresti una recensione? {{reviewLink}}"
  }
];

export const activityLogs: ActivityLog[] = [
  {
    id: "act_1",
    entityType: "lead",
    entityId: "lead_4",
    eventType: "lead_created",
    message: "Nuova richiesta da Giulia Neri per perdita rubinetto.",
    createdAt: "2026-03-26T07:50:00.000Z"
  },
  {
    id: "act_2",
    entityType: "estimate",
    entityId: "est_2",
    eventType: "estimate_viewed",
    message: "Laura Bianchi ha aperto il preventivo Q-2026-002.",
    createdAt: "2026-03-25T18:00:00.000Z"
  },
  {
    id: "act_3",
    entityType: "invoice",
    entityId: "inv_2",
    eventType: "invoice_paid",
    message: "Pagamento ricevuto per INV-2026-011.",
    createdAt: "2026-03-23T17:45:00.000Z"
  },
  {
    id: "act_4",
    entityType: "job",
    entityId: "job_3",
    eventType: "job_updated",
    message: "Sara Colombo e in arrivo per l'intervento su Giulia Neri.",
    createdAt: "2026-03-26T14:55:00.000Z"
  }
];

export const whatsappThreads: WhatsAppThread[] = [
  {
    id: "wa_thread_1",
    customerId: "cust_5",
    leadId: "lead_5",
    phone: "+39 333 111 1005",
    customerName: "Marco Sala",
    status: "awaiting_internal_approval",
    serviceType: "Riparazione tapparella",
    description: "Tapparella bloccata a meta corsa. Ho mandato due foto del cassonetto.",
    address: "Via Garibaldi 7, Monza",
    measurements: "Finestra larga circa 140 cm, altezza 160 cm.",
    preferredWindow: "Domani mattina o venerdi dopo le 15",
    photoCount: 2,
    lastMessagePreview: "Nuova proposta sopralluogo da approvare internamente.",
    lastMessageAt: "2026-03-26T10:20:00.000Z"
  },
  {
    id: "wa_thread_2",
    customerId: "cust_4",
    leadId: "lead_4",
    phone: "+39 333 111 1004",
    customerName: "Giulia Neri",
    status: "awaiting_customer_confirmation",
    serviceType: "Perdita rubinetto",
    description: "Perdita sotto il lavello. Ha mandato foto e chiede sopralluogo rapido.",
    address: "Via Diaz 43, Cinisello Balsamo",
    preferredWindow: "Oggi dopo le 17",
    photoCount: 3,
    lastMessagePreview: "Proposta sopralluogo inviata al cliente, attesa conferma.",
    lastMessageAt: "2026-03-26T11:15:00.000Z"
  }
];

export const whatsappMessages: WhatsAppMessage[] = [
  {
    id: "wa_msg_1",
    threadId: "wa_thread_1",
    direction: "outbound",
    type: "flow",
    text: "Abbiamo inviato il form WhatsApp per raccogliere dettagli, foto e misure opzionali.",
    createdAt: "2026-03-26T09:45:00.000Z"
  },
  {
    id: "wa_msg_2",
    threadId: "wa_thread_1",
    direction: "inbound",
    type: "text",
    text: "Tapparella bloccata a meta corsa. Finestra 140x160 circa.",
    createdAt: "2026-03-26T09:55:00.000Z"
  },
  {
    id: "wa_msg_3",
    threadId: "wa_thread_1",
    direction: "internal",
    type: "interactive",
    text: "Nuova proposta sopralluogo per Marco Sala - Riparazione tapparella: ven 27 mar, 10:00. Confermi?",
    createdAt: "2026-03-26T10:20:00.000Z"
  },
  {
    id: "wa_msg_4",
    threadId: "wa_thread_2",
    direction: "inbound",
    type: "text",
    text: "Per me va bene anche oggi dopo le 17, se riuscite.",
    createdAt: "2026-03-26T10:30:00.000Z"
  },
  {
    id: "wa_msg_5",
    threadId: "wa_thread_2",
    direction: "outbound",
    type: "text",
    text: "Ciao Giulia, possiamo fare il sopralluogo oggi alle 17:30 per perdita rubinetto. Ti va bene?",
    createdAt: "2026-03-26T11:15:00.000Z"
  }
];

export const whatsappSlotProposals: VisitSlotProposal[] = [
  {
    id: "wa_slot_1",
    threadId: "wa_thread_1",
    customerId: "cust_5",
    leadId: "lead_5",
    kind: "estimate_visit",
    assignedTo: "Sara Colombo",
    address: "Via Garibaldi 7, Monza",
    startAt: "2026-03-27T09:00:00.000Z",
    endAt: "2026-03-27T09:45:00.000Z",
    status: "pending_internal_approval",
    createdAt: "2026-03-26T10:20:00.000Z"
  },
  {
    id: "wa_slot_2",
    threadId: "wa_thread_2",
    customerId: "cust_4",
    leadId: "lead_4",
    kind: "estimate_visit",
    assignedTo: "Sara Colombo",
    address: "Via Diaz 43, Cinisello Balsamo",
    startAt: "2026-03-26T15:30:00.000Z",
    endAt: "2026-03-26T16:15:00.000Z",
    status: "sent_to_customer",
    createdAt: "2026-03-26T11:05:00.000Z",
    approvedAt: "2026-03-26T11:10:00.000Z",
    sentAt: "2026-03-26T11:15:00.000Z"
  }
];

export const dashboardStats: DashboardStat[] = [
  {
    id: "stat_1",
    label: "Richieste mese",
    value: "27",
    detail: "+6 vs mese scorso"
  },
  {
    id: "stat_2",
    label: "Primo contatto medio",
    value: "18 min",
    detail: "Le urgenze vengono richiamate subito"
  },
  {
    id: "stat_3",
    label: "Preventivi inviati",
    value: "11",
    detail: "6 accettati"
  },
  {
    id: "stat_4",
    label: "Fatture aperte",
    value: "4",
    detail: "€1.840 da incassare"
  },
  {
    id: "stat_5",
    label: "Incassato mese",
    value: "€6.380",
    detail: "Pagamenti chiusi questa settimana"
  },
  {
    id: "stat_6",
    label: "Tasso accettazione",
    value: "55%",
    detail: "Preventivi visti e seguiti bene"
  }
];

export function getCustomer(customerId: string) {
  return customers.find((customer) => customer.id === customerId);
}

export function getLead(leadId: string) {
  return leads.find((lead) => lead.id === leadId);
}

export function getJob(jobId: string) {
  return jobs.find((job) => job.id === jobId);
}

export function getEstimateByToken(token: string) {
  return estimates.find((estimate) => estimate.publicToken === token);
}

export function getInvoiceByToken(token: string) {
  return invoices.find((invoice) => invoice.publicToken === token);
}

export function getWhatsAppThread(threadId: string) {
  return whatsappThreads.find((thread) => thread.id === threadId);
}
