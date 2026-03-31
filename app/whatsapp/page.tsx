import { AppShell } from "@/components/app-shell";
import { WhatsAppAdminPanel, type WhatsAppAdminItem } from "@/components/whatsapp-admin-panel";
import { getWhatsAppAdminItems } from "@/lib/whatsapp-admin";
import { getWhatsAppConnectionStatus } from "@/lib/whatsapp-config";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; thread?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  let items: WhatsAppAdminItem[] = [];
  let notice: string | undefined;
  const connection = getWhatsAppConnectionStatus();

  try {
    items = await getWhatsAppAdminItems();
  } catch {
    notice = "Non riesco a leggere i thread WhatsApp dal database. Controlla connessione e webhook.";
  }

  return (
    <AppShell pathname="/whatsapp">
      <WhatsAppAdminPanel
        items={items}
        initialOpen={resolvedSearchParams.action === "intake"}
        initialSelectedId={resolvedSearchParams.thread}
        notice={notice}
        connection={connection}
      />
    </AppShell>
  );
}
