import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getAutomationsPageData, runAutomationSuite } from "@/lib/automations-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const data = await getAutomationsPageData();
  return jsonOk(data);
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const result = await runAutomationSuite();
  return jsonCreated({
    message: "Runner automazioni completato.",
    item: result
  });
}
