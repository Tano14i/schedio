import { jsonCreated } from "@/lib/api";
import { confirmCustomerSlot } from "@/lib/whatsapp-server";

export async function POST(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const job = await confirmCustomerSlot(token);

  return jsonCreated({
    message: "Il cliente ha confermato lo slot. Job creato.",
    item: job
  });
}
