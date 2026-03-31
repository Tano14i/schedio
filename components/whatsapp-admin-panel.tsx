"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { Drawer } from "@/components/drawer";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { formatDateTime } from "@/lib/utils";

export type WhatsAppAdminItem = {
  id: string;
  customerName: string;
  phone: string;
  status: string;
  customerId?: string | null;
  serviceType?: string;
  description?: string;
  address?: string;
  photoCount: number;
  lastMessageAt: string;
  leadId?: string | null;
  jobId?: string | null;
  qualificationStatus?: string | null;
  nextBestAction?: string | null;
  qualificationReason?: string | null;
  qualificationConfidence?: string | null;
  messages: Array<{
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    type: string;
    text?: string | null;
    storagePath?: string | null;
    createdAt: string;
  }>;
  proposal?: {
    id: string;
    status: string;
    publicToken: string;
    slotLabel?: string;
    candidateCount: number;
  } | null;
};

export type WhatsAppConnectionStatus = {
  webhookUrl: string;
  graphVersion: string;
  verifyTokenConfigured: boolean;
  accessTokenConfigured: boolean;
  phoneNumberIdConfigured: boolean;
  cloudApiReady: boolean;
};

type IntakeFormState = {
  customerName: string;
  phone: string;
  serviceType: string;
  description: string;
  address: string;
  measurements: string;
  preferredWindow: string;
  photos: string;
};

const emptyIntakeForm: IntakeFormState = {
  customerName: "",
  phone: "",
  serviceType: "",
  description: "",
  address: "",
  measurements: "",
  preferredWindow: "",
  photos: ""
};

export function WhatsAppAdminPanel({
  items,
  initialOpen,
  initialSelectedId,
  notice,
  connection
}: {
  items: WhatsAppAdminItem[];
  initialOpen?: boolean;
  initialSelectedId?: string;
  notice?: string;
  connection: WhatsAppConnectionStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? items[0]?.id ?? "");
  const [isIntakeOpen, setIsIntakeOpen] = useState(initialOpen ?? false);
  const [isCreatingIntake, setIsCreatingIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState<IntakeFormState>(emptyIntakeForm);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Ciao, questo e un messaggio di prova inviato da Schedio."
  );
  const [feedback, setFeedback] = useState("");

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId]
  );

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    setIsIntakeOpen(initialOpen ?? false);
  }, [initialOpen]);

  useEffect(() => {
    if (!items.length) {
      setSelectedId("");
      return;
    }

    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  async function runAction(input: {
    url: string;
    method?: "POST";
    body?: Record<string, unknown>;
    success: string;
  }) {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch(input.url, {
        method: input.method ?? "POST",
        headers: input.body ? { "Content-Type": "application/json" } : undefined,
        body: input.body ? JSON.stringify(input.body) : undefined
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      setFeedback(input.success);
      router.refresh();
    });
  }

  function openIntakeDrawer() {
    setFeedback("");
    setIsIntakeOpen(true);
    router.push("/whatsapp?action=intake", { scroll: false });
  }

  function closeIntakeDrawer() {
    setIsIntakeOpen(false);
    setIntakeForm(emptyIntakeForm);
    setFeedback("");
    router.push(selectedId ? `/whatsapp?thread=${selectedId}` : "/whatsapp", { scroll: false });
  }

  async function createWhatsAppIntake() {
    if (
      !intakeForm.customerName.trim() ||
      !intakeForm.phone.trim() ||
      !intakeForm.serviceType.trim() ||
      !intakeForm.description.trim()
    ) {
      setFeedback("Inserisci nome cliente, telefono, tipo di lavoro e descrizione.");
      return;
    }

    setIsCreatingIntake(true);
    setFeedback("");

    try {
      const response = await fetch("/api/whatsapp/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: intakeForm.customerName,
          phone: intakeForm.phone,
          serviceType: intakeForm.serviceType,
          description: intakeForm.description,
          address: intakeForm.address || undefined,
          measurements: intakeForm.measurements || undefined,
          preferredWindow: intakeForm.preferredWindow || undefined,
          photos: intakeForm.photos
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.item?.thread?.id) {
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      const nextThreadId = result.item.thread.id as string;
      setSelectedId(nextThreadId);
      setIntakeForm(emptyIntakeForm);
      setIsIntakeOpen(false);
      setFeedback("Richiesta WhatsApp salvata nel database.");
      router.push(`/whatsapp?thread=${nextThreadId}`, { scroll: false });
      router.refresh();
    } finally {
      setIsCreatingIntake(false);
    }
  }

  async function sendTestWhatsAppMessage() {
    if (!testPhone.trim() || !testMessage.trim()) {
      setFeedback("Inserisci numero WhatsApp e testo del messaggio di prova.");
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone.trim(),
          message: testMessage.trim()
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Invio test WhatsApp fallito.");
        return;
      }

      setFeedback(
        result?.ok
          ? "Messaggio test inviato tramite WhatsApp Cloud API."
          : result?.message ?? "Payload test generato."
      );
    });
  }

  async function sendHelloWorldTemplate() {
    if (!testPhone.trim()) {
      setFeedback("Inserisci numero WhatsApp per inviare il template di test.");
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone.trim(),
          templateName: "hello_world",
          languageCode: "en_US"
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Invio template WhatsApp fallito.");
        return;
      }

      setFeedback(
        result?.ok
          ? "Template hello_world inviato. Questo e il test migliore per la prima connessione Meta."
          : result?.message ?? "Payload template generato."
      );
    });
  }

  function renderPrimaryAction() {
    if (!selected) {
      return null;
    }

    if (!selected.leadId) {
      return (
        <Button
          disabled={isPending}
          className="w-full"
          onClick={() =>
            runAction({
              url: `/api/whatsapp/threads/${selected.id}/convert-to-lead`,
              success: "Lead creata dal thread WhatsApp."
            })
          }
        >
          Crea lead dal thread
        </Button>
      );
    }

    if (selected.qualificationStatus === "NEEDS_CLARIFICATION") {
      return (
        <Button
          disabled={isPending}
          className="w-full"
          onClick={() =>
            runAction({
              url: `/api/leads/${selected.leadId}/request-clarification`,
              success: "Messaggio di chiarimento inviato."
            })
          }
        >
          Chiedi chiarimento
        </Button>
      );
    }

    if (
      selected.qualificationStatus === "OUT_OF_AREA" ||
      selected.qualificationStatus === "LOW_PRIORITY"
    ) {
      return selected.leadId ? (
        <Link
          href="/leads"
          className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          Apri lead
        </Link>
      ) : null;
    }

    if (!selected.proposal) {
      return (
        <Button
          disabled={isPending}
          className="w-full"
          onClick={() =>
            runAction({
              url: `/api/leads/${selected.leadId}/propose-slots`,
              success: "Slot candidati generati."
            })
          }
        >
          Genera slot candidati
        </Button>
      );
    }

    const proposal = selected.proposal;

    if (proposal.status === "PENDING_HANDYMAN_APPROVAL") {
      return (
        <Button
          disabled={isPending}
          className="w-full"
          onClick={() =>
            runAction({
              url: `/api/scheduling-proposals/${proposal.id}/approve`,
              success: "Proposta approvata dal pannello."
            })
          }
        >
          Approva slot
        </Button>
      );
    }

    if (proposal.status === "APPROVED") {
      return (
        <Button
          disabled={isPending}
          className="w-full"
          onClick={() =>
            runAction({
              url: `/api/scheduling-proposals/${proposal.id}/send-to-customer`,
              success: "Proposta inviata al cliente."
            })
          }
        >
          Invia proposta al cliente
        </Button>
      );
    }

    if (proposal.status === "SENT_TO_CUSTOMER") {
      return (
        <Button
          disabled={isPending}
          className="w-full"
          onClick={() =>
            runAction({
              url: `/api/public/scheduling/${proposal.publicToken}/confirm`,
              success: "Cliente confermato, job creato."
            })
          }
        >
          Registra conferma cliente
        </Button>
      );
    }

    if (proposal.status === "CUSTOMER_CONFIRMED") {
      return (
        <Link
          href={selected.jobId ? `/jobs/${selected.jobId}` : "/calendar"}
          className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          {selected.jobId ? "Apri appuntamento" : "Apri calendario"}
        </Link>
      );
    }

    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <PageHeader
            eyebrow="WhatsApp"
            title="Da messaggio WhatsApp a sopralluogo confermato."
            description="Thread, media, lead qualificati e proposta sopralluogo nello stesso flusso operativo."
            action={{ href: "/whatsapp", label: "Aggiorna inbox" }}
          />
          <Button data-tour="whatsapp-new-request" onClick={openIntakeDrawer} className="w-full xl:w-auto">
            Nuova richiesta WhatsApp
          </Button>
        </div>

        <SectionCard title="Azioni rapide" subtitle="Da thread a sopralluogo senza perdere tempo.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button data-tour="whatsapp-new-request" className="w-full" onClick={openIntakeDrawer}>
              Nuova richiesta WhatsApp
            </Button>
            <Link
              href="/leads"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Apri richieste
            </Link>
            <Link
              href="/calendar"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Apri calendario
            </Link>
            <Link
              href="/jobs"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Apri lavori
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          title="Collega WhatsApp Cloud API"
          subtitle="Configura webhook, token e fai un invio test senza uscire da Schedio."
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatusPill
                  label="Verify token"
                  value={connection.verifyTokenConfigured ? "Configurato" : "Manca"}
                  tone={connection.verifyTokenConfigured ? "ok" : "warning"}
                />
                <StatusPill
                  label="Access token"
                  value={connection.accessTokenConfigured ? "Configurato" : "Manca"}
                  tone={connection.accessTokenConfigured ? "ok" : "warning"}
                />
                <StatusPill
                  label="Phone number ID"
                  value={connection.phoneNumberIdConfigured ? "Configurato" : "Manca"}
                  tone={connection.phoneNumberIdConfigured ? "ok" : "warning"}
                />
                <StatusPill
                  label="Cloud API"
                  value={connection.cloudApiReady ? "Pronta" : "Da completare"}
                  tone={connection.cloudApiReady ? "ok" : "warning"}
                />
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Webhook URL
                </p>
                <p className="mt-2 break-all rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-ink">
                  {connection.webhookUrl}
                </p>
                <p className="mt-3 text-sm text-neutral-600">
                  In Meta usa questo URL per la verifica webhook. Graph version attiva:{" "}
                  {connection.graphVersion}.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-sm font-medium text-ink">Checklist rapida</p>
                <ol className="mt-3 space-y-2 text-sm text-neutral-600">
                  <li>1. In Meta crea o apri una WhatsApp Business app.</li>
                  <li>2. Inserisci questo webhook e lo stesso verify token salvato in Vercel.</li>
                  <li>3. Copia access token e phone number ID nelle env di Schedio.</li>
                  <li>4. Fai un invio test qui sotto.</li>
                </ol>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-medium text-ink">Invio test</p>
              <p className="mt-1 text-sm text-neutral-600">
                Prova il collegamento reale della Cloud API con un messaggio WhatsApp semplice.
              </p>

              <div className="mt-4 space-y-4">
                <Field
                  label="Numero WhatsApp"
                  placeholder="Es. 393331111001"
                  value={testPhone}
                  onChange={setTestPhone}
                />
                <Field
                  label="Messaggio test"
                  placeholder="Scrivi un messaggio breve"
                  multiline
                  value={testMessage}
                  onChange={setTestMessage}
                />
                <Button
                  disabled={isPending || !connection.cloudApiReady}
                  className="w-full"
                  onClick={sendTestWhatsAppMessage}
                >
                  Invia messaggio test
                </Button>
                <Button
                  variant="secondary"
                  disabled={isPending || !connection.cloudApiReady}
                  className="w-full"
                  onClick={sendHelloWorldTemplate}
                >
                  Invia template hello_world
                </Button>
                {!connection.cloudApiReady ? (
                  <p className="text-sm text-warning-900">
                    Completa access token e phone number ID per attivare l’invio reale.
                  </p>
                ) : (
                  <p className="text-sm text-neutral-600">
                    Per il primo test Meta usa prima <span className="font-medium">hello_world</span>.
                    Il testo libero funziona meglio dentro la finestra 24h.
                  </p>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {notice ? (
          <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
            {notice}
          </div>
        ) : null}

        {feedback ? (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          {selected ? (
            <div className="order-1 space-y-6 xl:order-2">
              <SectionCard
                title={selected.customerName}
                subtitle={`${selected.phone} - ${selected.serviceType ?? "Richiesta WhatsApp"}`}
              >
                <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Dettagli raccolti
                    </p>
                    <p className="mt-3 text-sm text-neutral-700">
                      {selected.description ?? "Nessuna descrizione disponibile."}
                    </p>
                    <p className="mt-3 text-sm text-neutral-600">
                      {selected.address ?? "Indirizzo da confermare"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <InfoChip label={threadStatusLabel(selected.status)} />
                      <InfoChip label={`${selected.photoCount} foto`} />
                      <InfoChip label={selected.leadId ? "Lead collegata" : "Lead non creata"} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Azione principale
                    </p>
                    <p className="mt-3 text-base font-semibold text-ink">{primaryLabel(selected)}</p>
                    <p className="mt-2 text-sm text-neutral-600">
                      Lead: {selected.leadId ? "collegata" : "non ancora creata"}.
                    </p>

                    {selected.leadId ? (
                      <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          Qualifica
                        </p>
                        <p className="mt-2 text-sm font-medium text-ink">
                          {qualificationLabel(selected.qualificationStatus)}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Next best action: {actionLabel(selected.nextBestAction)}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Reason code: {selected.qualificationReason ?? "non ancora assegnato"}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          Confidenza: {selected.qualificationConfidence?.toLowerCase() ?? "n/d"}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-col gap-3">
                      {renderPrimaryAction()}

                      <div className="grid gap-2 sm:grid-cols-2">
                        {selected.leadId ? (
                          <Link
                            href="/leads"
                            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                          >
                            Apri richieste
                          </Link>
                        ) : null}
                        {selected.customerId ? (
                          <Link
                            href={`/customers/${selected.customerId}`}
                            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                          >
                            Apri cliente
                          </Link>
                        ) : null}
                        {selected.jobId ? (
                          <Link
                            href={`/jobs/${selected.jobId}`}
                            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 sm:col-span-2"
                          >
                            Apri appuntamento
                          </Link>
                        ) : null}
                      </div>

                      {selected.leadId ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            variant="secondary"
                            disabled={isPending}
                            onClick={() =>
                              runAction({
                                url: `/api/leads/${selected.leadId}/qualify`,
                                success: "Lead qualificata."
                              })
                            }
                          >
                            Rivaluta lead
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={isPending}
                            onClick={() =>
                              runAction({
                                url: `/api/leads/${selected.leadId}/mark-out-of-area`,
                                success: "Lead segnata fuori area."
                              })
                            }
                          >
                            Segna fuori area
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={isPending}
                            onClick={() =>
                              runAction({
                                url: `/api/leads/${selected.leadId}/mark-low-priority`,
                                success: "Lead segnata a bassa priorita."
                              })
                            }
                          >
                            Segna bassa priorita
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={isPending}
                            onClick={() =>
                              runAction({
                                url: `/api/leads/${selected.leadId}/override-qualification`,
                                body: {
                                  qualificationStatus: "QUALIFIED",
                                  nextBestAction: "PROPOSE_VISIT",
                                  qualificationReason: "manual_override"
                                },
                                success: "Override manuale applicato."
                              })
                            }
                          >
                            Forza qualificato
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <SectionCard
                  title="Messaggi e media"
                  subtitle="Testo, immagini e messaggi inviati nello stesso thread."
                >
                  <div className="space-y-3">
                    {selected.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
                          message.direction === "OUTBOUND"
                            ? "ml-auto bg-primary-500 text-white"
                            : "border border-neutral-200 bg-white text-neutral-800"
                        }`}
                      >
                        <p>{message.text ?? message.storagePath ?? message.type}</p>
                        <p
                          className={`mt-2 text-xs ${
                            message.direction === "OUTBOUND"
                              ? "text-primary-100"
                              : "text-neutral-500"
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Scheduling proposal"
                  subtitle="Slot candidati, approvazione e conferma cliente."
                >
                  {selected.proposal ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <p className="text-sm font-medium text-ink">
                          {proposalStatusLabel(selected.proposal.status)}
                        </p>
                        <p className="mt-2 text-sm text-neutral-600">
                          Slot candidati: {selected.proposal.candidateCount}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {selected.proposal.slotLabel ?? "Nessuno slot selezionato"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="Nessuna proposta ancora"
                      description="Genera 1-3 slot e approvali dal pannello in pochi secondi."
                    />
                  )}
                </SectionCard>
              </div>
            </div>
          ) : null}

          <SectionCard
            title="Thread attivi"
            subtitle="Ogni inbound crea o aggiorna sempre un thread."
            aside={
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {items.length} thread
              </span>
            }
            className="order-2 xl:order-1"
          >
            {items.length ? (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 xl:mx-0 xl:block xl:space-y-3 xl:overflow-visible xl:px-0">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-[280px] shrink-0 rounded-2xl border p-4 text-left transition xl:w-full ${
                      selected?.id === item.id
                        ? "border-primary-300 bg-primary-50"
                        : "border-neutral-200 bg-white hover:border-primary-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{item.customerName}</p>
                        <p className="text-sm text-neutral-500">{item.phone}</p>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                        {item.photoCount} foto
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink">
                      {item.serviceType ?? "Servizio da definire"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-neutral-500">
                      {threadStatusLabel(item.status)}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {formatDateTime(item.lastMessageAt)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nessun thread WhatsApp"
                description="Crea una richiesta WhatsApp dal pannello oppure collega il webhook Meta per vedere i thread qui."
                action={
                  <button
                    type="button"
                    onClick={openIntakeDrawer}
                    className="inline-flex rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white"
                  >
                    Nuova richiesta WhatsApp
                  </button>
                }
              />
            )}
          </SectionCard>
        </div>
      </div>

      {isIntakeOpen ? (
        <Drawer
          title="Nuova richiesta WhatsApp"
          description="Simula un intake reale su WhatsApp e crea thread, messaggi, contatto e lead nel database."
          closeHref={selectedId ? `/whatsapp?thread=${selectedId}` : "/whatsapp"}
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              createWhatsAppIntake();
            }}
          >
            <Field
              label="Nome cliente"
              placeholder="Es. Mario Rossi"
              value={intakeForm.customerName}
              onChange={(value) =>
                setIntakeForm((current) => ({ ...current, customerName: value }))
              }
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Telefono"
                placeholder="Es. +39 333 111 1001"
                value={intakeForm.phone}
                onChange={(value) => setIntakeForm((current) => ({ ...current, phone: value }))}
              />
              <Field
                label="Tipo di lavoro"
                placeholder="Es. Riparazione tapparella"
                value={intakeForm.serviceType}
                onChange={(value) =>
                  setIntakeForm((current) => ({ ...current, serviceType: value }))
                }
              />
            </div>
            <Field
              label="Descrizione"
              placeholder="Descrivi il problema come farebbe il cliente su WhatsApp"
              multiline
              value={intakeForm.description}
              onChange={(value) =>
                setIntakeForm((current) => ({ ...current, description: value }))
              }
            />
            <Field
              label="Indirizzo"
              placeholder="Es. Via Roma 25, Milano"
              value={intakeForm.address}
              onChange={(value) => setIntakeForm((current) => ({ ...current, address: value }))}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Misure"
                placeholder="Es. Finestra 120x140 cm"
                value={intakeForm.measurements}
                onChange={(value) =>
                  setIntakeForm((current) => ({ ...current, measurements: value }))
                }
              />
              <Field
                label="Finestra preferita"
                placeholder="Es. Domani pomeriggio"
                value={intakeForm.preferredWindow}
                onChange={(value) =>
                  setIntakeForm((current) => ({ ...current, preferredWindow: value }))
                }
              />
            </div>
            <Field
              label="Foto"
              placeholder="Una riga per ogni foto o path simulato"
              multiline
              value={intakeForm.photos}
              onChange={(value) => setIntakeForm((current) => ({ ...current, photos: value }))}
            />

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-ink">Cosa succede dopo</p>
              <p className="mt-1 text-sm text-neutral-600">
                Schedio crea il thread WhatsApp, salva messaggi e foto, collega il cliente e
                prepara il lead da qualificare.
              </p>
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                {feedback}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" className="sm:order-2">
                {isCreatingIntake ? "Salvataggio..." : "Crea thread WhatsApp"}
              </Button>
              <button
                type="button"
                onClick={closeIntakeDrawer}
                className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:order-1"
              >
                Annulla
              </button>
            </div>
          </form>
        </Drawer>
      ) : null}
    </>
  );
}

function primaryLabel(item: WhatsAppAdminItem) {
  if (!item.leadId) {
    return "Converti il thread in lead";
  }
  if (!item.qualificationStatus || item.qualificationStatus === "UNQUALIFIED") {
    return "Valuta se il lead merita un sopralluogo";
  }
  if (!item.proposal) {
    return "Genera gli slot candidati";
  }
  if (item.proposal.status === "PENDING_HANDYMAN_APPROVAL") {
    return "Approva uno slot dal pannello";
  }
  if (item.proposal.status === "APPROVED") {
    return "Invia la proposta al cliente";
  }
  if (item.proposal.status === "SENT_TO_CUSTOMER") {
    return "Attendi o registra la conferma cliente";
  }
  return "Sopralluogo confermato";
}

function qualificationLabel(status?: string | null) {
  const labels: Record<string, string> = {
    UNQUALIFIED: "Non qualificato",
    QUALIFIED: "Qualificato",
    NEEDS_CLARIFICATION: "Serve chiarimento",
    OUT_OF_AREA: "Fuori area",
    LOW_PRIORITY: "Bassa priorita",
    REJECTED: "Scartato"
  };

  return status ? labels[status] ?? status : "Da valutare";
}

function actionLabel(action?: string | null) {
  const labels: Record<string, string> = {
    PROPOSE_VISIT: "Proponi sopralluogo",
    ASK_CLARIFICATION: "Chiedi chiarimento",
    REJECT: "Scarta",
    DEFER: "Rimanda"
  };

  return action ? labels[action] ?? action : "Da decidere";
}

function threadStatusLabel(status: string) {
  const labels: Record<string, string> = {
    OPEN: "Aperto",
    WAITING_PHOTOS: "In attesa foto",
    WAITING_INTERNAL_APPROVAL: "In attesa approvazione",
    WAITING_CUSTOMER_CONFIRMATION: "In attesa cliente",
    CLOSED: "Chiuso"
  };

  return labels[status] ?? status;
}

function proposalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Bozza",
    PENDING_HANDYMAN_APPROVAL: "Da approvare",
    APPROVED: "Approvata",
    SENT_TO_CUSTOMER: "Inviata al cliente",
    CUSTOMER_CONFIRMED: "Confermata dal cliente",
    EXPIRED: "Scaduta",
    REJECTED: "Rifiutata"
  };

  return labels[status] ?? status;
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-soft">
      {label}
    </span>
  );
}

function StatusPill({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "ok" | "warning";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === "ok" ? "border-success-200 bg-success-50" : "border-warning-200 bg-warning-50"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function Field({
  label,
  placeholder,
  multiline,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  multiline?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300"
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300"
        />
      )}
    </label>
  );
}
