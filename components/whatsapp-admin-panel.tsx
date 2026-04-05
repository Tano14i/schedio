"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { Drawer } from "@/components/drawer";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import type { WhatsAppConnectionStatus } from "@/lib/whatsapp-config";
import type { AiIntakeSuggestion } from "@/lib/types";
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

type IntakeFormState = {
  customerName: string;
  phone: string;
  rawIntake: string;
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
  rawIntake: "",
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
  const [isAnalyzingIntake, setIsAnalyzingIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState<IntakeFormState>(emptyIntakeForm);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AiIntakeSuggestion | null>(null);
  const [intakeSuggestion, setIntakeSuggestion] = useState<AiIntakeSuggestion | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId]
  );

  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  useEffect(() => {
    setIsIntakeOpen(initialOpen ?? false);
  }, [initialOpen]);

  useEffect(() => {
    if (!items.length) {
      setSelectedId("");
      return;
    }
    if (!items.some((item) => item.id === selectedId)) setSelectedId(items[0].id);
  }, [items, selectedId]);

  useEffect(() => {
    if (!selected?.id) {
      setSelectedSuggestion(null);
      return;
    }
    let canceled = false;
    setIsSuggestionLoading(true);
    fetch(`/api/whatsapp/threads/${selected.id}/ai-intake`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message ?? "Analisi non disponibile.");
        if (!canceled) setSelectedSuggestion((result?.item as AiIntakeSuggestion) ?? null);
      })
      .catch(() => {
        if (!canceled) setSelectedSuggestion(null);
      })
      .finally(() => {
        if (!canceled) setIsSuggestionLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [selected?.id]);

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
    setIntakeSuggestion(null);
    setIsIntakeOpen(true);
    router.push("/whatsapp?action=intake", { scroll: false });
  }

  function closeIntakeDrawer() {
    setIsIntakeOpen(false);
    setIntakeForm(emptyIntakeForm);
    setIntakeSuggestion(null);
    setFeedback("");
    router.push(selectedId ? `/whatsapp?thread=${selectedId}` : "/whatsapp", { scroll: false });
  }

  async function analyzeDraftIntake() {
    if (!intakeForm.rawIntake.trim()) {
      setFeedback("Incolla prima il messaggio WhatsApp o la trascrizione vocale.");
      return;
    }
    setIsAnalyzingIntake(true);
    setFeedback("");
    try {
      const response = await fetch("/api/ai/intake/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: intakeForm.rawIntake,
          customerName: intakeForm.customerName || undefined,
          phone: intakeForm.phone || undefined
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.item) {
        setFeedback(result?.message ?? "Analisi non riuscita, riprova.");
        return;
      }
      const suggestion = result.item as AiIntakeSuggestion;
      setIntakeSuggestion(suggestion);
      setIntakeForm((current) => ({
        ...current,
        customerName: current.customerName || suggestion.customerName || "",
        serviceType: suggestion.serviceType || current.serviceType,
        description: current.description || suggestion.summary,
        address: current.address || suggestion.address || "",
        preferredWindow: current.preferredWindow || suggestion.preferredWindow || "",
        measurements: current.measurements || suggestion.measurements || ""
      }));
      setFeedback("Testo analizzato. Controlla i campi e crea il thread.");
    } finally {
      setIsAnalyzingIntake(false);
    }
  }

  async function createWhatsAppIntake() {
    if (!intakeForm.customerName.trim() || !intakeForm.phone.trim() || !intakeForm.serviceType.trim() || !intakeForm.description.trim()) {
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
          rawIntake: intakeForm.rawIntake || undefined,
          serviceType: intakeForm.serviceType,
          description: intakeForm.description,
          address: intakeForm.address || undefined,
          measurements: intakeForm.measurements || undefined,
          preferredWindow: intakeForm.preferredWindow || undefined,
          photos: intakeForm.photos.split("\n").map((item) => item.trim()).filter(Boolean)
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
      setIntakeSuggestion(null);
      setIsIntakeOpen(false);
      setFeedback("Richiesta WhatsApp salvata nel database.");
      router.push(`/whatsapp?thread=${nextThreadId}`, { scroll: false });
      router.refresh();
    } finally {
      setIsCreatingIntake(false);
    }
  }

  const closeHref = selectedId ? `/whatsapp?thread=${selectedId}` : "/whatsapp";

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <PageHeader eyebrow="WhatsApp" title="Da messaggio WhatsApp a sopralluogo confermato." description="Apri un thread, capisci il problema e porta avanti la prossima decisione senza uscire dalla stessa pagina." action={{ href: "/whatsapp", label: "Aggiorna inbox" }} />
          <Button data-tour="whatsapp-new-request" onClick={openIntakeDrawer} className="w-full xl:w-auto">Nuova richiesta WhatsApp</Button>
        </div>

        <SectionCard title="Azioni rapide" subtitle="Apri il flusso giusto senza perdere contesto.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Button data-tour="whatsapp-new-request" className="w-full" onClick={openIntakeDrawer}>Nuova richiesta WhatsApp</Button>
            <ActionGhostLink href="/leads" label="Apri richieste" />
            <ActionGhostLink href="/calendar" label="Apri calendario" />
            <ActionGhostLink href="/jobs" label="Apri lavori" />
          </div>
        </SectionCard>

        <SectionCard title="Stato integrazione WhatsApp" subtitle="Qui basta capire se il canale e attivo e dove finire il setup.">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusPill label="Canale" value={connection.cloudApiReady ? "Attivo" : "Da collegare"} tone={connection.cloudApiReady ? "ok" : "warning"} />
              <StatusPill label="Webhook" value={connection.verifyTokenConfigured ? "Verificato" : "Da configurare"} tone={connection.verifyTokenConfigured ? "ok" : "warning"} />
              <StatusPill label="Invio messaggi" value={connection.cloudApiReady ? "Disponibile" : "Non attivo"} tone={connection.cloudApiReady ? "ok" : "warning"} />
            </div>
            <div className="flex flex-col gap-3 lg:w-[260px]">
              <Link href="/settings/company#whatsapp" className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-600">Apri configurazione WhatsApp</Link>
              <p className="text-sm text-neutral-600">Token, webhook e invio test stanno in Impostazioni azienda.</p>
            </div>
          </div>
        </SectionCard>

        {notice ? <Notice tone="warning">{notice}</Notice> : null}
        {feedback ? <Notice tone="accent">{feedback}</Notice> : null}

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <SectionCard title="Thread attivi" subtitle="Scegli una conversazione e lavora una decisione alla volta." aside={<span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">{items.length} thread</span>} className="xl:h-fit">
            {items.length ? (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 xl:mx-0 xl:block xl:space-y-3 xl:overflow-visible xl:px-0">
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-[286px] shrink-0 rounded-2xl border p-4 text-left transition xl:w-full ${selected?.id === item.id ? "border-primary-300 bg-primary-50 shadow-soft" : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-slate-50/80"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{item.customerName}</p>
                        <p className="text-sm text-neutral-500">{item.phone}</p>
                      </div>
                      <InfoChip label={`${item.photoCount} foto`} tone="neutral" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-5 text-ink">{item.serviceType ?? "Servizio da definire"}</p>
                    {item.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">{item.description}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <InfoChip label={friendlyThreadStatus(item.status)} />
                      <InfoChip label={formatDateTime(item.lastMessageAt)} tone="neutral" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="Nessun thread WhatsApp" description="Crea una richiesta WhatsApp dal pannello oppure collega il webhook Meta per vedere i thread qui." action={<button type="button" onClick={openIntakeDrawer} className="inline-flex rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white">Nuova richiesta WhatsApp</button>} />
            )}
          </SectionCard>

          {selected ? <SelectedThreadWorkspace selected={selected} selectedSuggestion={selectedSuggestion} isSuggestionLoading={isSuggestionLoading} isPending={isPending} runAction={runAction} /> : <EmptyState title="Seleziona un thread" description="Quando scegli una conversazione, qui vedi chat, prossima azione e proposta sopralluogo nello stesso spazio." />}
        </div>
      </div>

      {isIntakeOpen ? (
        <Drawer title="Nuova richiesta WhatsApp" description="Incolla il messaggio del cliente oppure una trascrizione vocale e crea subito il thread." closeHref={closeHref}>
          <div className="space-y-6">
            <Field label="Testo da analizzare">
              <textarea rows={6} value={intakeForm.rawIntake} onChange={(event) => setIntakeForm((current) => ({ ...current, rawIntake: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300" placeholder="Es. Ciao, tapparella bloccata in via Verdi 12. Puoi passare domani mattina?" />
            </Field>
            <Button variant="secondary" className="w-full" disabled={isAnalyzingIntake} onClick={analyzeDraftIntake}>{isAnalyzingIntake ? "Analisi in corso..." : "Analizza con AI"}</Button>
            {intakeSuggestion ? <div className="rounded-3xl border border-primary-200 bg-primary-50 p-5"><p className="text-base font-semibold text-ink">Scheda suggerita</p><p className="mt-2 text-sm text-neutral-700">{intakeSuggestion.summary}</p></div> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome cliente"><input value={intakeForm.customerName} onChange={(event) => setIntakeForm((current) => ({ ...current, customerName: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300" placeholder="Mario Rossi" /></Field>
              <Field label="Telefono WhatsApp"><input value={intakeForm.phone} onChange={(event) => setIntakeForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300" placeholder="393331111001" /></Field>
              <Field label="Tipo lavoro"><input value={intakeForm.serviceType} onChange={(event) => setIntakeForm((current) => ({ ...current, serviceType: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300" placeholder="Riparazione tapparella" /></Field>
              <Field label="Indirizzo"><input value={intakeForm.address} onChange={(event) => setIntakeForm((current) => ({ ...current, address: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300" placeholder="Via Verdi 12, Milano" /></Field>
            </div>
            <Field label="Descrizione"><textarea rows={5} value={intakeForm.description} onChange={(event) => setIntakeForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-300" placeholder="Riassunto del problema cliente" /></Field>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href={closeHref} className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50">Annulla</Link>
              <Button disabled={isCreatingIntake} onClick={createWhatsAppIntake}>{isCreatingIntake ? "Salvataggio..." : "Crea thread WhatsApp"}</Button>
            </div>
          </div>
        </Drawer>
      ) : null}
    </>
  );
}

function SelectedThreadWorkspace({
  selected,
  selectedSuggestion,
  isSuggestionLoading,
  isPending,
  runAction
}: {
  selected: WhatsAppAdminItem;
  selectedSuggestion: AiIntakeSuggestion | null;
  isSuggestionLoading: boolean;
  isPending: boolean;
  runAction: (input: {
    url: string;
    method?: "POST";
    body?: Record<string, unknown>;
    success: string;
  }) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard title={selected.customerName} subtitle={`${selected.phone} - ${selected.serviceType ?? "Richiesta WhatsApp"}`}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <InfoChip label={friendlyThreadStatus(selected.status)} />
              <InfoChip label={`${selected.photoCount} foto`} tone="neutral" />
              <InfoChip label={selected.leadId ? "Lead gia creata" : "Da trasformare in lead"} tone={selected.leadId ? "accent" : "warning"} />
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-slate-50/75 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Contesto cliente</p>
              <p className="mt-3 text-sm leading-7 text-neutral-700">{selected.description ?? "Nessuna descrizione disponibile. Apri il thread e chiedi piu contesto."}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <KeyFact label="Indirizzo" value={selected.address ?? "Da confermare"} />
                <KeyFact label="Stato lead" value={friendlyQualification(selected.qualificationStatus)} />
                <KeyFact label="Prossimo passo" value={friendlyNextStep(selected)} />
              </div>
            </div>
          </div>
          <DecisionPanel selected={selected} />
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <SectionCard title="Conversazione WhatsApp" subtitle="Leggi gli ultimi messaggi veri e decidi senza uscire dal thread.">
          {selected.messages.length ? (
            <div className="space-y-3">
              {selected.messages.map((message) => (
                <div key={message.id} className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-soft ${message.direction === "OUTBOUND" ? "ml-auto bg-primary-500 text-white" : "border border-slate-200 bg-white text-neutral-800"}`}>
                  <p>{message.text ?? message.storagePath ?? message.type}</p>
                  <p className={`mt-2 text-xs ${message.direction === "OUTBOUND" ? "text-primary-100" : "text-neutral-500"}`}>{formatDateTime(message.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">Nessun messaggio disponibile in questo thread.</p>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Scheda lavoro suggerita" subtitle="Urgenza, sopralluogo e dati chiave letti dal thread.">
            {isSuggestionLoading ? (
              <p className="text-sm text-neutral-600">Analisi in corso del thread WhatsApp...</p>
            ) : selectedSuggestion ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                  <p className="text-sm font-semibold text-ink">{selectedSuggestion.serviceType}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{selectedSuggestion.summary}</p>
                </div>
                <div className="grid gap-3">
                  <KeyFact label="Urgenza" value={friendlyUrgency(selectedSuggestion.urgency)} />
                  <KeyFact label="Sopralluogo" value={selectedSuggestion.visitNeeded ? "Consigliato" : "Intervento diretto possibile"} />
                  <KeyFact label="Prossimo passo" value={friendlyAiNextAction(selectedSuggestion.nextAction)} />
                  <KeyFact label="Indirizzo" value={selectedSuggestion.address ?? "Da confermare"} />
                  <KeyFact label="Finestra" value={selectedSuggestion.preferredWindow ?? "Non indicata"} />
                  <KeyFact label="Affidabilita" value={`${friendlyConfidence(selectedSuggestion.confidence)} - ${friendlyAiSource(selectedSuggestion.source)}`} />
                </div>
                {selectedSuggestion.materialsMentioned.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedSuggestion.materialsMentioned.map((material) => <InfoChip key={material} label={material} tone="neutral" />)}
                  </div>
                ) : null}
                {selectedSuggestion.missingFields.length ? (
                  <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
                    Mancano ancora: {selectedSuggestion.missingFields.map(friendlyMissingField).join(", ")}.
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-neutral-600">Nessuna analisi disponibile. Apri un thread con testo o trascrizione vocale per vedere la scheda suggerita.</p>
            )}
          </SectionCard>

          <SectionCard title="Proposta sopralluogo" subtitle="Stato slot, approvazione e conferma cliente.">
            {selected.proposal ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-ink">{proposalStatusLabel(selected.proposal.status)}</p>
                <p className="mt-2 text-sm text-neutral-600">Slot candidati: {selected.proposal.candidateCount}</p>
                <p className="mt-1 text-sm text-neutral-600">{selected.proposal.slotLabel ?? "Nessuno slot selezionato"}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-600">Nessuna proposta ancora. Quando il lead e pronto, genera 1-3 slot e mandali al cliente.</p>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Altre azioni" subtitle="Intervieni manualmente solo se devi cambiare la direzione del lead.">
        {selected.leadId ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="secondary" disabled={isPending} onClick={() => runAction({ url: `/api/leads/${selected.leadId}/qualify`, success: "Lead qualificata." })}>Rivaluta lead</Button>
            <Button variant="secondary" disabled={isPending} onClick={() => runAction({ url: `/api/leads/${selected.leadId}/mark-out-of-area`, success: "Lead segnata fuori area." })}>Segna fuori area</Button>
            <Button variant="secondary" disabled={isPending} onClick={() => runAction({ url: `/api/leads/${selected.leadId}/mark-low-priority`, success: "Lead segnata a bassa priorita." })}>Segna bassa priorita</Button>
            <Button variant="secondary" disabled={isPending} onClick={() => runAction({ url: `/api/leads/${selected.leadId}/override-qualification`, body: { qualificationStatus: "QUALIFIED", nextBestAction: "PROPOSE_VISIT", qualificationReason: "manual_override" }, success: "Override manuale applicato." })}>Forza qualificato</Button>
          </div>
        ) : (
          <p className="text-sm text-neutral-600">Prima crea il lead dal thread, poi qui compariranno le azioni manuali.</p>
        )}
      </SectionCard>
    </div>
  );
}

function DecisionPanel({ selected }: { selected: WhatsAppAdminItem }) {
  return (
    <div className="rounded-[30px] border border-primary-200 bg-[linear-gradient(180deg,#f0f7ff_0%,#ffffff_100%)] p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Cosa fare adesso</p>
      <p className="mt-3 text-lg font-semibold leading-7 text-ink">{primaryLabel(selected)}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{primaryDescription(selected)}</p>
      <div className="mt-5 space-y-3">
        <PrimaryAction selected={selected} />
        <div className="grid gap-2 sm:grid-cols-2">
          {selected.customerId ? <ActionGhostLink href={`/customers/${selected.customerId}`} label="Apri cliente" /> : null}
          {selected.leadId ? <ActionGhostLink href="/leads" label="Apri richiesta" /> : null}
          {selected.jobId ? <ActionGhostLink href={`/jobs/${selected.jobId}`} label="Apri appuntamento" /> : null}
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Stato decisione</p>
        <div className="mt-3 space-y-2 text-sm">
          <SummaryRow label="Lead" value={friendlyQualification(selected.qualificationStatus)} />
          <SummaryRow label="Perche" value={friendlyReason(selected.qualificationReason)} />
          <SummaryRow label="Sicurezza" value={friendlyConfidence(selected.qualificationConfidence)} />
        </div>
      </div>
    </div>
  );
}

function PrimaryAction({ selected }: { selected: WhatsAppAdminItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(url: string, success: string, body?: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      router.refresh();
    });
  }

  if (!selected.leadId) return <Button disabled={isPending} className="w-full" onClick={() => run(`/api/whatsapp/threads/${selected.id}/convert-to-lead`, "Lead creata.")}>Crea lead dal thread</Button>;
  if (selected.qualificationStatus === "NEEDS_CLARIFICATION") return <Button disabled={isPending} className="w-full" onClick={() => run(`/api/leads/${selected.leadId}/request-clarification`, "Messaggio inviato.")}>Chiedi chiarimento</Button>;
  if (selected.qualificationStatus === "OUT_OF_AREA" || selected.qualificationStatus === "LOW_PRIORITY") return <ActionGhostLink href="/leads" label="Apri lead" />;
  if (!selected.proposal) return <Button disabled={isPending} className="w-full" onClick={() => run(`/api/leads/${selected.leadId}/propose-slots`, "Slot generati.")}>Genera slot candidati</Button>;
  if (selected.proposal.status === "PENDING_HANDYMAN_APPROVAL") return <Button disabled={isPending} className="w-full" onClick={() => run(`/api/scheduling-proposals/${selected.proposal?.id}/approve`, "Proposta approvata.")}>Approva slot</Button>;
  if (selected.proposal.status === "APPROVED") return <Button disabled={isPending} className="w-full" onClick={() => run(`/api/scheduling-proposals/${selected.proposal?.id}/send-to-customer`, "Proposta inviata.")}>Invia proposta al cliente</Button>;
  if (selected.proposal.status === "SENT_TO_CUSTOMER") return <Button disabled={isPending} className="w-full" onClick={() => run(`/api/public/scheduling/${selected.proposal?.publicToken}/confirm`, "Cliente confermato.")}>Registra conferma cliente</Button>;
  return <ActionGhostLink href={selected.jobId ? `/jobs/${selected.jobId}` : "/calendar"} label={selected.jobId ? "Apri appuntamento" : "Apri calendario"} />;
}

function ActionGhostLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:bg-slate-50">{label}</Link>;
}

function Notice({ children, tone }: { children: ReactNode; tone: "warning" | "accent" }) {
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${tone === "warning" ? "border-warning-200 bg-warning-50 text-warning-900" : "border-primary-200 bg-primary-50 text-primary-700"}`}>{children}</div>;
}

function KeyFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/80 bg-white/85 p-3 shadow-[0_6px_18px_rgba(19,42,56,0.05)]"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p><p className="mt-1 text-sm font-medium leading-6 text-ink">{value}</p></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-neutral-500">{label}</span><span className="max-w-[60%] text-right font-medium text-ink">{value}</span></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-ink">{label}</span>{children}</label>;
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: "ok" | "warning" }) {
  return <div className={`rounded-2xl border px-4 py-3 ${tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-warning-200 bg-warning-50 text-warning-900"}`}><p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function InfoChip({ label, tone = "accent" }: { label: string; tone?: "accent" | "neutral" | "warning" }) {
  const toneClass = tone === "accent" ? "bg-primary-50 text-primary-700 border-primary-200" : tone === "warning" ? "bg-warning-50 text-warning-900 border-warning-200" : "bg-white text-neutral-600 border-slate-200";
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass}`}>{label}</span>;
}

function primaryLabel(item: WhatsAppAdminItem) {
  if (!item.leadId) return "Trasforma il thread in una lead.";
  if (item.qualificationStatus === "NEEDS_CLARIFICATION") return "Chiedi il dettaglio che manca al cliente.";
  if (item.qualificationStatus === "OUT_OF_AREA") return "Il cliente e fuori area.";
  if (item.qualificationStatus === "LOW_PRIORITY") return "Il lead resta in coda finche non cambia urgenza.";
  if (!item.proposal) return "Proponi 1-3 slot di sopralluogo.";
  if (item.proposal.status === "PENDING_HANDYMAN_APPROVAL") return "Controlla e approva gli slot suggeriti.";
  if (item.proposal.status === "APPROVED") return "Invia la proposta al cliente.";
  if (item.proposal.status === "SENT_TO_CUSTOMER") return "Attendi o registra la conferma cliente.";
  return "Apri l appuntamento e prepara il sopralluogo.";
}

function primaryDescription(item: WhatsAppAdminItem) {
  if (!item.leadId) return "Crea prima la lead cosi il thread entra nel flusso richieste e puoi continuare senza perderlo.";
  if (item.qualificationStatus === "NEEDS_CLARIFICATION") return "Prima di proporre il sopralluogo conviene recuperare la sola informazione che manca.";
  if (item.qualificationStatus === "OUT_OF_AREA") return "Meglio fermarlo qui invece di consumare tempo su una richiesta che non puoi servire.";
  if (item.qualificationStatus === "LOW_PRIORITY") return "Non e urgente: tienilo visibile ma senza bloccare l agenda dei lavori piu vicini alla chiusura.";
  if (!item.proposal) return "Il lead sembra pronto: genera subito qualche slot cosi passi dalla chat all agenda.";
  if (item.proposal.status === "PENDING_HANDYMAN_APPROVAL") return "Gli slot sono pronti ma aspettano una conferma interna prima di uscire al cliente.";
  if (item.proposal.status === "APPROVED") return "Ora il passo utile e inviare la proposta e aspettare la risposta del cliente.";
  if (item.proposal.status === "SENT_TO_CUSTOMER") return "Il cliente ha gia la proposta: da qui conviene solo registrare la conferma o fare follow-up.";
  return "L appuntamento e confermato. Aprilo e porta avanti il sopralluogo senza tornare alla chat.";
}

function friendlyThreadStatus(status?: string | null) {
  switch (status) {
    case "NEW_REQUEST":
      return "Nuova richiesta";
    case "AWAITING_PHOTOS":
      return "In attesa foto";
    case "INTAKE_READY":
      return "Pronto per lead";
    case "AWAITING_INTERNAL_APPROVAL":
      return "Da approvare";
    case "AWAITING_CUSTOMER_CONFIRMATION":
      return "Attesa cliente";
    case "VISIT_CONFIRMED":
      return "Sopralluogo confermato";
    default:
      return "Thread attivo";
  }
}

function friendlyQualification(status?: string | null) {
  switch (status) {
    case "QUALIFIED":
      return "Qualificata";
    case "NEEDS_CLARIFICATION":
      return "Serve chiarimento";
    case "OUT_OF_AREA":
      return "Fuori area";
    case "LOW_PRIORITY":
      return "Bassa priorita";
    case "REJECTED":
      return "Rifiutata";
    default:
      return "Da valutare";
  }
}

function friendlyReason(reason?: string | null) {
  if (!reason) return "Nessun blocco rilevato";
  if (reason === "missing_photos") return "Mancano foto del problema";
  if (reason === "manual_override") return "Decisione forzata manualmente";
  if (reason === "outside_service_area") return "Indirizzo fuori zona";
  return reason.replaceAll("_", " ");
}

function friendlyConfidence(confidence?: string | null) {
  switch ((confidence ?? "").toUpperCase()) {
    case "HIGH":
      return "Alta";
    case "LOW":
      return "Bassa";
    default:
      return "Media";
  }
}

function friendlyNextStep(item: WhatsAppAdminItem) {
  if (!item.leadId) return "Crea lead";
  if (item.proposal?.status === "CUSTOMER_CONFIRMED") return "Apri appuntamento";
  if (item.proposal?.status === "SENT_TO_CUSTOMER") return "Aspetta conferma cliente";
  if (item.proposal?.status === "APPROVED") return "Invia proposta";
  if (item.proposal?.status === "PENDING_HANDYMAN_APPROVAL") return "Approva slot";
  if (item.qualificationStatus === "NEEDS_CLARIFICATION") return "Chiedi chiarimento";
  if (item.qualificationStatus === "OUT_OF_AREA" || item.qualificationStatus === "LOW_PRIORITY") return "Nessuna azione urgente";
  return "Proponi sopralluogo";
}

function friendlyAiNextAction(nextAction?: string | null) {
  if (nextAction === "schedule_visit") return "Fissa sopralluogo";
  if (nextAction === "book_intervention") return "Intervento diretto";
  if (nextAction === "ask_clarification") return "Chiedi chiarimento";
  return "Da definire";
}

function friendlyUrgency(urgency?: string | null) {
  switch ((urgency ?? "").toLowerCase()) {
    case "high":
      return "Alta";
    case "low":
      return "Bassa";
    default:
      return "Media";
  }
}

function friendlyAiSource(source?: string | null) {
  if (source === "openai") return "AI";
  if (source === "heuristic") return "Regole interne";
  return "Sistema";
}

function friendlyMissingField(field: string) {
  if (field === "customer_name") return "nome cliente";
  if (field === "address") return "indirizzo";
  if (field === "preferred_window") return "finestra oraria";
  if (field === "photos") return "foto";
  if (field === "measurements") return "misure";
  return field.replaceAll("_", " ");
}

function proposalStatusLabel(status?: string | null) {
  if (status === "PENDING_HANDYMAN_APPROVAL") return "In attesa approvazione interna";
  if (status === "APPROVED") return "Pronta da inviare al cliente";
  if (status === "SENT_TO_CUSTOMER") return "Inviata al cliente";
  if (status === "CUSTOMER_CONFIRMED") return "Cliente confermato";
  if (status === "REJECTED") return "Rifiutata";
  return "Nessuna proposta";
}
