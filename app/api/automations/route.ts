import { jsonCreated, jsonOk } from "@/lib/api";
import { getAutomationsPageData, runAutomationSuite } from "@/lib/automations-server";

export async function GET() {
  const data = await getAutomationsPageData();
  return jsonOk(data);
}

export async function POST() {
  const result = await runAutomationSuite();
  return jsonCreated({
    message: "Runner automazioni completato.",
    item: result
  });
}
