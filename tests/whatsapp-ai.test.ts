import assert from "node:assert/strict";
import {
  collectInboundIntakeText,
  isAudioMimeType,
  isImageMimeType,
  shouldUseMessageForAiIntake
} from "@/lib/whatsapp-ai";

{
  assert.equal(isAudioMimeType("audio/ogg"), true);
  assert.equal(isAudioMimeType("image/jpeg"), false);
  assert.equal(isImageMimeType("image/jpeg"), true);
  assert.equal(isImageMimeType("audio/ogg"), false);
}

{
  const messages = [
    {
      direction: "INBOUND" as const,
      messageType: "TEXT" as const,
      textBody: "Ciao, tapparella bloccata in via Verdi 12",
      mimeType: null
    },
    {
      direction: "INBOUND" as const,
      messageType: "DOCUMENT" as const,
      textBody: "Posso solo dopo le 17, mandami pure il preventivo",
      mimeType: "audio/ogg"
    },
    {
      direction: "OUTBOUND" as const,
      messageType: "TEXT" as const,
      textBody: "Ricevuto",
      mimeType: null
    },
    {
      direction: "INBOUND" as const,
      messageType: "IMAGE" as const,
      textBody: "Misure 120x240 e nota: cambiare cerniere",
      mimeType: "image/jpeg"
    }
  ];

  assert.equal(shouldUseMessageForAiIntake(messages[0]), true);
  assert.equal(shouldUseMessageForAiIntake(messages[1]), true);
  assert.equal(shouldUseMessageForAiIntake(messages[2]), false);
  assert.equal(shouldUseMessageForAiIntake(messages[3]), true);
  assert.equal(
    collectInboundIntakeText(messages),
    "Ciao, tapparella bloccata in via Verdi 12\nPosso solo dopo le 17, mandami pure il preventivo\nMisure 120x240 e nota: cambiare cerniere"
  );
}

console.log("whatsapp ai tests passed");
