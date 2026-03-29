import type { ReactNode } from "react";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  MessageSquare,
  Receipt,
  Search,
  Settings,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/button";
import { getCurrentSession } from "@/lib/auth";
import { getVisibleNavHrefs } from "@/lib/authz";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/leads", label: "Richieste", icon: ClipboardList },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/jobs", label: "Lavori", icon: CalendarDays },
  { href: "/customers", label: "Clienti", icon: Users },
  { href: "/estimates", label: "Preventivi", icon: FileText },
  { href: "/invoices", label: "Fatture", icon: Receipt },
  { href: "/automations", label: "Automazioni", icon: Settings },
  { href: "/settings/company", label: "Impostazioni", icon: Settings }
];

export async function AppShell({
  pathname,
  children
}: {
  pathname: string;
  children: ReactNode;
}) {
  const session = await getCurrentSession();
  const currentUser = session?.user;
  const company = currentUser?.company;
  const isWorker = currentUser?.role === UserRole.WORKER;
  const visibleNavItems = navItems.filter((item) =>
    getVisibleNavHrefs(isWorker ? "WORKER" : "OWNER").includes(item.href)
  );
  const initials = currentUser?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "SC";
  const currentSection =
    visibleNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.label ?? "Schedio";
  const mobileNavItems = isWorker
    ? [
        { href: "/jobs", label: "Lavori", icon: CalendarDays },
        { href: "/calendar", label: "Calendario", icon: CalendarDays }
      ]
    : [navItems[0], navItems[1], navItems[2], { href: "/automations", label: "Altro", icon: Settings }];

  return (
    <div className="min-h-screen bg-neutral-50 text-ink">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[24px] bg-primary-900 p-6 text-white lg:flex lg:flex-col">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-200">
              Schedio
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Schedio</h2>
            <p className="mt-2 text-sm text-primary-100">
              Organizza richieste, appuntamenti, preventivi e follow-up in un solo posto.
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-white text-ink"
                      : "text-primary-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">{company?.name ?? "Schedio"}</p>
            <p className="mt-1 text-xs text-primary-100">{company?.phone ?? "+39 347 555 1200"}</p>
            <p className="text-xs text-primary-100">{company?.email ?? "ciao@schedio.it"}</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="mb-6 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-soft">
              <div className="hidden items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  Cerca clienti, richieste o preventivi
                </span>
              </div>

              <div className="min-w-0 md:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-600">
                  Schedio
                </p>
                <p className="truncate text-sm font-semibold text-ink">{currentSection}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-ink">{currentUser?.name ?? "Schedio User"}</p>
                  <p className="text-xs text-neutral-500">
                    {currentUser?.role === UserRole.WORKER ? "Worker" : "Owner"}
                  </p>
                </div>
                <form action="/api/auth/logout" method="post" className="hidden md:block">
                  <button
                    type="submit"
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Logout
                  </button>
                </form>
                <form action="/api/auth/logout" method="post" className="md:hidden">
                  <button
                    type="submit"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {initials}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] bg-gradient-to-r from-primary-900 via-primary-700 to-primary-600 px-5 py-5 text-white shadow-panel">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-primary-100">
                    {isWorker
                      ? "Il tuo calendario e i tuoi lavori, senza confusione."
                      : "Richieste, appuntamenti e preventivi in ordine."}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold">
                    {isWorker ? "Vedi solo quello che devi fare adesso." : "Meno caos. Piu lavori chiusi."}
                  </h1>
                </div>
                {isWorker ? null : (
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:flex">
                    <QuickPill href="/leads?action=new">Nuova richiesta</QuickPill>
                    <QuickPill href="/calendar">Nuovo appuntamento</QuickPill>
                    <QuickPill href="/estimates">Nuovo preventivo</QuickPill>
                    <QuickPill href="/invoices">Nuova fattura</QuickPill>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-8">{children}</main>

          <nav
            className={cn(
              "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] grid gap-2 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-panel backdrop-blur lg:hidden",
              mobileNavItems.length === 2 ? "grid-cols-2" : "grid-cols-4"
            )}
          >
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                    active ? "bg-primary-50 text-primary-700" : "text-neutral-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

function QuickPill({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <ButtonLink
      href={href}
      variant="secondary"
      size="md"
      className="min-w-max rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
    >
      {children}
    </ButtonLink>
  );
}
