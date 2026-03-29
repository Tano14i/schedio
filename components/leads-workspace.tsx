"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { DataTable } from "@/components/data-table";
import { Drawer } from "@/components/drawer";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { Customer, Lead } from "@/lib/types";
import { leadStatusMap } from "@/lib/design-tokens";
import { formatCompactDate } from "@/lib/utils";

type Props = {
  initialCustomers: Customer[];
  initialLeads: Lead[];
  initialJobLinks: Record<string, string>;
  initialOpen: boolean;
};

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  description: string;
  urgency: "low" | "medium" | "high";
  preferredDate: string;
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  serviceType: "",
  description: "",
  urgency: "medium",
  preferredDate: ""
};

export function LeadsWorkspace({
  initialCustomers,
  initialLeads,
  initialJobLinks,
  initialOpen
}: Props) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [leads, setLeads] = useState(initialLeads);
  const [jobLinksByLead, setJobLinksByLead] = useState<Record<string, string>>(initialJobLinks);
  const [isCreateOpen, setIsCreateOpen] = useState(initialOpen);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setJobLinksByLead(initialJobLinks);
  }, [initialJobLinks]);

  useEffect(() => {
    setIsCreateOpen(initialOpen);
  }, [initialOpen]);

  const filterStatuses = useMemo(
    () => ["new", "contacted", "scheduled", "quoted", "won", "lost"] as const,
    []
  );

  function openDrawer() {
    setIsCreateOpen(true);
    setFeedback("");
    router.push("/leads?action=new", { scroll: false });
  }

  function closeDrawer() {
    setIsCreateOpen(false);
    setForm(emptyForm);
    setFeedback("");
    router.push("/leads", { scroll: false });
  }

  async function saveLead() {
    if (!form.fullName.trim() || !form.phone.trim() || !form.serviceType.trim()) {
      setFeedback("Inserisci nome cliente, telefono e tipo di lavoro.");
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          serviceType: form.serviceType,
          description: form.description,
          urgency: form.urgency,
          preferredDate: form.preferredDate ? `${form.preferredDate}T09:00:00.000Z` : undefined,
          source: "manual"
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.item) {
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      if (result.item.customer) {
        const nextCustomer = result.item.customer as Customer;
        setCustomers((current) =>
          current.some((item) => item.id === nextCustomer.id)
            ? current.map((item) => (item.id === nextCustomer.id ? nextCustomer : item))
            : [nextCustomer, ...current]
        );
      }

      setLeads((current) => [
        {
          id: result.item.id,
          customerId: result.item.customerId,
          source: result.item.source,
          serviceType: result.item.serviceType,
          description: result.item.description,
          urgency: result.item.urgency,
          preferredDate: result.item.preferredDate,
          status: result.item.status,
          createdAt: result.item.createdAt,
          nextAction: result.item.nextAction
        },
        ...current
      ]);

      closeDrawer();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Richieste"
          title="Tutti i nuovi contatti in un solo posto."
          description="Qui vedi cosa sta succedendo e qual e la prossima azione per ogni richiesta."
          action={{ href: "/leads?action=new", label: "Nuova richiesta" }}
        />

        <SectionCard
          title="Filtri"
          subtitle="Tutte, Nuove, Contattate, Programmate, Preventivo inviato, Lavoro acquisito, Non acquisito."
        >
          <div className="flex flex-wrap gap-2">
            {filterStatuses.map((status) => (
              <div key={status} className="rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-700">
                {leadStatusMap[status].label} ({leads.filter((lead) => lead.status === status).length})
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Lista richieste"
          subtitle="Cliente, tipo di lavoro, data, stato, prossima azione e azioni."
        >
          {leads.length ? (
            <DataTable
              columns={[
                {
                  key: "customer",
                  header: "Cliente",
                  render: (lead) => {
                    const customer = customers.find((item) => item.id === lead.customerId);
                    return (
                      <div>
                        <p className="font-medium text-ink">{customer?.fullName}</p>
                        <p className="text-xs text-neutral-500">{customer?.phone}</p>
                      </div>
                    );
                  }
                },
                {
                  key: "service",
                  header: "Tipo di lavoro",
                  render: (lead) => (
                    <div>
                      <p className="font-medium text-ink">{lead.serviceType}</p>
                      <p className="text-xs text-neutral-500">{lead.description}</p>
                    </div>
                  )
                },
                {
                  key: "date",
                  header: "Data",
                  render: (lead) => <span>{formatCompactDate(lead.createdAt)}</span>
                },
                {
                  key: "status",
                  header: "Stato",
                  headerClassName: "md:flex md:items-center",
                  cellClassName: "md:flex md:h-full md:items-center",
                  render: (lead) => <StatusBadge status={lead.status} />
                },
                {
                  key: "action",
                  header: "Prossima azione",
                  render: (lead) => <span>{lead.nextAction}</span>
                },
                {
                  key: "cta",
                  header: "Azioni",
                  headerClassName: "md:flex md:items-center",
                  cellClassName: "md:flex md:h-full md:items-center",
                  render: (lead) => {
                    const actionByStatus = {
                      new: {
                        href: `/calendar?action=schedule&leadId=${lead.id}&kind=estimate_visit`,
                        label: "Pianifica sopralluogo"
                      },
                      contacted: {
                        href: `/calendar?action=schedule&leadId=${lead.id}&kind=estimate_visit`,
                        label: "Pianifica sopralluogo"
                      },
                      scheduled: {
                        href: jobLinksByLead[lead.id] ?? `/calendar?action=schedule&leadId=${lead.id}&kind=estimate_visit`,
                        label: "Apri appuntamento"
                      },
                      quoted: { href: "/estimates", label: "Apri preventivo" },
                      won: {
                        href: `/calendar?action=schedule&leadId=${lead.id}&kind=job`,
                        label: "Pianifica lavoro"
                      },
                      lost: { href: `/customers/${lead.customerId}`, label: "Apri cliente" }
                    } as const;

                    const action = actionByStatus[lead.status];

                    return (
                      <Link
                        href={action.href}
                        className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        {action.label}
                      </Link>
                    );
                  }
                }
              ]}
              data={leads}
            />
          ) : (
            <EmptyState
              title="Nessuna richiesta"
              description="Quando arriva un nuovo contatto, comparira qui."
              action={
                <button
                  type="button"
                  onClick={openDrawer}
                  className="inline-flex rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white"
                >
                  Nuova richiesta
                </button>
              }
            />
          )}
        </SectionCard>
      </div>

      {isCreateOpen ? (
        <Drawer
          title="Nuova richiesta"
          description="Inserisci i dati essenziali per salvare il contatto e passare subito alla prossima azione."
          closeHref="/leads"
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveLead();
            }}
          >
            <Field
              label="Nome cliente"
              placeholder="Es. Mario Rossi"
              value={form.fullName}
              onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Telefono"
                placeholder="Es. +39 333 111 1001"
                value={form.phone}
                onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              />
              <Field
                label="Email"
                placeholder="Es. mario.rossi@email.it"
                value={form.email}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              />
            </div>
            <Field
              label="Indirizzo"
              placeholder="Es. Via Roma 25, Milano"
              value={form.address}
              onChange={(value) => setForm((current) => ({ ...current, address: value }))}
            />
            <Field
              label="Tipo di lavoro"
              placeholder="Es. Riparazione tapparella"
              value={form.serviceType}
              onChange={(value) => setForm((current) => ({ ...current, serviceType: value }))}
            />
            <Field
              label="Descrizione"
              placeholder="Descrivi brevemente il lavoro richiesto"
              multiline
              value={form.description}
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Urgenza"
                options={[
                  { label: "Bassa", value: "low" },
                  { label: "Media", value: "medium" },
                  { label: "Alta", value: "high" }
                ]}
                value={form.urgency}
                onChange={(value) =>
                  setForm((current) => ({ ...current, urgency: value as FormState["urgency"] }))
                }
              />
              <Field
                label="Data preferita"
                placeholder=""
                inputType="date"
                value={form.preferredDate}
                onChange={(value) => setForm((current) => ({ ...current, preferredDate: value }))}
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-ink">Prossimo passo suggerito</p>
              <p className="mt-1 text-sm text-neutral-600">
                Dopo il salvataggio puoi pianificare subito il sopralluogo.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" className="sm:order-2">
                {isSaving ? "Salvataggio..." : "Salva richiesta"}
              </Button>
              <Link
                href="/calendar"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 sm:order-3"
              >
                Pianifica sopralluogo
              </Link>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:order-1"
              >
                Annulla
              </button>
            </div>
            {feedback ? <p className="text-sm text-danger-600">{feedback}</p> : null}
          </form>
        </Drawer>
      ) : null}
    </>
  );
}

function Field({
  label,
  placeholder,
  multiline,
  inputType,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  multiline?: boolean;
  inputType?: "text" | "date" | "email" | "tel";
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
          type={inputType ?? "text"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
