import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { TeamSettingsWorkspace } from "@/components/team-settings-workspace";
import { getCurrentSession, isOwner } from "@/lib/auth";
import { getTeamPageData } from "@/lib/team-server";

export default async function TeamSettingsPage() {
  const session = await getCurrentSession();

  if (!session || !isOwner(session.user.role)) {
    return (
      <AppShell pathname="/settings/team">
        <SectionCard title="Accesso limitato">
          <p className="text-sm text-neutral-600">
            Solo il titolare puo modificare il costo orario del team.
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  try {
    const { users } = await getTeamPageData(session.user.companyId);

    return (
      <AppShell pathname="/settings/team">
        <TeamSettingsWorkspace
          initialMembers={users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.toLowerCase() as "owner" | "worker",
            hourlyCost: user.hourlyCost ?? undefined
          }))}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/settings/team">
        <SectionCard title="Team non disponibile">
          <p className="text-sm text-neutral-600">
            Impossibile caricare il team dal database. Riprova tra poco.
          </p>
        </SectionCard>
      </AppShell>
    );
  }
}
