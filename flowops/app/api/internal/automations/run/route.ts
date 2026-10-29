import { jsonUpdated } from "@/lib/api";
import { resolveRunnerScope } from "@/lib/internal-runner";
import { runAutomationSuite } from "@/lib/automations-server";

async function run(request: Request) {
  const scope = await resolveRunnerScope(request);
  if (scope instanceof Response) return scope;

  const result = await runAutomationSuite(scope.companyId);

  return jsonUpdated({
    message: "Runner automazioni completato.",
    item: result
  });
}

export const GET = run;
export const POST = run;
