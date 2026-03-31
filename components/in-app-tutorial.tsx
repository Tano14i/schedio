"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { CheckCircle2, ChevronLeft, ChevronRight, MousePointerClick, Sparkles, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/button";

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

const OWNER_STEPS: TutorialStep[] = [
  {
    id: "owner_whatsapp",
    title: "1. Fai entrare una richiesta",
    description: "Parti da WhatsApp e crea il primo thread reale da lavorare.",
    href: "/whatsapp",
    cta: "Apri WhatsApp",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-whatsapp"]',
      hint: "Apri WhatsApp da qui."
    },
    pageTargets: [
      {
        paths: ["/whatsapp"],
        selector: '[data-tour="whatsapp-new-request"]',
        hint: "Clicca qui per creare una nuova richiesta WhatsApp."
      }
    ]
  },
  {
    id: "owner_calendar",
    title: "2. Pianifica il sopralluogo",
    description: "Porta la richiesta in agenda cosi il lavoro smette di restare in sospeso.",
    href: "/calendar",
    cta: "Vai al calendario",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-calendar"]',
      hint: "Apri il calendario."
    },
    pageTargets: [
      {
        paths: ["/calendar"],
        selector: '[data-tour="calendar-new-appointment"]',
        hint: "Clicca qui per programmare un appuntamento."
      }
    ]
  },
  {
    id: "owner_job",
    title: "3. Apri il lavoro e chiudilo",
    description: "Passa dalla lista lavori alla scheda operativa e chiudi il sopralluogo.",
    href: "/jobs",
    cta: "Apri i lavori",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-jobs"]',
      hint: "Apri la sezione lavori."
    },
    pageTargets: [
      {
        paths: ["/jobs"],
        selector: '[data-tour="jobs-open-first"]',
        hint: "Apri il primo lavoro da questa lista."
      },
      {
        paths: ["/jobs/"],
        selector: '[data-tour="job-mark-complete"]',
        hint: "Qui chiudi il sopralluogo quando hai finito."
      }
    ]
  },
  {
    id: "owner_estimate",
    title: "4. Invia il preventivo",
    description: "Apri il preventivo e invialo al cliente dal pulsante principale.",
    href: "/estimates",
    cta: "Apri preventivi",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-estimates"]',
      hint: "Vai ai preventivi."
    },
    pageTargets: [
      {
        paths: ["/estimates"],
        selector: '[data-tour="estimates-send-client"]',
        hint: "Clicca qui per inviare il preventivo al cliente."
      }
    ]
  },
  {
    id: "owner_margin",
    title: "5. Imposta il costo orario",
    description: "Salva il costo orario del team per vedere manodopera e margine veri.",
    href: "/settings/team",
    cta: "Apri team",
    navTarget: {
      paths: [],
      selector: '[data-tour="nav-team"]',
      hint: "Apri il team."
    },
    pageTargets: [
      {
        paths: ["/settings/team"],
        selector: '[data-tour="team-save-hourly-cost"]',
        hint: "Salva qui il costo orario del team."
      }
    ]
  }
];

const WORKER_STEPS: TutorialStep[] = [
  {
    id: "worker_jobs",
    title: "1. Apri il prossimo lavoro",
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
    title: "2. Controlla il calendario",
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
    title: "3. Registra ore e stato",
    description: "Dentro il lavoro aggiorni ore e stato senza tornare su WhatsApp o note sparse.",
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

function getStorageKey(role: UserRole) {
  return role === UserRole.WORKER ? "schedio_tutorial_worker_v2" : "schedio_tutorial_owner_v2";
}

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(path));
}

function getActiveTarget(step: TutorialStep, pathname: string) {
  return step.pageTargets?.find((target) => matchesPath(pathname, target.paths)) ?? step.navTarget;
}

export function InAppTutorial({
  pathname,
  role,
  firstName
}: {
  pathname: string;
  role: UserRole;
  firstName: string;
}) {
  const steps = useMemo(() => (role === UserRole.WORKER ? WORKER_STEPS : OWNER_STEPS), [role]);
  const storageKey = useMemo(() => getStorageKey(role), [role]);
  const [state, setState] = useState<TutorialState>({
    currentIndex: 0,
    completedIds: [],
    dismissed: false
  });
  const [hydrated, setHydrated] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

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
      setState({
        currentIndex: 0,
        completedIds: [],
        dismissed: false
      });
    } finally {
      setHydrated(true);
    }
  }, [steps.length, storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state, storageKey]);

  const completedSet = new Set(state.completedIds);
  const currentStep =
    steps[state.currentIndex] ??
    steps.find((step) => !completedSet.has(step.id)) ??
    steps[steps.length - 1];
  const currentIndex = steps.findIndex((step) => step.id === currentStep.id);
  const completedCount = steps.filter((step) => completedSet.has(step.id)).length;
  const isCurrentComplete = completedSet.has(currentStep.id);
  const allCompleted = completedCount === steps.length;
  const activeTarget = currentStep ? getActiveTarget(currentStep, pathname) : null;

  useEffect(() => {
    if (!hydrated || state.dismissed || allCompleted || !activeTarget) {
      setSpotlight(null);
      return;
    }

    let frame = 0;

    const updateSpotlight = () => {
      const element = document.querySelector(activeTarget.selector) as HTMLElement | null;
      if (!element) {
        setSpotlight(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      setSpotlight({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateSpotlight);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    const interval = window.setInterval(scheduleUpdate, 700);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.clearInterval(interval);
    };
  }, [activeTarget, allCompleted, hydrated, pathname, state.dismissed]);

  if (!hydrated || state.dismissed) {
    return null;
  }

  function updateState(next: TutorialState) {
    setState(next);
  }

  function markCurrentStepDone() {
    if (isCurrentComplete) {
      if (currentIndex < steps.length - 1) {
        updateState({
          ...state,
          currentIndex: currentIndex + 1
        });
      }
      return;
    }

    const nextCompletedIds = [...state.completedIds, currentStep.id];
    const nextIncompleteIndex = steps.findIndex((step) => !nextCompletedIds.includes(step.id));

    updateState({
      currentIndex: nextIncompleteIndex === -1 ? steps.length - 1 : nextIncompleteIndex,
      completedIds: nextCompletedIds,
      dismissed: false
    });
  }

  function goToIndex(index: number) {
    updateState({
      ...state,
      currentIndex: Math.max(0, Math.min(index, steps.length - 1))
    });
  }

  function restartTutorial() {
    updateState({
      currentIndex: 0,
      completedIds: [],
      dismissed: false
    });
  }

  const spotlightHint = activeTarget?.hint ?? "Sto evidenziando il punto giusto da cliccare.";
  const tooltipTop =
    spotlight && typeof window !== "undefined" && spotlight.top + spotlight.height + 70 > window.innerHeight
      ? Math.max(12, spotlight.top - 54)
      : spotlight
        ? spotlight.top + spotlight.height + 10
        : 0;
  const tooltipLeft =
    spotlight && typeof window !== "undefined"
      ? Math.min(Math.max(12, spotlight.left), window.innerWidth - 240)
      : 0;

  return (
    <>
      {!allCompleted && spotlight ? (
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
            style={{
              top: tooltipTop,
              left: tooltipLeft
            }}
          >
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-3.5 w-3.5" />
              {spotlightHint}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 rounded-2xl border border-primary-200 bg-white p-4 shadow-soft sm:mb-6 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                  Tutorial guidato
                </p>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-ink">
                {allCompleted ? `Bravo ${firstName}, il giro base e chiuso.` : `Ti guido passo per passo, ${firstName}.`}
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                {allCompleted
                  ? "Ora puoi rifarlo come demo oppure continuare a usare Schedio senza buco iniziale."
                  : "Ti sto evidenziando il punto esatto da cliccare, uno step alla volta."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateState({ ...state, dismissed: true })}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
              aria-label="Nascondi tutorial"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              Step {Math.min(currentIndex + 1, steps.length)}/{steps.length}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              {completedCount} completati
            </span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 sm:max-w-[220px]">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${(completedCount / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {allCompleted ? (
            <div className="rounded-2xl border border-success-200 bg-success-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-success-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-success-800">Tutorial completato</p>
                  <p className="mt-1 text-sm text-success-700">
                    Hai gia toccato richieste, lavori, preventivi e margine. Da qui puoi continuare da dashboard o rifare il giro demo.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button onClick={restartTutorial} variant="secondary" size="md" className="w-full sm:w-auto">
                  Ricomincia tutorial
                </Button>
                <ButtonLink href="/" size="md" className="w-full sm:w-auto">
                  Torna alla dashboard
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-ink">{currentStep.title}</p>
              <p className="mt-2 text-sm text-neutral-600">{currentStep.description}</p>
              <div className="mt-3 rounded-xl border border-primary-200 bg-white px-3 py-3 text-sm text-primary-700">
                {spotlightHint}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <ButtonLink href={currentStep.href} size="md" className="w-full sm:w-auto">
                  {currentStep.cta}
                </ButtonLink>
                <Button
                  onClick={markCurrentStepDone}
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  {isCurrentComplete ? "Vai al prossimo step" : "Ho cliccato, vai avanti"}
                </Button>
              </div>
            </div>
          )}

          {!allCompleted ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-2 text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Indietro
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToIndex(index)}
                    className={`h-2.5 rounded-full transition ${
                      index === currentIndex
                        ? "w-8 bg-primary-500"
                        : completedSet.has(step.id)
                          ? "w-5 bg-success-400"
                          : "w-5 bg-neutral-200"
                    }`}
                    aria-label={`Vai allo step ${index + 1}`}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex === steps.length - 1}
                className="px-2 text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Avanti
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
