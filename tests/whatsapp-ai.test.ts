import assert from "node:assert/strict";
import { collectInboundIntakeText, isAudioMimeType, shouldUseMessageForAiIntake } from "@/lib/whatsapp-ai";

{
  assert.equal(isAudioMimeType("audio/ogg"), true);
  assert.equal(isAudioMimeType("image/jpeg"), false);
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
    }
  ];

  assert.equal(shouldUseMessageForAiIntake(messages[0]), true);
  assert.equal(shouldUseMessageForAiIntake(messages[1]), true);
  assert.equal(shouldUseMessageForAiIntake(messages[2]), false);
  assert.equal(
    collectInboundIntakeText(messages),
    "Ciao, tapparella bloccata in via Verdi 12\nPosso solo dopo le 17, mandami pure il preventivo"
  );
}

console.log("whatsapp ai tests passed");
