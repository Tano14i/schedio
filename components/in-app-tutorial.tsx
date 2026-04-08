"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserRole } from "@prisma/client";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Sparkles,
  X
} from "lucide-react";
import { Button, ButtonLink } from "@/components/button";

// ── Types ────────────────────────────────────────────────────────────────────

type TutorialTarget = {
  paths: string[];
  selector: string;
  hint: string;
};

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  optional?: boolean;
  navTarget: TutorialTarget;
  pageTargets?: TutorialTarget[];
};

type TutorialState = {
  currentIndex: number;
  completedIds: string[];
  dismissed: boolean;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

// ── Owner steps ──────────────────────────────────────────────────────────────

const OWNER_STEPS: TutorialStep[] = [
  {
    id: "owner_customers",
    title: "Aggiungi il tuo primo cliente",
    description: "Inizia aggiungendo un cliente al tuo archivio.",
    href: "/customers",
    cta: "Vai ai Clienti",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-customers"]',
      hint: "Apri la sezione Clienti da qui."
    },
    pageTargets: [
      {
        paths: ["/customers"],
        selector: '[data-tour="customers-new"]',
        hint: "Clicca qui per aggiungere il primo cliente."
      }
    ]
  },
  {
    id: "owner_estimate_create",
    title: "Crea il tuo primo preventivo",
    description: "Prepara un preventivo professionale con margine visibile prima di inviarlo.",
    href: "/estimates",
    cta: "Crea preventivo",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-estimates"]',
      hint: "Apri la sezione Preventivi da qui."
    },
    pageTargets: [
      {
        paths: ["/estimates"],
        selector: '[data-tour="estimates-new"]',
        hint: "Clicca qui per creare un nuovo preventivo."
      }
    ]
  },
  {
    id: "owner_invoice",
    title: "Segna il lavoro come pagato",
    description: "Quando incassi, aggiorna la fattura e tieni il margine sotto controllo.",
    href: "/invoices",
    cta: "Vai alle Fatture",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-invoices"]',
      hint: "Apri la sezione Fatture da qui."
    },
    pageTargets: [
      {
        paths: ["/invoices"],
        selector: '[data-tour="invoices-mark-paid"]',
        hint: "Clicca qui per segnare la fattura come pagata."
      }
    ]
  },
  {
    id: "owner_whatsapp",
    title: "Connetti WhatsApp",
    description:
      "Ricevi richieste direttamente su WhatsApp e lascia che l'AI le organizzi per te.",
    href: "/settings",
    cta: "Configura WhatsApp",
    optional: true,
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-settings-company"]',
      hint: "Apri le impostazioni per configurare WhatsApp."
    }
  }
];

// ── Worker steps (invariati) ─────────────────────────────────────────────────

const WORKER_STEPS: TutorialStep[] = [
  {
    id: "worker_jobs",
    title: "Apri il prossimo lavoro",
    description: "Entra nella lista lavori e apri quello che devi fare adesso.",
    href: "/jobs",
    cta: "Apri i lavori",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-jobs"]',
      hint: "Vai ai lavori."
    },
    pageTargets: [
      {
        paths: ["/jobs"],
        selector: '[data-tour="jobs-open-first"]',
        hint: "Apri questo lavoro."
      }
    ]
  },
  {
    id: "worker_calendar",
    title: "Controlla il calendario",
    description: "Verifica orario, cliente e prossimo appuntamento prima di muoverti.",
    href: "/calendar",
    cta: "Apri calendario",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-calendar"]',
      hint: "Apri il calendario."
    },
    pageTargets: [
      {
        paths: ["/calendar"],
        selector: '[data-tour="nav-calendar"]',
        hint: "Qui hai la vista appuntamenti del giorno."
      }
    ]
  },
  {
    id: "worker_hours",
    title: "Registra ore e stato",
    description:
      "Dentro il lavoro aggiorni ore e stato senza tornare su WhatsApp o note sparse.",
    href: "/jobs",
    cta: "Torna ai lavori",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-jobs"]',
      hint: "Torna alla lista lavori."
    },
    pageTargets: [
      {
        paths: ["/jobs"],
        selector: '[data-tour="jobs-open-first"]',
        hint: "Apri un lavoro per registrare le ore."
      },
      {
        paths: ["/jobs/"],
        selector: '[data-tour="job-log-hours"]',
        hint: "Clicca qui per registrare le ore lavorate."
      }
    ]
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStorageKey(role: UserRole) {
  return role === UserRole.WORKER
    ? "schedio_tutorial_worker_v4"
    : "schedio_tutorial_owner_v4";
}

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(p));
}

function getActiveTarget(step: TutorialStep, pathname: string) {
  return (
    step.pageTargets?.find((t) => matchesPath(pathname, t.paths)) ?? step.navTarget
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function InAppTutorial({
  pathname,
  role,
  firstName
}: {
  pathname: string;
  role: UserRole;
  firstName: string;
}) {
  const steps = useMemo(
    () => (role === UserRole.WORKER ? WORKER_STEPS : OWNER_STEPS),
    [role]
  );
  const storageKey = useMemo(() => getStorageKey(role), [role]);

  const [state, setState] = useState<TutorialState>({
    currentIndex: 0,
    completedIds: [],
    dismissed: false
  });
  const [hydrated, setHydrated] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const lastAutoScrollKey = useRef("");

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TutorialState>;
        setState({
          currentIndex:
            typeof parsed.currentIndex === "number" && parsed.currentIndex >= 0
              ? Math.min(parsed.currentIndex, steps.length - 1)
              : 0,
          completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
          dismissed: Boolean(parsed.dismissed)
        });
      }
    } catch {
      setState({ currentIndex: 0, completedIds: [], dismissed: false });
    } finally {
      setHydrated(true);
    }
  }, [steps.length, storageKey]);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state, storageKey]);

  // Escape to dismiss
  useEffect(() => {
    if (!hydrated || state.dismissed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState((s) => ({ ...s, dismissed: true }));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hydrated, state.dismissed]);

  const completedSet = new Set(state.completedIds);
  const currentStep =
    steps[state.currentIndex] ??
    steps.find((s) => !completedSet.has(s.id)) ??
    steps[steps.length - 1];
  const currentIndex = steps.findIndex((s) => s.id === currentStep.id);
  const completedCount = completedSet.size;
  const allCompleted = completedCount === steps.length;
  const activeTarget = currentStep ? getActiveTarget(currentStep, pathname) : null;

  // Auto-scroll to spotlight target
  useEffect(() => {
    if (!hydrated || state.dismissed || allCompleted || !activeTarget) return;
    const key = `${pathname}:${currentStep.id}:${activeTarget.selector}`;
    if (lastAutoScrollKey.current === key) return;
    const el = document.querySelector(activeTarget.selector) as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 120 || rect.bottom > window.innerHeight - 180) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    lastAutoScrollKey.current = key;
  }, [activeTarget, allCompleted, currentStep.id, hydrated, pathname, state.dismissed]);

  // Spotlight rect tracking
  useEffect(() => {
    if (!hydrated || state.dismissed || allCompleted || !activeTarget) {
      setSpotlight(null);
      return;
    }
    let frame = 0;
    const update = () => {
      const el = document.querySelector(activeTarget.selector) as HTMLElement | null;
      const r = el?.getBoundingClientRect();
      if (r && (r.width > 0 || r.height > 0)) {
        setSpotlight({ top: r.top, left: r.left, width: r.width, height: r.height });
        return;
      }
      // Element missing or hidden (e.g. desktop sidebar on mobile) — fall back to navTarget
      const navEl = document.querySelector(currentStep.navTarget.selector) as HTMLElement | null;
      const navR = navEl?.getBoundingClientRect();
      if (navR && (navR.width > 0 || navR.height > 0)) {
        setSpotlight({ top: navR.top, left: navR.left, width: navR.width, height: navR.height });
      } else {
        setSpotlight(null);
      }
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const iv = window.setInterval(schedule, 700);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.clearInterval(iv);
    };
  }, [activeTarget, allCompleted, hydrated, pathname, state.dismissed]);

  if (!hydrated || state.dismissed) return null;

  function goToIndex(i: number) {
    setState((s) => ({ ...s, currentIndex: Math.max(0, Math.min(i, steps.length - 1)) }));
  }

  function restartTutorial() {
    setState({ currentIndex: 0, completedIds: [], dismissed: false });
  }

  const tooltipTop =
    spotlight && spotlight.top + spotlight.height + 70 > window.innerHeight
      ? Math.max(12, spotlight.top - 54)
      : spotlight
        ? spotlight.top + spotlight.height + 10
        : 0;
  const tooltipLeft = spotlight
    ? Math.min(Math.max(12, spotlight.left), window.innerWidth - 240)
    : 0;

  return (
    <>
      {/* Spotlight overlay */}
      {!allCompleted && spotlight && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div
            className="absolute rounded-[24px] border-2 border-primary-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.16)] transition-all duration-300"
            style={{
              top: Math.max(8, spotlight.top - 6),
              left: Math.max(8, spotlight.left - 6),
              width: spotlight.width + 12,
              height: spotlight.height + 12
            }}
          />
          <div
            className="absolute max-w-[220px] rounded-2xl bg-primary-900 px-3 py-2 text-xs font-medium text-white shadow-panel"
            style={{ top: tooltipTop, left: tooltipLeft }}
          >
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-3.5 w-3.5" />
              {activeTarget?.hint}
            </div>
          </div>
        </div>
      )}

      {/* Banner compatto */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-soft sm:mb-5">

        {/* Riga header: icona · label · passo N di N · dot nav · ✕ */}
        <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-primary-500" />
          <span className="text-xs font-semibold text-primary-700">Guida rapida</span>
          <span className="text-xs text-neutral-400">
            · Passo {Math.min(currentIndex + 1, steps.length)} di {steps.length}
          </span>
          {/* Dot navigation */}
          <div className="ml-1 flex flex-1 items-center gap-1.5">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToIndex(i)}
                aria-label={`Vai al passo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-6 bg-primary-500"
                    : completedSet.has(s.id)
                      ? "w-4 bg-green-400"
                      : "w-4 bg-neutral-200"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, dismissed: true }))}
            aria-label="Nascondi guida"
            className="ml-auto inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Riga contenuto */}
        {allCompleted ? (
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  Ottimo lavoro, {firstName}!
                </p>
                <p className="text-xs text-neutral-500">
                  Hai completato tutti i passi della guida.
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Button onClick={restartTutorial} variant="secondary" size="md">
                Ricomincia
              </Button>
              <ButtonLink href="/" size="md">
                Vai alla Panoramica
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
            {/* Titolo + descrizione */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {currentStep.title}
                {currentStep.optional && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    (facoltativo)
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-neutral-500">
                {currentStep.description}
              </p>
            </div>

            {/* ← CTA → */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-2 text-neutral-600 disabled:opacity-30"
                aria-label="Passo precedente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <ButtonLink
                href={currentStep.href}
                size="md"
                className="bg-primary-500 text-white hover:bg-primary-600"
              >
                {currentStep.cta}
              </ButtonLink>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex === steps.length - 1}
                className="px-2 text-neutral-600 disabled:opacity-30"
                aria-label="Passo successivo"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
