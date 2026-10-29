import { jsonUpdated } from "@/lib/api";
import { resolveRunnerScope } from "@/lib/internal-runner";
import { sendDueInvoiceReminders } from "@/lib/invoices-server";

async function run(request: Request) {
  const scope = await resolveRunnerScope(request);
  if (scope instanceof Response) return scope;

  const sent = await sendDueInvoiceReminders(scope.companyId);
  return jsonUpdated({
    message: "Reminder fatture elaborati.",
    sent
  });
}

export const GET = run;
export const POST = run;
