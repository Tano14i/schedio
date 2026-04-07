import type { ReactNode } from "react";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  Grid2x2,
  LogOut,
  MessageSquare,
  Receipt,
  Search,
  Settings,
  Users
} from "lucide-react";
import { ButtonLink } from "@/components/button";
import { InAppTutorial } from "@/components/in-app-tutorial";
import { getCurrentSession } from "@/lib/auth";
import { getVisibleNavHrefs } from "@/lib/authz";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Panoramica", icon: Gauge },
  { href: "/leads", label: "Richieste", icon: ClipboardList },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquare },
  { href: "/jobs", label: "Lavori", icon: CalendarDays },
  { href: "/customers", label: "Clienti", icon: Users },
  { href: "/estimates", label: "Preventivi", icon: FileText },
  { href: "/invoices", label: "Fatture", icon: Receipt },
  { href: "/automations", label: "Automazioni", icon: Settings },
  { href: "/settings/company", label: "Impostazioni", icon: Settings },
  { href: "/settings/team", label: "Team", icon: Users }
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
    getSectionLabel(pathname) ?? "Schedio";
  const firstName = currentUser?.name?.split(" ")[0] ?? "qui";
  const mobileNavItems = isWorker
    ? [
        { href: "/jobs", label: "Lavori", icon: CalendarDays },
        { href: "/calendar", label: "Calendario", icon: CalendarDays }
      ]
    : [
        navItems[0],
        navItems[1],
        navItems[2],
        { href: "/more", label: "Altro", icon: Grid2x2 }
      ];
  const mobileShortcuts = getMobileShortcuts(pathname, isWorker);
  const showDesktopHero = pathname === "/" || !isWorker;

  return (
    <div className="min-h-screen bg-neutral-50 text-ink">
      <div className="mx-auto flex max-w-[1440px] gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:gap-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[24px] bg-primary-900 p-6 text-white lg:flex lg:flex-col">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-200">
              Schedio
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Schedio</h2>
            <p className="mt-2 text-sm text-primary-100">
              Organizza richieste, appuntamenti, preventivi e promemoria in un solo posto.
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
                  data-tour={tourIdForHref(item.href)}
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
          <header className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-3 shadow-soft sm:px-4">
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

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-ink">{currentUser?.name ?? "Schedio User"}</p>
                  <p className="text-xs text-neutral-500">
                    {currentUser?.role === UserRole.WORKER ? "Collaboratore" : "Responsabile"}
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 sm:h-10 sm:w-10 sm:text-sm">
                  {initials}
                </div>
              </div>
            </div>

            {showDesktopHero ? (
              <>
                <div className="hidden rounded-[24px] bg-gradient-to-r from-primary-900 via-primary-700 to-primary-600 px-4 py-4 text-white shadow-panel sm:block sm:px-5 sm:py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs text-primary-100 sm:text-sm">
                        {isWorker
                          ? "Il tuo calendario e i tuoi lavori, senza confusione."
                          : "Richieste, appuntamenti e preventivi in ordine."}
                      </p>
                      <h1 className="mt-1 max-w-2xl text-lg font-semibold leading-tight sm:text-2xl">
                        {isWorker ? "Vedi solo quello che devi fare adesso." : "Meno caos. Piu lavori chiusi."}
                      </h1>
                    </div>
                    {isWorker ? null : (
                      <div className="hidden gap-2 sm:grid sm:grid-cols-2 lg:flex">
                        <QuickPill href="/leads?action=new">Nuova richiesta</QuickPill>
                        <QuickPill href="/calendar">Nuovo appuntamento</QuickPill>
                        <QuickPill href="/estimates">Nuovo preventivo</QuickPill>
                        <QuickPill href="/invoices">Nuova fattura</QuickPill>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-soft sm:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">
                        {pathname === "/" ? (isWorker ? "Riepilogo collaboratore" : "Riepilogo responsabile") : currentSection}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">
                        {mobileShortcuts.length
                          ? "Scorciatoie rapide per questa sezione."
                          : "Apri il menu in basso per le sezioni secondarie."}
                      </p>
                    </div>
                  </div>
                  {mobileShortcuts.length ? (
                    <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                      {mobileShortcuts.map((shortcut) => (
                        <CompactShortcut key={shortcut.href} href={shortcut.href}>
                          {shortcut.label}
                        </CompactShortcut>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </header>

          {currentUser ? (
            <InAppTutorial
              pathname={pathname}
              role={currentUser.role}
              firstName={firstName}
            />
          ) : null}

          <main className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-8">{children}</main>

          <nav
            className={cn(
              "fixed inset-x-0 bottom-0 z-30 grid gap-1 border-t border-neutral-200 bg-white/98 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden",
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
                  data-tour={tourIdForHref(item.href)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium",
                    isMobileNavActive(pathname, item.href)
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-500"
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
      data-tour={tourIdForHref(href)}
      variant="secondary"
      size="md"
      className="min-w-[148px] justify-center rounded-xl border-white/15 bg-white/10 px-3 text-center text-sm text-white hover:bg-white/20 hover:text-white sm:min-w-0 sm:w-full lg:min-w-max"
    >
      {children}
    </ButtonLink>
  );
}

function CompactShortcut({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <ButtonLink
      href={href}
      data-tour={tourIdForHref(href)}
      variant="secondary"
      size="md"
      className="min-w-[132px] border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-800"
    >
      {children}
    </ButtonLink>
  );
}

function getSectionLabel(pathname: string) {
  const labels: Array<[string, string]> = [
    ["/", "Panoramica"],
    ["/leads", "Richieste"],
    ["/calendar", "Calendario"],
    ["/whatsapp", "WhatsApp"],
    ["/jobs", "Lavori"],
    ["/customers", "Clienti"],
    ["/estimates", "Preventivi"],
    ["/invoices", "Fatture"],
    ["/automations", "Automazioni"],
    ["/activity", "Attivita"],
    ["/settings/company", "Impostazioni"],
    ["/settings/team", "Team"],
    ["/more", "Altro"]
  ];

  return labels.find(([href]) => pathname === href || pathname.startsWith(`${href}/`))?.[1];
}

function getMobileShortcuts(pathname: string, isWorker: boolean) {
  if (isWorker) {
    return pathname.startsWith("/jobs")
      ? [
          { href: "/calendar", label: "Calendario" },
          { href: "/jobs", label: "I miei lavori" }
        ]
      : [
          { href: "/jobs", label: "I miei lavori" },
          { href: "/calendar", label: "Oggi" }
        ];
  }

  if (pathname.startsWith("/leads")) {
    return [
      { href: "/leads?action=new", label: "Nuova richiesta" },
      { href: "/calendar", label: "Pianifica" }
    ];
  }

  if (pathname.startsWith("/calendar")) {
    return [
      { href: "/calendar?action=schedule", label: "Nuovo appuntamento" },
      { href: "/jobs", label: "Apri lavori" }
    ];
  }

  if (pathname.startsWith("/whatsapp")) {
    return [
      { href: "/whatsapp?action=intake", label: "Nuova richiesta WA" },
      { href: "/leads", label: "Apri richieste" }
    ];
  }

  if (pathname.startsWith("/estimates")) {
    return [
      { href: "/estimates", label: "Da seguire" },
      { href: "/invoices", label: "Vai alle fatture" }
    ];
  }

  if (pathname.startsWith("/invoices")) {
    return [
      { href: "/invoices", label: "Da incassare" },
      { href: "/activity", label: "Attivita" }
    ];
  }

  if (pathname.startsWith("/customers")) {
    return [
      { href: "/customers", label: "Rubrica clienti" },
      { href: "/leads?action=new", label: "Nuova richiesta" }
    ];
  }

  if (pathname.startsWith("/automations")) {
    return [
      { href: "/automations", label: "Esecuzioni" },
      { href: "/activity", label: "Ultime attivita" }
    ];
  }

  if (pathname.startsWith("/activity")) {
    return [
      { href: "/estimates", label: "Preventivi" },
      { href: "/invoices", label: "Fatture" }
    ];
  }

  return [];
}

function isMobileNavActive(pathname: string, href: string) {
  if (href === "/more") {
    return ["/whatsapp", "/customers", "/estimates", "/invoices", "/automations", "/activity", "/settings/company", "/settings/team", "/more"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function tourIdForHref(href: string) {
  const map: Record<string, string> = {
    "/": "nav-dashboard",
    "/leads": "nav-leads",
    "/calendar": "nav-calendar",
    "/whatsapp": "nav-whatsapp",
    "/jobs": "nav-jobs",
    "/customers": "nav-customers",
    "/estimates": "nav-estimates",
    "/invoices": "nav-invoices",
    "/automations": "nav-automations",
    "/settings/company": "nav-settings-company",
    "/settings/team": "nav-team",
    "/more": "nav-more"
  };

  return map[href];
}
