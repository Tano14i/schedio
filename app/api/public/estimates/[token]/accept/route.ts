import { jsonUpdated } from "@/lib/api";
import { acceptEstimate } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const item = await acceptEstimate(token);
  return jsonUpdated({
    message: "Preventivo accettato.",
    item,
    nextStep: "Conferma il prossimo passo con il cliente"
  });
}
