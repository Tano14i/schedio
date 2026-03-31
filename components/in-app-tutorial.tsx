"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/button";

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  paths: string[];
};

type TutorialState = {
  currentIndex: number;
  completedIds: string[];
  dismissed: boolean;
};

const OWNER_STEPS: TutorialStep[] = [
  {
    id: "owner_whatsapp",
    title: "1. Fai entrare una richiesta",
    description: "Apri WhatsApp o crea una richiesta per vedere subito il funnel partire.",
    href: "/whatsapp",
    cta: "Apri WhatsApp",
    paths: ["/whatsapp", "/leads"]
  },
  {
    id: "owner_calendar",
    title: "2. Pianifica il sopralluogo",
    description: "Porta la richiesta in calendario, cosi l'agenda comincia a muoversi davvero.",
    href: "/calendar",
    cta: "Vai al calendario",
    paths: ["/calendar"]
  },
  {
    id: "owner_job",
    title: "3. Chiudi il lavoro sul campo",
    description: "Apri un job, completa il sopralluogo e prepara il passaggio al preventivo.",
    href: "/jobs",
    cta: "Apri i lavori",
    paths: ["/jobs"]
  },
  {
    id: "owner_estimate",
    title: "4. Invia il preventivo",
    description: "Da qui fai vedere la parte forte: preventivo pronto, invio cliente e follow-up.",
    href: "/estimates",
    cta: "Apri preventivi",
    paths: ["/estimates"]
  },
  {
    id: "owner_margin",
    title: "5. Guarda margine e costi",
    description: "Imposta il team e controlla se le ore stanno lasciando margine vero sul lavoro.",
    href: "/settings/team",
    cta: "Apri team",
    paths: ["/settings/team", "/settings/company", "/"]
  }
];

const WORKER_STEPS: TutorialStep[] = [
  {
    id: "worker_jobs",
    title: "1. Apri i lavori di oggi",
    description: "Qui trovi solo quello che devi fare adesso, senza rumore.",
    href: "/jobs",
    cta: "Apri i lavori",
    paths: ["/jobs"]
  },
  {
    id: "worker_calendar",
    title: "2. Controlla il calendario",
    description: "Guarda orario, cliente e prossimo appuntamento prima di partire.",
    href: "/calendar",
    cta: "Apri calendario",
    paths: ["/calendar"]
  },
  {
    id: "worker_hours",
    title: "3. Registra ore e stato",
    description: "Dentro il job aggiorni stato, note e ore lavorate in pochi tap.",
    href: "/jobs",
    cta: "Torna ai lavori",
    paths: ["/jobs"]
  }
];

function getStorageKey(role: UserRole) {
  return role === UserRole.WORKER ? "schedio_tutorial_worker_v1" : "schedio_tutorial_owner_v1";
}

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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

  if (!hydrated || state.dismissed) {
    return null;
  }

  const completedSet = new Set(state.completedIds);
  const currentStep =
    steps[state.currentIndex] ??
    steps.find((step) => !completedSet.has(step.id)) ??
    steps[steps.length - 1];
  const currentIndex = steps.findIndex((step) => step.id === currentStep.id);
  const completedCount = steps.filter((step) => completedSet.has(step.id)).length;
  const isCurrentComplete = completedSet.has(currentStep.id);
  const isOnCurrentStepPage = matchesPath(pathname, currentStep.paths);
  const allCompleted = completedCount === steps.length;

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

  return (
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
                : "Ti porto nelle schermate giuste per capire subito dove senti il valore del prodotto."}
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
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              {isOnCurrentStepPage ? "Sei nella schermata giusta" : "Prossima schermata"}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <ButtonLink href={currentStep.href} size="md" className="w-full sm:w-auto">
                {isOnCurrentStepPage ? "Rimani qui" : currentStep.cta}
              </ButtonLink>
              <Button
                onClick={markCurrentStepDone}
                variant={isOnCurrentStepPage ? "primary" : "secondary"}
                size="md"
                className="w-full sm:w-auto"
              >
                {isCurrentComplete ? "Vai al prossimo step" : "Segna come fatto"}
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
  );
}
