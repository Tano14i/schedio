import { WhatsAppMessageStatus, WhatsAppMessageType } from "@prisma/client";
import { Resend } from "resend";
import {
  buildFromAddress,
  buildWhatsAppLink,
  renderEmailHtml,
  type ChannelStatus,
  type DeliveryResult
} from "@/lib/message-format";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { isWhatsAppNumberOwner, persistOutboundMessage } from "@/lib/whatsapp-server";

export type { ChannelStatus, DeliveryResult } from "@/lib/message-format";

export type DeliveryInput = {
  company: { id: string; name: string; email: string | null; country: string };
  customer: { fullName: string; email: string | null; phone: string | null };
  thread?: { id: string; contactId: string; contact: { waId: string } } | null;
  subject: string;
  text: string;
  /** Canali automatici da usare (default: entrambi). */
  channels?: Array<"email" | "whatsapp">;
};

async function sendEmail(input: DeliveryInput, notes: string[]): Promise<ChannelStatus> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (!input.customer.email) {
    notes.push("Il cliente non ha un indirizzo email.");
    return "skipped";
  }
  if (!apiKey || !emailFrom) {
    notes.push("Email non configurata (RESEND_API_KEY / EMAIL_FROM).");
    return "skipped";
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: buildFromAddress(emailFrom, input.company.name),
      to: input.customer.email,
      replyTo: input.company.email ?? undefined,
      subject: input.subject,
      text: input.text,
      html: renderEmailHtml({ text: input.text, companyName: input.company.name })
    });

    if (error) {
      notes.push(`Email non inviata: ${error.message}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    notes.push(`Email non inviata: ${error instanceof Error ? error.message : "errore sconosciuto"}`);
    return "failed";
  }
}

async function sendWhatsApp(input: DeliveryInput, notes: string[]): Promise<ChannelStatus> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!input.thread || !accessToken || !phoneNumberId) {
    return "skipped";
  }
  if (!(await isWhatsAppNumberOwner(input.company.id))) {
    return "skipped";
  }

  let ok = false;
  let metaMessageId: string | undefined;
  let errorMessage: string | undefined;

  try {
    const response = await sendWhatsAppTextMessage({
      accessToken,
      phoneNumberId,
      to: input.thread.contact.waId,
      body: input.text
    });
    const result = (await response.json().catch(() => null)) as
      | { messages?: Array<{ id?: string }>; error?: { message?: string } }
      | null;
    ok = response.ok;
    metaMessageId = result?.messages?.[0]?.id;
    errorMessage = result?.error?.message;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "errore sconosciuto";
  }

  await persistOutboundMessage({
    companyId: input.company.id,
    contactId: input.thread.contactId,
    threadId: input.thread.id,
    metaMessageId,
    type: WhatsAppMessageType.TEXT,
    textBody: input.text,
    status: ok ? WhatsAppMessageStatus.SENT : WhatsAppMessageStatus.FAILED
  });

  if (!ok) {
    // Fuori dalla finestra di 24 ore Meta accetta solo template approvati.
    notes.push(`WhatsApp non inviato: ${errorMessage ?? "risposta non valida"}`);
    return "failed";
  }
  return "sent";
}

/**
 * Consegna un messaggio al cliente sui canali disponibili (email e, se il
 * numero e' dell'azienda, WhatsApp Cloud API) e prepara sempre il link wa.me
 * per l'invio manuale.
 */
export async function deliverToCustomer(input: DeliveryInput): Promise<DeliveryResult> {
  const notes: string[] = [];
  const channels = input.channels ?? ["email", "whatsapp"];
  const [email, whatsapp] = await Promise.all([
    channels.includes("email") ? sendEmail(input, notes) : Promise.resolve<ChannelStatus>("skipped"),
    channels.includes("whatsapp") ? sendWhatsApp(input, notes) : Promise.resolve<ChannelStatus>("skipped")
  ]);

  return {
    email,
    whatsapp,
    whatsappLink: buildWhatsAppLink(input.customer.phone, input.text, input.company.country),
    delivered: email === "sent" || whatsapp === "sent",
    notes
  };
}

/** Testo da salvare come errore quando nessun canale automatico ha funzionato. */
export function describeUndelivered(result: DeliveryResult) {
  return result.notes.join(" ") || "Nessun canale disponibile per il cliente.";
}
