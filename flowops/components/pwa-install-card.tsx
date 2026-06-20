"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "schedio_pwa_install_dismissed";

export function PwaInstallCard() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const dismissedValue = window.localStorage.getItem(DISMISS_KEY) === "true";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS standalone
      window.navigator.standalone === true;

    setDismissed(dismissedValue);
    setStandalone(isStandalone);

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setDismissed(dismissedValue);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (standalone || dismissed) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-primary-200 bg-primary-50 p-3 shadow-soft sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-900">Usa Schedio come app sul telefono</p>
          <p className="mt-1 text-sm text-primary-800">
            Aggiungila alla schermata Home per aprirla piu in fretta ogni mattina.
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-row">
          {installEvent ? (
            <Button
              size="md"
              className="w-full sm:w-auto"
              onClick={async () => {
                await installEvent.prompt();
                const choice = await installEvent.userChoice;
                if (choice.outcome === "accepted") {
                  setInstallEvent(null);
                }
              }}
            >
              Installa app
            </Button>
          ) : (
            <div className="rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm text-primary-900">
              Su iPhone: Condividi - Aggiungi a Home
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, "true");
              setDismissed(true);
            }}
            className="rounded-xl px-4 py-3 text-sm font-medium text-primary-800 transition hover:bg-primary-100"
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
}
