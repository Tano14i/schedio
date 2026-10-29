import { jsonUpdated } from "@/lib/api";
import { resolveRunnerScope } from "@/lib/internal-runner";
import { sendDueEstimateFollowUps } from "@/lib/estimates-server";

async function run(request: Request) {
  const scope = await resolveRunnerScope(request);
  if (scope instanceof Response) return scope;

  const sent = await sendDueEstimateFollowUps(scope.companyId);
  return jsonUpdated({
    message: "Runner follow-up completato.",
    sent
  });
}

export const GET = run;
export const POST = run;
