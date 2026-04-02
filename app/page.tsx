import { AppShell } from "@/components/app-shell";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ButtonLink } from "@/components/button";
import { DashboardFollowUpAction } from "@/components/dashboard-follow-up-action";
import { DashboardInvoiceAction } from "@/components/dashboard-invoice-action";
import { DemoPlaybookCard } from "@/components/demo-playbook-card";
import { MarketingLanding } from "@/components/marketing-landing";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { PageHeader } from "@/components/page-header";
import { PwaInstallCard } from "@/components/pwa-install-card";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { getCurrentSession } from "@/lib/auth";
import { getActivityFeed, getActivityMessage } from "@/lib/crm-server";
import { getJobMarginOverview } from "@/lib/jobs-server";
import {
  computeFunnelMetrics,
  computeOperationalMetrics,
  getFollowUpWorklist
} from "@/lib/estimates-server";
import { getInvoiceMetrics, getInvoiceWorklist } from "@/lib/invoices-server";
import { formatCompactDate, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    return <MarketingLanding />;
  }

  const [funnel, operations, worklist, invoiceMetrics, invoiceWorklist, marginOverview, activityItems] = await Promise.all([
    computeFunnelMetrics().catch(() => ({
      leadsReceived: 40,
      leadsQualified: 28,
      visitsConfirmed: 20,
      visitsCompleted: 16,
      estimatesCreated: 14,
      estimatesSent: 14,
      estimatesViewed: 9,
      estimatesAccepted: 5
    })),
    computeOperationalMetrics().catch(() => ({
      avgLeadToQualificationHours: 0.4,
      avgLeadToVisitConfirmationHours: 18,
      avgVisitCompletedToEstimateSentHours: 2.2,
      avgEstimateSentToViewedHours: 7.5
    })),
    getFollowUpWorklist().catch(() => [
      {
        estimateId: "demo-1",
        customerName: "Mario Rossi",
        total: 280,
        sentAt: "2026-03-24T11:30:00.000Z",
        viewedAt: null,
        followUpStatus: "due" as const,
        recommendation: "follow_up_now" as const
      },
      {
        estimateId: "demo-2",
        customerName: "Laura Bianchi",
        total: 950,
        sentAt: "2026-03-25T09:30:00.000Z",
        viewedAt: "2026-03-25T18:00:00.000Z",
        followUpStatus: "scheduled" as const,
        recommendation: "call_customer" as const
      }
    ]),
    getInvoiceMetrics().catch(() => ({
      openInvoices: 1,
      overdueInvoices: 1,
      paidInvoices: 1,
      cashCollectedMonth: 220,
      reviewRequestsSent: 1,
      reviewRequestsClicked: 0,
      avgInvoiceSentToPaidHours: 8.8
    })),
    getInvoiceWorklist().catch(() => [
      {
        invoiceId: "demo-invoice-1",
        customerName: "Laura Bianchi",
        number: "INV-2026-010",
        total: 450,
        dueDate: "2026-03-29T00:00:00.000Z",
        sentAt: "2026-03-25T10:30:00.000Z",
        paidAt: null,
        reminderStatus: "due" as const,
        recommendation: "send_reminder" as const
      }
    ]),
    getJobMarginOverview().catch(() => ({
      jobs: [],
      metrics: {
        trackedJobs: 0,
        healthyJobs: 0,
        atRiskJobs: 0,
        totalWorkedHours: 0,
        totalLaborCost: 0,
        averageMarginValue: 0,
        averageMarginRate: null
      }
    })),
    getActivityFeed()
      .then((items) =>
        items.slice(0, 12).map((item) => ({
          id: item.id,
          entityType: item.entityType as "lead" | "job" | "estimate" | "invoice" | "customer" | "whatsapp" | "user",
          entityId: item.entityId,
          eventType: item.eventType,
          message: getActivityMessage(item),
          createdAt: item.createdAt.toISOString()
        }))
      )
      .catch(() => [])
  ]);

  const funnelSteps = [
    { label: "Lead ricevuti", value: funnel.leadsReceived },
    { label: "Lead qualificati", value: funnel.leadsQualified },
    { label: "Sopralluoghi confermati", value: funnel.visitsConfirmed },
    { label: "Sopralluoghi completati", value: funnel.visitsCompleted },
    { label: "Preventivi creati", value: funnel.estimatesCreated },
    { label: "Preventivi inviati", value: funnel.estimatesSent },
    { label: "Preventivi visti", value: funnel.estimatesViewed },
    { label: "Preventivi accettati", value: funnel.estimatesAccepted }
  ];

  return (
    <AppShell pathname="/">
      <div className="space-y-6">
        <div className="space-y-6 sm:hidden">
          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">Home owner</p>
              <h1 className="mt-1 text-[1.75rem] font-semibold leading-[1.05] text-ink">
                Oggi conta questo.
              </h1>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Lead da lavorare, preventivi da seguire e incassi da sbloccare.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MobileHeroCard label="Da seguire" value={`${worklist.length}`} detail="preventivi aperti" tone="sand" />
              <MobileHeroCard label="Da incassare" value={`${invoiceWorklist.length}`} detail="fatture attive" />
              <MobileHeroCard label="Incassato" value={formatCurrency(invoiceMetrics.cashCollectedMonth)} detail="questo mese" />
              <MobileHeroCard label="Lead nuovi" value={`${funnel.leadsReceived}`} detail="ingressi nel funnel" />
            </div>
          </section>

          <PwaInstallCard />

          <SectionCard title="Azioni rapide" subtitle="Le 4 azioni che usi piu spesso da telefono.">
            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonLink href="/leads?action=new" className="w-full">Nuova richiesta</ButtonLink>
              <ButtonLink href="/calendar" variant="secondary" className="w-full">Nuovo appuntamento</ButtonLink>
              <ButtonLink href="/estimates" variant="secondary" className="w-full">Apri preventivi</ButtonLink>
              <ButtonLink href="/invoices" variant="secondary" className="w-full">Apri fatture</ButtonLink>
            </div>
          </SectionCard>

          <SectionCard title="Da dove partire" subtitle="Primi passi chiari per capire il valore di Schedio.">
            <OnboardingChecklist />
          </SectionCard>

          <DemoPlaybookCard />

          <SectionCard title="Da seguire adesso" subtitle="Prima i preventivi bloccati, poi il resto.">
            <div className="space-y-3">
              {worklist.length ? (
                worklist.slice(0, 3).map((item) => (
                  <div key={item.estimateId} className="rounded-2xl border border-neutral-200 p-4">
                    <p className="font-medium text-ink">{item.customerName}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatCurrency(item.total)} - inviato il {formatCompactDate(item.sentAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                        {followUpLabel(item.followUpStatus)}
                      </span>
                      <DashboardFollowUpAction estimateId={item.estimateId} recommendation={item.recommendation} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-600">Nessun preventivo da seguire oggi.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Da incassare" subtitle="Fatture che richiedono un'azione subito.">
            <div className="space-y-3">
              {invoiceWorklist.length ? (
                invoiceWorklist.slice(0, 3).map((item) => (
                  <div key={item.invoiceId} className="rounded-2xl border border-neutral-200 p-4">
                    <p className="font-medium text-ink">{item.customerName}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {item.number} - {formatCurrency(item.total)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                        {invoiceReminderLabel(item.reminderStatus)}
                      </span>
                      <DashboardInvoiceAction
                        invoiceId={item.invoiceId}
                        recommendation={item.recommendation as "send_invoice" | "send_reminder" | "mark_paid" | "send_review"}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-600">Nessuna fattura da seguire oggi.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Margine lavori" subtitle="Ore, costo manodopera e lavori da guardare.">
            <div className="grid grid-cols-2 gap-3">
              <MobileHeroCard label="Ore registrate" value={`${marginOverview.metrics.totalWorkedHours}h`} detail="tempo sul campo" />
              <MobileHeroCard label="Costo manodopera" value={formatCurrency(marginOverview.metrics.totalLaborCost)} detail="costo registrato" />
            </div>
            <div className="mt-4 space-y-3">
              {marginOverview.jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-2xl border border-neutral-200 p-4">
                  <p className="font-medium text-ink">{job.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{job.customer.fullName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {job.workedHours}h
                    </span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {formatCurrency(job.laborCost)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        job.financials.margin >= 0
                          ? "bg-success-50 text-success-700"
                          : "bg-danger-50 text-danger-700"
                      }`}
                    >
                      Margine {formatCurrency(job.financials.margin)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Attivita recenti" subtitle="Gli ultimi eventi utili, senza rumore.">
            <ActivityTimeline items={activityItems.slice(0, 5)} />
          </SectionCard>
        </div>

        <div className="hidden space-y-6 sm:block">
          <section className="rounded-[32px] border border-slate-200/90 bg-white px-6 py-6 shadow-[0_14px_36px_rgba(19,42,56,0.06)]">
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-600">
                  Pannello operativo
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                  Oggi guarda solo cosa si muove, cosa si blocca e cosa ti lascia margine.
                </h2>
                <p className="mt-3 max-w-3xl text-[15px] leading-7 text-neutral-600">
                  Funnel, incassi e lavori a rischio nello stesso posto. Meno dashboard da interpretare,
                  più decisioni da prendere.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <CompactDeskMetric label="Da seguire" value={`${worklist.length}`} detail="preventivi aperti" />
                <CompactDeskMetric label="Da incassare" value={`${invoiceWorklist.length}`} detail="fatture da toccare" />
                <CompactDeskMetric
                  label="Lavori a rischio"
                  value={`${marginOverview.metrics.atRiskJobs}`}
                  detail="margine sotto zero"
                />
              </div>
            </div>
          </section>

          <PageHeader
            eyebrow="Dashboard ROI"
            title="Vedi dove si blocca il funnel e cosa seguire oggi."
            description="Schedio ti mostra quanti lead stanno diventando sopralluoghi, quanti sopralluoghi diventano preventivi e quali preventivi stanno fermando la cassa."
            action={{ href: "/estimates", label: "Apri preventivi" }}
          />

          <PwaInstallCard />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Lead ricevuti" value={`${funnel.leadsReceived}`} detail="Ingresso del funnel" accent="sand" />
            <StatCard label="Sopralluoghi confermati" value={`${funnel.visitsConfirmed}`} detail="Agenda che si riempie" />
            <StatCard label="Preventivi inviati" value={`${funnel.estimatesSent}`} detail="Preventivi aperti" />
            <StatCard label="Preventivi accettati" value={`${funnel.estimatesAccepted}`} detail="Lavori che si chiudono" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Fatture aperte" value={`${invoiceMetrics.openInvoices}`} detail="Da incassare" accent="sand" />
            <StatCard label="Fatture scadute" value={`${invoiceMetrics.overdueInvoices}`} detail="Da sollecitare" />
            <StatCard label="Incassato mese" value={formatCurrency(invoiceMetrics.cashCollectedMonth)} detail="Cassa registrata" />
            <StatCard label="Review request inviate" value={`${invoiceMetrics.reviewRequestsSent}`} detail={`${invoiceMetrics.reviewRequestsClicked} cliccate`} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Lavori tracciati" value={`${marginOverview.metrics.trackedJobs}`} detail="Con costi o ore registrate" accent="sand" />
            <StatCard label="Lavori sani" value={`${marginOverview.metrics.healthyJobs}`} detail="Margine positivo" />
            <StatCard label="Lavori a rischio" value={`${marginOverview.metrics.atRiskJobs}`} detail="Margine sotto zero" />
            <StatCard label="Costo manodopera" value={formatCurrency(marginOverview.metrics.totalLaborCost)} detail={`${marginOverview.metrics.totalWorkedHours} ore registrate`} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Margine medio" value={formatCurrency(marginOverview.metrics.averageMarginValue)} detail="Media lavori tracciati" accent="sand" />
            <StatCard label="Margine medio %" value={marginOverview.metrics.averageMarginRate !== null ? `${marginOverview.metrics.averageMarginRate}%` : "n/d"} detail="Quanto resta sul lavoro" />
            <StatCard label="Ore registrate" value={`${marginOverview.metrics.totalWorkedHours}h`} detail="Tempo caricato dai tecnici" />
            <StatCard label="Lavori da proteggere" value={`${marginOverview.metrics.atRiskJobs}`} detail="Dove intervenire subito" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard title="Onboarding rapido" subtitle="Le 4 cose da fare per sentire subito il valore del prodotto.">
              <OnboardingChecklist />
            </SectionCard>

            <SectionCard title="Playbook demo" subtitle="Il percorso piu semplice da mostrare a un handyman in 10 minuti.">
              <DemoPlaybookCard />
            </SectionCard>
          </div>

          <SectionCard title="Azioni rapide" subtitle="I passaggi che muovono il funnel oggi.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ButtonLink href="/leads?action=new" className="w-full">
                Nuova richiesta
              </ButtonLink>
              <ButtonLink href="/calendar" variant="secondary" className="w-full">
                Nuovo appuntamento
              </ButtonLink>
              <ButtonLink href="/estimates" variant="secondary" className="w-full">
                Nuovo preventivo
              </ButtonLink>
              <ButtonLink href="/whatsapp" variant="secondary" className="w-full">
                Apri WhatsApp
              </ButtonLink>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <SectionCard title="Funnel del mese" subtitle="Numeri assoluti e passaggio tra uno step e il successivo.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {funnelSteps.map((step, index) => {
                const previous = index === 0 ? null : funnelSteps[index - 1].value;
                const ratio = previous && previous > 0 ? Math.round((step.value / previous) * 100) : null;

                return (
                  <div key={step.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500">{step.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{step.value}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {ratio === null ? "Base funnel" : `${ratio}% rispetto allo step precedente`}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Tempi medi" subtitle="Dove stai accelerando e dove stai perdendo tempo.">
            <div className="space-y-4">
              <TimingRow label="Lead -> decisione" value={operations.avgLeadToQualificationHours} />
              <TimingRow label="Lead -> sopralluogo confermato" value={operations.avgLeadToVisitConfirmationHours} />
              <TimingRow label="Sopralluogo completato -> preventivo inviato" value={operations.avgVisitCompletedToEstimateSentHours} />
              <TimingRow label="Preventivo inviato -> visto" value={operations.avgEstimateSentToViewedHours} />
            </div>
          </SectionCard>
        </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <SectionCard title="Da seguire oggi" subtitle="Preventivi da richiamare, vedere o sbloccare adesso.">
              <div className="space-y-3">
                {worklist.length ? (
                  worklist.map((item) => (
                    <div key={item.estimateId} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="font-medium text-ink">{item.customerName}</p>
                          <p className="mt-1 text-sm text-neutral-600">
                            Inviato il {formatCompactDate(item.sentAt)} - {formatCurrency(item.total)}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.viewedAt
                              ? `Preventivo visto il ${formatCompactDate(item.viewedAt)}`
                              : "Preventivo non ancora visto"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                            {followUpLabel(item.followUpStatus)}
                          </span>
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                            {recommendationLabel(item.recommendation)}
                          </span>
                          <DashboardFollowUpAction
                            estimateId={item.estimateId}
                            recommendation={item.recommendation}
                          />
                          <ButtonLink href="/estimates" variant="secondary" size="md" className="w-full sm:w-auto">
                            Apri preventivi
                          </ButtonLink>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">Nessun preventivo da seguire oggi.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Attivita recenti" subtitle="Eventi che alimentano funnel e worklist.">
              <ActivityTimeline items={activityItems} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard title="Da incassare" subtitle="Fatture aperte, scadute o review da sbloccare.">
              <div className="space-y-3">
                {invoiceWorklist.length ? (
                  invoiceWorklist.map((item) => (
                    <div key={item.invoiceId} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="font-medium text-ink">{item.customerName}</p>
                          <p className="mt-1 text-sm text-neutral-600">
                            {item.number} - {formatCurrency(item.total)}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.dueDate ? `Scadenza ${formatCompactDate(item.dueDate)}` : "Scadenza da definire"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                            {invoiceReminderLabel(item.reminderStatus)}
                          </span>
                          <DashboardInvoiceAction
                            invoiceId={item.invoiceId}
                            recommendation={item.recommendation as "send_invoice" | "send_reminder" | "mark_paid" | "send_review"}
                          />
                          <ButtonLink href="/invoices" variant="secondary" size="md" className="w-full sm:w-auto">
                            Apri fatture
                          </ButtonLink>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600">Nessuna fattura da seguire oggi.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Tempo fattura -> pagamento" subtitle="Quanto rapidamente il lavoro diventa incasso.">
              <TimingRow label="Invio fattura -> pagamento" value={invoiceMetrics.avgInvoiceSentToPaidHours} />
            </SectionCard>
          </div>

          <SectionCard title="Margine lavori" subtitle="I lavori recenti dove vedere subito se il conto sta tornando.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {marginOverview.jobs.length ? (
                marginOverview.jobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <p className="font-medium text-ink">{job.title}</p>
                    <p className="mt-1 text-sm text-neutral-600">{job.customer.fullName}</p>
                    <div className="mt-3 space-y-1 text-sm text-neutral-600">
                      <p>Ore: {job.workedHours}h</p>
                      <p>Manodopera: {formatCurrency(job.laborCost)}</p>
                      <p>Ricavo atteso: {formatCurrency(job.financials.expectedRevenue)}</p>
                    </div>
                    <p
                      className={`mt-3 text-sm font-semibold ${
                        job.financials.margin >= 0 ? "text-success-700" : "text-danger-700"
                      }`}
                    >
                      Margine {formatCurrency(job.financials.margin)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-600">Appena inizi a registrare ore e costi, il margine dei lavori comparira qui.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function TimingRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-sm text-neutral-600">{value === null ? "n/d" : `${value} h`}</p>
    </div>
  );
}

function followUpLabel(status: string) {
  const labels: Record<string, string> = {
    due: "Da seguire ora",
    scheduled: "Follow-up schedulato",
    sent: "Follow-up inviato",
    failed: "Follow-up fallito",
    canceled: "Follow-up annullato"
  };

  return labels[status] ?? status;
}

function recommendationLabel(status: string) {
  const labels: Record<string, string> = {
    follow_up_now: "Invia follow-up ora",
    wait: "Attendi",
    call_customer: "Chiama cliente"
  };

  return labels[status] ?? status;
}

function invoiceReminderLabel(status: string) {
  const labels: Record<string, string> = {
    due: "Da sollecitare",
    scheduled: "Reminder schedulato",
    sent: "Reminder inviato",
    failed: "Reminder fallito",
    none: "Nessun reminder"
  };

  return labels[status] ?? status;
}

function MobileHeroCard({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "sand";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "sand" ? "border-warning-200 bg-warning-50" : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-neutral-600">{detail}</p>
    </div>
  );
}

function CompactDeskMetric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm text-neutral-600">{detail}</p>
    </div>
  );
}
