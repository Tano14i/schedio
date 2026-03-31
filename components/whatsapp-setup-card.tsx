"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import { SectionCard } from "@/components/section-card";
import type { WhatsAppConnectionStatus } from "@/lib/whatsapp-config";

export function WhatsAppSetupCard({ connection }: { connection: WhatsAppConnectionStatus }) {
  const [isPending, startTransition] = useTransition();
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Ciao, questo e un messaggio di prova inviato da Schedio."
  );
  const [feedback, setFeedback] = useState("");

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

  return (
    <div id="whatsapp">
      <SectionCard
        title="Setup WhatsApp Cloud API"
        subtitle="Configurazione tecnica da fare una volta sola: webhook, token e invio test."
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
                Completa access token e phone number ID per attivare l&apos;invio reale.
              </p>
            ) : (
              <p className="text-sm text-neutral-600">
                Per il primo test Meta usa prima <span className="font-medium">hello_world</span>.
                Il testo libero funziona meglio dentro la finestra 24h.
              </p>
            )}
            {feedback ? (
              <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                {feedback}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </SectionCard>
    </div>
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
