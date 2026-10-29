import { jsonUpdated } from "@/lib/api";
import { resolveRunnerScope } from "@/lib/internal-runner";
import { sendDueReviewRequests } from "@/lib/invoices-server";

async function run(request: Request) {
  const scope = await resolveRunnerScope(request);
  if (scope instanceof Response) return scope;

  const sent = await sendDueReviewRequests(scope.companyId);
  return jsonUpdated({
    message: "Review request elaborate.",
    sent
  });
}

export const GET = run;
export const POST = run;
