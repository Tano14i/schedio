"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { formatCurrency } from "@/lib/utils";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "worker";
  hourlyCost?: number;
};

export function TeamSettingsWorkspace({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialMembers.map((member) => [member.id, member.hourlyCost?.toString() ?? ""]))
  );
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  function saveHourlyCost(memberId: string) {
    setFeedback("");
    startTransition(async () => {
      const raw = drafts[memberId] ?? "";
      const hourlyCost = raw.trim() ? Number(raw) : null;

      const response = await fetch(`/api/team/users/${memberId}/hourly-cost`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyCost })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile aggiornare il costo orario.");
        return;
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                hourlyCost: result.item.hourlyCost ?? undefined
              }
            : member
        )
      );
      setFeedback(`Costo orario aggiornato per ${result.item.name}.`);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Imposta il costo orario dei tecnici."
        description="Da qui il titolare decide quanto vale un'ora di lavoro. Schedio usa questo dato per calcolare manodopera e margine."
      />

      <SectionCard title="Costo orario team" subtitle="Un valore semplice, ma fondamentale per capire se i lavori stanno in piedi.">
        <div className="space-y-3">
          {members.map((member, index) => (
            <div key={member.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-base font-semibold text-ink">{member.name}</p>
                  <p className="mt-1 text-sm text-neutral-600">{member.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {member.role === "owner" ? "Responsabile" : "Collaboratore"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_auto] sm:items-end">
                  <label className="block">
                    <span className="text-sm font-medium text-ink">Costo orario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={drafts[member.id] ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [member.id]: event.target.value
                        }))
                      }
                      placeholder="Es. 28"
                    />
                  </label>
                  <Button
                    data-tour={index === 0 ? "team-save-hourly-cost" : undefined}
                    disabled={isPending}
                    className="w-full sm:w-auto"
                    onClick={() => saveHourlyCost(member.id)}
                  >
                    Salva
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                Valore attuale: {member.hourlyCost !== undefined ? formatCurrency(member.hourlyCost) : "non impostato"}
              </div>
            </div>
          ))}
        </div>

        {feedback ? <p className="mt-4 text-sm text-primary-700">{feedback}</p> : null}
      </SectionCard>
    </div>
  );
}
