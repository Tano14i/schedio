import { jsonUpdated } from "@/lib/api";
import { runAutomationSuite } from "@/lib/automations-server";

export async function POST() {
  const result = await runAutomationSuite();

  return jsonUpdated({
    message: "Runner automazioni completato.",
    item: result
  });
}
