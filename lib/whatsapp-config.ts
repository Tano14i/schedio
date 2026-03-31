import { getAppUrl } from "@/lib/app-url";

export type WhatsAppConnectionStatus = {
  webhookUrl: string;
  graphVersion: string;
  verifyTokenConfigured: boolean;
  accessTokenConfigured: boolean;
  phoneNumberIdConfigured: boolean;
  cloudApiReady: boolean;
};

export function getWhatsAppConnectionStatus(): WhatsAppConnectionStatus {
  const webhookUrl = `${getAppUrl()}/api/whatsapp/webhook`;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v22.0";
  const verifyTokenConfigured = Boolean(process.env.WHATSAPP_VERIFY_TOKEN?.trim());
  const accessTokenConfigured = Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim());
  const phoneNumberIdConfigured = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());

  return {
    webhookUrl,
    graphVersion,
    verifyTokenConfigured,
    accessTokenConfigured,
    phoneNumberIdConfigured,
    cloudApiReady: accessTokenConfigured && phoneNumberIdConfigured
  };
}
