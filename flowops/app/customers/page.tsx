import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { getCustomersPageData } from "@/lib/crm-server";
import { formatCompactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  try {
    const { data: items } = await getCustomersPageData();
    const firstCustomer = items[0];

    return (
      <AppShell pathname="/customers">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Clienti"
            title="Una scheda unica per vedere tutta la relazione"
            description="Dati contatto, indirizzi, jobs, preventivi, fatture e timeline nello stesso posto. Questa e la fonte unica di verita del v1."
            action={{ href: "/leads?action=new", label: "Nuova richiesta", dataTour: "customers-new" }}
          />

          <SectionCard title="Rubrica clienti" subtitle="Essenziale ma completa per owner e admin.">
            <>
              <div className="space-y-3 lg:hidden">
                {items.map((customer) => (
                  <div key={customer.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-ink">{customer.fullName}</p>
                        <p className="mt-1 text-sm text-neutral-600">{customer.phone}</p>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                        {customer._count.jobs} lavori
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-3">
                      <CustomerMeta label="Indirizzo" value={customer.address ?? "Non disponibile"} className="col-span-2" />
                      <CustomerMeta label="Preventivi" value={`${customer._count.estimates}`} />
                      <CustomerMeta label="Fatture" value={`${customer._count.invoices}`} />
                      <CustomerMeta label="Creato" value={formatCompactDate(customer.createdAt.toISOString())} className="col-span-2" />
                    </div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                    >
                      Apri cliente
                    </Link>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block">
                <DataTable
                  columns={[
                    {
                      key: "name",
                      header: "Cliente",
                      render: (customer) => (
                        <div>
                          <p className="font-medium text-ink">{customer.fullName}</p>
                          <p className="text-xs text-slate-500">{customer.phone}</p>
                        </div>
                      )
                    },
                    {
                      key: "address",
                      header: "Indirizzo",
                      render: (customer) => <span>{customer.address ?? "Non disponibile"}</span>
                    },
                    {
                      key: "jobs",
                      header: "Jobs",
                      render: (customer) => <span>{customer._count.jobs}</span>
                    },
                    {
                      key: "estimates",
                      header: "Preventivi",
                      render: (customer) => <span>{customer._count.estimates}</span>
                    },
                    {
                      key: "invoices",
                      header: "Fatture",
                      render: (customer) => <span>{customer._count.invoices}</span>
                    },
                    {
                      key: "created",
                      header: "Creato",
                      render: (customer) => <span>{formatCompactDate(customer.createdAt.toISOString())}</span>
                    },
                    {
                      key: "actions",
                      header: "Azioni",
                      render: (customer) => (
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Apri cliente
                        </Link>
                      )
                    }
                  ]}
                  data={items}
                />
              </div>
            </>
          </SectionCard>
        </div>
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/customers">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Clienti"
            title="Una scheda unica per vedere tutta la relazione"
            description="Dati contatto, indirizzi, jobs, preventivi, fatture e timeline nello stesso posto. Questa e la fonte unica di verita del v1."
          />

          <SectionCard title="Rubrica clienti" subtitle="Essenziale ma completa per owner e admin.">
            <p className="text-sm text-neutral-600">
              Impossibile caricare la rubrica clienti dal database. Riprova tra poco.
            </p>
          </SectionCard>
        </div>
      </AppShell>
    );
  }
}

function CustomerMeta({
  label,
  value,
  className
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}
