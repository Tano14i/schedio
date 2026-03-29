import {
  PrismaClient,
  UserRole,
  LeadSource,
  LeadStatus,
  JobStatus,
  JobCompletionStatus,
  JobType,
  EstimateStatus,
  InvoiceStatus,
  InvoiceReminderReason,
  InvoiceReminderStatus,
  AutomationChannel,
  AutomationLogStatus,
  AutomationType,
  AvailabilitySlotSource,
  AvailabilitySlotStatus,
  BudgetRange,
  JobSize,
  MessageTemplateKind,
  NextBestAction,
  ProposalApprovedVia,
  ReviewRequestStatus,
  QualificationConfidence,
  QualificationStatus,
  SchedulingProposalStatus,
  ServiceAreaMatch,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppThreadStatus
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedCustomerRow = [string, string, string | null, string | null];

async function main() {
  await prisma.reviewRequest.deleteMany();
  await prisma.invoiceReminder.deleteMany();
  await prisma.estimateFollowUp.deleteMany();
  await prisma.estimateTemplate.deleteMany();
  await prisma.schedulingProposal.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.whatsAppThread.deleteMany();
  await prisma.whatsAppContact.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.automationLog.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.estimateItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "Schedio",
      phone: "+39 347 555 1200",
      email: "ciao@schedio.it",
      address: "Via Manzoni 24, Milano"
    }
  });

  const [owner, workerA, workerB] = await Promise.all([
    prisma.user.create({
      data: {
        companyId: company.id,
        role: UserRole.OWNER,
        name: "Luca Ferri",
        email: "luca@schedio.it",
        passwordHash: "demo_hash"
      }
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        role: UserRole.WORKER,
        name: "Sara Colombo",
        email: "sara@schedio.it",
        passwordHash: "demo_hash"
      }
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        role: UserRole.WORKER,
        name: "Matteo Riva",
        email: "matteo@schedio.it",
        passwordHash: "demo_hash"
      }
    })
  ]);

  const customerRecords = await Promise.all(
    ([
      ["Mario Rossi", "+39 333 111 1001", "mario.rossi@email.it", "Via Verdi 5, Monza"],
      ["Laura Bianchi", "+39 333 111 1002", "laura.bianchi@email.it", "Via Torino 18, Milano"],
      ["Stefano Verdi", "+39 333 111 1003", null, "Via Cavour 81, Sesto San Giovanni"],
      ["Giulia Neri", "+39 333 111 1004", "giulia.neri@email.it", "Via Diaz 43, Cinisello Balsamo"],
      ["Marco Sala", "+39 333 111 1005", "marco.sala@email.it", "Via Garibaldi 7, Monza"]
    ] satisfies SeedCustomerRow[]).map(([fullName, phone, email, address]) =>
      prisma.customer.create({
        data: {
          companyId: company.id,
          fullName,
          phone,
          email: email ?? undefined,
          address: address ?? undefined
        }
      })
    )
  );

  const [mario, laura, stefano, giulia, marco] = customerRecords;

  const leadMario = await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: mario.id,
      source: LeadSource.PHONE,
      serviceType: "Riparazione porta",
      description: "Porta interna che non chiude bene, serve verifica cerniere.",
      urgency: "medium",
      urgencyLevel: "medium",
      preferredDate: new Date("2026-03-27T08:30:00.000Z"),
      status: LeadStatus.SCHEDULED,
      qualificationStatus: QualificationStatus.QUALIFIED,
      serviceAreaMatch: ServiceAreaMatch.INSIDE,
      jobSize: JobSize.SMALL,
      budgetRange: BudgetRange.MEDIUM,
      qualificationReason: "inside_area",
      qualificationConfidence: QualificationConfidence.HIGH,
      nextBestAction: NextBestAction.PROPOSE_VISIT,
      qualifiedAt: new Date("2026-03-24T08:15:00.000Z")
    }
  });

  const leadLaura = await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: laura.id,
      source: LeadSource.WEB_FORM,
      serviceType: "Imbiancatura cucina",
      description: "Pareti e soffitto, cucina da 16 mq con piccole crepe.",
      urgency: "low",
      urgencyLevel: "low",
      status: LeadStatus.QUOTED,
      qualificationStatus: QualificationStatus.QUALIFIED,
      serviceAreaMatch: ServiceAreaMatch.INSIDE,
      jobSize: JobSize.MEDIUM,
      budgetRange: BudgetRange.MEDIUM,
      qualificationReason: "inside_area",
      qualificationConfidence: QualificationConfidence.HIGH,
      nextBestAction: NextBestAction.PROPOSE_VISIT,
      qualifiedAt: new Date("2026-03-21T10:05:00.000Z")
    }
  });

  const leadStefano = await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: stefano.id,
      source: LeadSource.WHATSAPP,
      serviceType: "Montaggio mensole",
      description: "Tre mensole in salotto, parete in cartongesso.",
      urgency: "low",
      urgencyLevel: "low",
      status: LeadStatus.WON,
      qualificationStatus: QualificationStatus.QUALIFIED,
      serviceAreaMatch: ServiceAreaMatch.INSIDE,
      jobSize: JobSize.SMALL,
      budgetRange: BudgetRange.LOW,
      qualificationReason: "inside_area",
      qualificationConfidence: QualificationConfidence.MEDIUM,
      nextBestAction: NextBestAction.PROPOSE_VISIT,
      qualifiedAt: new Date("2026-03-20T12:18:00.000Z")
    }
  });

  await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: giulia.id,
      source: LeadSource.REFERRAL,
      serviceType: "Perdita rubinetto",
      description: "Perdita costante sotto il lavello della cucina.",
      urgency: "high",
      urgencyLevel: "high",
      status: LeadStatus.NEW,
      qualificationStatus: QualificationStatus.NEEDS_CLARIFICATION,
      serviceAreaMatch: ServiceAreaMatch.INSIDE,
      jobSize: JobSize.UNKNOWN,
      budgetRange: BudgetRange.UNKNOWN,
      qualificationReason: "missing_photos",
      qualificationConfidence: QualificationConfidence.MEDIUM,
      nextBestAction: NextBestAction.ASK_CLARIFICATION
    }
  });

  await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: marco.id,
      source: LeadSource.MANUAL,
      serviceType: "Riparazione tapparella",
      description: "Tapparella bloccata a meta corsa.",
      urgency: "medium",
      urgencyLevel: "medium",
      status: LeadStatus.CONTACTED,
      qualificationStatus: QualificationStatus.LOW_PRIORITY,
      serviceAreaMatch: ServiceAreaMatch.INSIDE,
      jobSize: JobSize.SMALL,
      budgetRange: BudgetRange.LOW,
      qualificationReason: "too_small",
      qualificationConfidence: QualificationConfidence.MEDIUM,
      nextBestAction: NextBestAction.DEFER
    }
  });

  const jobEstimate = await prisma.job.create({
    data: {
      companyId: company.id,
      leadId: leadMario.id,
      customerId: mario.id,
      assignedUserId: workerA.id,
      title: "Sopralluogo porta interna",
      type: JobType.ESTIMATE_VISIT,
      startAt: new Date("2026-03-27T09:00:00.000Z"),
      endAt: new Date("2026-03-27T09:45:00.000Z"),
      status: JobStatus.COMPLETED,
      address: mario.address ?? "",
      notes: "Controllare allineamento telaio.",
      completionStatus: JobCompletionStatus.COMPLETED,
      completedAt: new Date("2026-03-27T09:48:00.000Z"),
      completionNotes: "Cerniere consumate e telaio leggermente fuori asse. Intervento fattibile senza sostituzione completa.",
      internalSummary: "Servono regolazione, piallatura leggera e kit viti nuove.",
      estimateDraftedAt: new Date("2026-03-27T10:05:00.000Z")
    }
  });

  const jobWork = await prisma.job.create({
    data: {
      companyId: company.id,
      leadId: leadStefano.id,
      customerId: stefano.id,
      assignedUserId: workerB.id,
      title: "Montaggio mensole salotto",
      type: JobType.JOB,
      startAt: new Date("2026-03-30T13:00:00.000Z"),
      endAt: new Date("2026-03-30T15:00:00.000Z"),
      status: JobStatus.SCHEDULED,
      address: stefano.address ?? ""
    }
  });

  const est1 = await prisma.estimate.create({
    data: {
      companyId: company.id,
      customerId: mario.id,
      leadId: leadMario.id,
      jobId: jobEstimate.id,
      number: "Q-2026-001",
      status: EstimateStatus.SENT,
      title: "Preventivo riparazione porta interna",
      introText: "Abbiamo preparato il preventivo partendo dal sopralluogo effettuato oggi.",
      scopeSummary: "Regolazione porta interna, verifica cerniere e ripristino corretta chiusura.",
      notes: "Intervento previsto in una singola uscita. Preventivo valido salvo problemi nascosti sul telaio.",
      terms: "Pagamento a fine lavoro con bonifico o contanti.",
      subtotal: 280,
      tax: 0,
      total: 280,
      validUntil: new Date("2026-04-03T00:00:00.000Z"),
      sentAt: new Date("2026-03-24T11:30:00.000Z"),
      publicToken: "quote-demo-001",
      items: {
        create: [
          { label: "Riparazione porta", qty: 1, unitPrice: 230, sortOrder: 1 },
          { label: "Materiali", qty: 1, unitPrice: 50, sortOrder: 2 }
        ]
      }
    }
  });

  await prisma.estimate.create({
    data: {
      companyId: company.id,
      customerId: laura.id,
      leadId: leadLaura.id,
      number: "Q-2026-002",
      status: EstimateStatus.VIEWED,
      title: "Preventivo imbiancatura cucina",
      introText: "Di seguito trovi il riepilogo dell'intervento proposto.",
      scopeSummary: "Preparazione superfici e imbiancatura completa cucina da 16 mq.",
      notes: "Il colore definitivo verra confermato prima dell'inizio lavori.",
      terms: "Acconto 30% alla conferma, saldo a fine lavori.",
      subtotal: 950,
      tax: 0,
      total: 950,
      validUntil: new Date("2026-04-01T00:00:00.000Z"),
      sentAt: new Date("2026-03-25T09:30:00.000Z"),
      viewedAt: new Date("2026-03-25T18:00:00.000Z"),
      publicToken: "quote-demo-002",
      items: {
        create: [
          { label: "Imbiancatura cucina", qty: 1, unitPrice: 850, sortOrder: 1 },
          { label: "Preparazione superfici", qty: 1, unitPrice: 100, sortOrder: 2 }
        ]
      }
    }
  });

  const est3 = await prisma.estimate.create({
    data: {
      companyId: company.id,
      customerId: stefano.id,
      leadId: leadStefano.id,
      jobId: jobWork.id,
      number: "Q-2026-003",
      status: EstimateStatus.ACCEPTED,
      title: "Preventivo montaggio mensole",
      introText: "Ti confermiamo il riepilogo del lavoro richiesto.",
      scopeSummary: "Montaggio di tre mensole con fissaggio su parete in cartongesso.",
      notes: "Inclusa verifica punti di fissaggio e pulizia finale area lavoro.",
      terms: "Pagamento a fine lavoro.",
      subtotal: 120,
      tax: 0,
      total: 120,
      sentAt: new Date("2026-03-22T12:30:00.000Z"),
      acceptedAt: new Date("2026-03-23T08:00:00.000Z"),
      publicToken: "quote-demo-003",
      items: {
        create: [{ label: "Montaggio mensole", qty: 1, unitPrice: 120, sortOrder: 1 }]
      }
    }
  });

  const invoiceOpen = await prisma.invoice.create({
    data: {
      companyId: company.id,
      customerId: laura.id,
      number: "INV-2026-010",
      status: InvoiceStatus.SENT,
      title: "Fattura acconto imbiancatura cucina",
      notes: "Acconto relativo all'intervento concordato.",
      terms: "Pagamento entro la data di scadenza indicata.",
      subtotal: 450,
      tax: 0,
      total: 450,
      dueDate: new Date("2026-03-29T00:00:00.000Z"),
      sentAt: new Date("2026-03-25T10:30:00.000Z"),
      viewedAt: new Date("2026-03-25T16:20:00.000Z"),
      publicToken: "invoice-demo-010",
      items: {
        create: [{ label: "Imbiancatura acconto", qty: 1, unitPrice: 450, sortOrder: 1 }]
      }
    }
  });

  await prisma.invoiceReminder.create({
    data: {
      companyId: company.id,
      invoiceId: invoiceOpen.id,
      channel: "whatsapp",
      scheduledFor: new Date("2026-04-01T10:30:00.000Z"),
      status: InvoiceReminderStatus.SCHEDULED,
      reason: InvoiceReminderReason.OVERDUE
    }
  });

  const invoicePaid = await prisma.invoice.create({
    data: {
      companyId: company.id,
      customerId: stefano.id,
      leadId: leadStefano.id,
      estimateId: est3.id,
      jobId: jobWork.id,
      number: "INV-2026-011",
      status: InvoiceStatus.PAID,
      title: "Fattura montaggio mensole",
      notes: "Saldo lavoro completato.",
      terms: "Pagamento a fine lavoro.",
      subtotal: 220,
      tax: 0,
      total: 220,
      dueDate: new Date("2026-03-24T00:00:00.000Z"),
      sentAt: new Date("2026-03-23T09:00:00.000Z"),
      viewedAt: new Date("2026-03-23T10:15:00.000Z"),
      paidAt: new Date("2026-03-23T17:45:00.000Z"),
      publicToken: "invoice-demo-011",
      items: {
        create: [{ label: "Montaggio mensole saldo", qty: 1, unitPrice: 220, sortOrder: 1 }]
      }
    }
  });

  await prisma.reviewRequest.create({
    data: {
      companyId: company.id,
      customerId: stefano.id,
      jobId: jobWork.id,
      invoiceId: invoicePaid.id,
      channel: "whatsapp",
      reviewLink: "https://g.page/r/demo-review-link",
      scheduledFor: new Date("2026-03-24T17:45:00.000Z"),
      sentAt: new Date("2026-03-24T18:00:00.000Z"),
      status: ReviewRequestStatus.SENT
    }
  });

  await prisma.automation.createMany({
    data: [
      {
        companyId: company.id,
        type: AutomationType.APPOINTMENT_CONFIRMATION,
        channel: AutomationChannel.SMS,
        enabled: true,
        delayMinutes: 0,
        template: "Appuntamento confermato per {{date}} alle {{time}}.",
        conditionsJson: { trigger: "job.created" }
      },
      {
        companyId: company.id,
        type: AutomationType.ESTIMATE_FOLLOWUP,
        channel: AutomationChannel.SMS,
        enabled: true,
        delayMinutes: 2880,
        template: "Ciao {{firstName}}, hai avuto modo di vedere il preventivo? Se vuoi possiamo chiarire qualsiasi dubbio. {{link}}",
        conditionsJson: { statuses: ["SENT"] }
      }
    ]
  });

  await prisma.estimateTemplate.createMany({
    data: [
      {
        companyId: company.id,
        name: "Riparazione porta",
        serviceType: "Riparazione porta",
        introText: "Abbiamo preparato il preventivo partendo dal sopralluogo.",
        scopeSummary: "Intervento di ripristino e regolazione porta.",
        notes: "Include uscita, regolazione e piccola ferramenta.",
        terms: "Pagamento a fine lavoro.",
        itemsJson: [
          {
            label: "Intervento riparazione porta",
            description: "Regolazione, verifica cerniere e ripristino chiusura.",
            qty: 1,
            unitPrice: 230
          },
          {
            label: "Materiali e ferramenta",
            description: "Viti, spessori e minuteria.",
            qty: 1,
            unitPrice: 50
          }
        ]
      },
      {
        companyId: company.id,
        name: "Imbiancatura cucina",
        serviceType: "Imbiancatura cucina",
        introText: "Di seguito trovi il preventivo per l'intervento richiesto.",
        scopeSummary: "Protezione superfici, preparazione e imbiancatura.",
        notes: "Esclusi lavori murari extra.",
        terms: "Acconto 30% alla conferma.",
        itemsJson: [
          {
            label: "Imbiancatura cucina",
            description: "Pareti e soffitto fino a 16 mq.",
            qty: 1,
            unitPrice: 850
          },
          {
            label: "Preparazione superfici",
            description: "Coprimobili, stuccature leggere e pulizia.",
            qty: 1,
            unitPrice: 100
          }
        ]
      },
      {
        companyId: company.id,
        name: "Montaggio mensole",
        serviceType: "Montaggio mensole",
        introText: "Preventivo precompilato dai dati raccolti durante il sopralluogo.",
        scopeSummary: "Montaggio e fissaggio mensole con verifica supporto.",
        notes: "Ferramenta standard inclusa.",
        terms: "Pagamento a fine lavoro.",
        itemsJson: [
          {
            label: "Montaggio mensole",
            description: "Fissaggio e verifica allineamento.",
            qty: 1,
            unitPrice: 120
          }
        ]
      }
    ]
  });

  await prisma.serviceArea.createMany({
    data: [
      {
        companyId: company.id,
        label: "Milano e hinterland",
        city: "Milano",
        postalCodePrefix: "20"
      },
      {
        companyId: company.id,
        label: "Monza",
        city: "Monza",
        postalCodePrefix: "209"
      },
      {
        companyId: company.id,
        label: "Cinisello e Sesto",
        city: "Cinisello Balsamo",
        postalCodePrefix: "2009"
      }
    ]
  });

  await prisma.estimateFollowUp.create({
    data: {
      companyId: company.id,
      estimateId: est1.id,
      channel: "whatsapp",
      status: "scheduled",
      reason: "no_view",
      scheduledFor: new Date("2026-03-26T11:30:00.000Z")
    }
  });

  await prisma.activityLog.createMany({
    data: [
      {
        companyId: company.id,
        entityType: "lead",
        entityId: leadMario.id,
        eventType: "lead_scheduled",
        metadataJson: { message: "Lead schedulato per sopralluogo." }
      },
      {
        companyId: company.id,
        entityType: "job",
        entityId: jobEstimate.id,
        eventType: "appointment_confirmed",
        metadataJson: { message: "Conferma appuntamento inviata al cliente." }
      },
      {
        companyId: company.id,
        entityType: "estimate",
        entityId: est3.id,
        eventType: "estimate_accepted",
        metadataJson: { message: "Preventivo accettato dal cliente." }
      },
      {
        companyId: company.id,
        entityType: "job",
        entityId: jobEstimate.id,
        eventType: "job_completed",
        metadataJson: { message: "Sopralluogo completato con riepilogo pronto per il preventivo." }
      },
      {
        companyId: company.id,
        entityType: "estimate",
        entityId: est1.id,
        eventType: "estimate_followup_scheduled",
        metadataJson: { message: "Follow-up preventivo programmato dopo 48 ore." }
      },
      {
        companyId: company.id,
        entityType: "invoice",
        entityId: invoiceOpen.id,
        eventType: "invoice_reminder_scheduled",
        metadataJson: { message: "Reminder fattura programmato a 3 giorni dalla scadenza." }
      },
      {
        companyId: company.id,
        entityType: "invoice",
        entityId: invoicePaid.id,
        eventType: "invoice_paid",
        metadataJson: { message: "Pagamento registrato e review request pianificata." }
      }
    ]
  });

  await prisma.messageTemplate.createMany({
    data: [
      {
        companyId: company.id,
        code: "start_request",
        channel: "whatsapp",
        templateKind: MessageTemplateKind.META_TEMPLATE,
        metaTemplateName: "start_request",
        locale: "it",
        body: "Ciao {{1}}, apri il form per iniziare la richiesta.",
        variablesJson: { cta: "Apri form" }
      },
      {
        companyId: company.id,
        code: "visit_proposal",
        channel: "whatsapp",
        templateKind: MessageTemplateKind.SESSION_TEXT,
        locale: "it",
        body: "Ciao {{firstName}}, possiamo fare il sopralluogo il {{date}} alle {{time}}. Ti va bene?"
      }
    ]
  });

  const marcoContact = await prisma.whatsAppContact.create({
    data: {
      companyId: company.id,
      customerId: marco.id,
      waId: "393331111005",
      profileName: "Marco Sala",
      lastInboundAt: new Date("2026-03-26T09:55:00.000Z")
    }
  });

  const giuliaContact = await prisma.whatsAppContact.create({
    data: {
      companyId: company.id,
      customerId: giulia.id,
      waId: "393331111004",
      profileName: "Giulia Neri",
      lastInboundAt: new Date("2026-03-26T10:30:00.000Z"),
      lastOutboundAt: new Date("2026-03-26T11:15:00.000Z")
    }
  });

  const leadMarco = await prisma.lead.findFirstOrThrow({
    where: { companyId: company.id, customerId: marco.id }
  });
  const leadGiulia = await prisma.lead.findFirstOrThrow({
    where: { companyId: company.id, customerId: giulia.id }
  });

  const marcoThread = await prisma.whatsAppThread.create({
    data: {
      companyId: company.id,
      contactId: marcoContact.id,
      customerId: marco.id,
      leadId: leadMarco.id,
      status: WhatsAppThreadStatus.WAITING_INTERNAL_APPROVAL,
      lastMessageAt: new Date("2026-03-26T10:20:00.000Z"),
      lastInboundAt: new Date("2026-03-26T09:55:00.000Z")
    }
  });

  const giuliaThread = await prisma.whatsAppThread.create({
    data: {
      companyId: company.id,
      contactId: giuliaContact.id,
      customerId: giulia.id,
      leadId: leadGiulia.id,
      status: WhatsAppThreadStatus.WAITING_CUSTOMER_CONFIRMATION,
      lastMessageAt: new Date("2026-03-26T11:15:00.000Z"),
      lastInboundAt: new Date("2026-03-26T10:30:00.000Z"),
      lastOutboundAt: new Date("2026-03-26T11:15:00.000Z")
    }
  });

  await prisma.whatsAppMessage.createMany({
    data: [
      {
        companyId: company.id,
        threadId: marcoThread.id,
        contactId: marcoContact.id,
        direction: WhatsAppMessageDirection.OUTBOUND,
        messageType: WhatsAppMessageType.TEMPLATE,
        templateName: "start_request",
        textBody: "Abbiamo inviato il form WhatsApp per raccogliere dettagli, foto e misure opzionali.",
        status: WhatsAppMessageStatus.DELIVERED,
        sentAt: new Date("2026-03-26T09:45:00.000Z")
      },
      {
        companyId: company.id,
        threadId: marcoThread.id,
        contactId: marcoContact.id,
        direction: WhatsAppMessageDirection.INBOUND,
        messageType: WhatsAppMessageType.TEXT,
        textBody: "Tapparella bloccata a meta corsa. Finestra 140x160 circa.",
        receivedAt: new Date("2026-03-26T09:55:00.000Z")
      },
      {
        companyId: company.id,
        threadId: marcoThread.id,
        contactId: marcoContact.id,
        direction: WhatsAppMessageDirection.INBOUND,
        messageType: WhatsAppMessageType.IMAGE,
        mediaId: "wamid.media.marco.1",
        mediaUrl: "https://example.com/meta/media/marco-1",
        mimeType: "image/jpeg",
        storagePath: "whatsapp/marco-sala/tapparella-1.jpg",
        receivedAt: new Date("2026-03-26T09:56:00.000Z")
      },
      {
        companyId: company.id,
        threadId: giuliaThread.id,
        contactId: giuliaContact.id,
        direction: WhatsAppMessageDirection.INBOUND,
        messageType: WhatsAppMessageType.TEXT,
        textBody: "Per me va bene anche oggi dopo le 17, se riuscite.",
        receivedAt: new Date("2026-03-26T10:30:00.000Z")
      },
      {
        companyId: company.id,
        threadId: giuliaThread.id,
        contactId: giuliaContact.id,
        direction: WhatsAppMessageDirection.OUTBOUND,
        messageType: WhatsAppMessageType.TEXT,
        textBody: "Ciao Giulia, possiamo fare il sopralluogo oggi alle 17:30 per perdita rubinetto. Ti va bene?",
        status: WhatsAppMessageStatus.SENT,
        sentAt: new Date("2026-03-26T11:15:00.000Z")
      }
    ]
  });

  const saraSlotA = await prisma.availabilitySlot.create({
    data: {
      companyId: company.id,
      userId: workerA.id,
      startsAt: new Date("2026-03-27T09:00:00.000Z"),
      endsAt: new Date("2026-03-27T09:45:00.000Z"),
      status: AvailabilitySlotStatus.RESERVED,
      source: AvailabilitySlotSource.GENERATED,
      relatedLeadId: leadMarco.id
    }
  });

  const saraSlotB = await prisma.availabilitySlot.create({
    data: {
      companyId: company.id,
      userId: workerA.id,
      startsAt: new Date("2026-03-26T15:30:00.000Z"),
      endsAt: new Date("2026-03-26T16:15:00.000Z"),
      status: AvailabilitySlotStatus.RESERVED,
      source: AvailabilitySlotSource.GENERATED,
      relatedLeadId: leadGiulia.id
    }
  });

  await prisma.schedulingProposal.createMany({
    data: [
      {
        companyId: company.id,
        leadId: leadMarco.id,
        handymanUserId: workerA.id,
        threadId: marcoThread.id,
        status: SchedulingProposalStatus.PENDING_HANDYMAN_APPROVAL,
        selectedSlotId: saraSlotA.id,
        candidateSlotsJson: [
          {
            startsAt: "2026-03-27T09:00:00.000Z",
            endsAt: "2026-03-27T09:45:00.000Z"
          },
          {
            startsAt: "2026-03-27T11:00:00.000Z",
            endsAt: "2026-03-27T11:45:00.000Z"
          }
        ],
        publicToken: "sched-proposal-marco-001"
      },
      {
        companyId: company.id,
        leadId: leadGiulia.id,
        handymanUserId: workerA.id,
        threadId: giuliaThread.id,
        status: SchedulingProposalStatus.SENT_TO_CUSTOMER,
        approvedVia: ProposalApprovedVia.PANEL,
        selectedSlotId: saraSlotB.id,
        candidateSlotsJson: [
          {
            startsAt: "2026-03-26T15:30:00.000Z",
            endsAt: "2026-03-26T16:15:00.000Z"
          }
        ],
        publicToken: "sched-proposal-giulia-001"
      }
    ]
  });

  console.log(`Seed completato per ${company.name} con owner ${owner.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
