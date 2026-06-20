type IntakeMessageLike = {
  direction: "INBOUND" | "OUTBOUND";
  messageType: "TEXT" | "DOCUMENT" | "IMAGE" | "INTERACTIVE_BUTTON" | "INTERACTIVE_LIST" | "TEMPLATE" | "SYSTEM";
  textBody?: string | null;
  mimeType?: string | null;
};

export function isAudioMimeType(mimeType?: string | null) {
  return Boolean(mimeType?.toLowerCase().startsWith("audio/"));
}

export function isImageMimeType(mimeType?: string | null) {
  return Boolean(mimeType?.toLowerCase().startsWith("image/"));
}

export function shouldUseMessageForAiIntake(message: IntakeMessageLike) {
  if (message.direction !== "INBOUND" || !message.textBody?.trim()) {
    return false;
  }

  return (
    message.messageType === "TEXT" ||
    (message.messageType === "DOCUMENT" && isAudioMimeType(message.mimeType)) ||
    (message.messageType === "IMAGE" && Boolean(message.textBody?.trim()))
  );
}

export function collectInboundIntakeText(messages: IntakeMessageLike[]) {
  return messages
    .filter(shouldUseMessageForAiIntake)
    .map((message) => message.textBody?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}
