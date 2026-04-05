function extensionFromMimeType(mimeType?: string | null) {
  switch ((mimeType ?? "").toLowerCase()) {
    case "audio/ogg":
    case "audio/ogg; codecs=opus":
      return "ogg";
    case "audio/mpeg":
      return "mp3";
    case "audio/mp4":
    case "audio/aac":
      return "m4a";
    case "audio/wav":
    case "audio/x-wav":
      return "wav";
    case "audio/webm":
      return "webm";
    default:
      return "bin";
  }
}

export async function transcribeAudioFromUrl(input: {
  downloadUrl: string;
  mimeType?: string | null;
  fileId?: string | null;
  accessToken?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !input.downloadUrl) {
    return null;
  }

  const audioResponse = await fetch(input.downloadUrl, {
    headers: input.accessToken
      ? {
          Authorization: `Bearer ${input.accessToken}`
        }
      : undefined,
    cache: "no-store"
  });

  if (!audioResponse.ok) {
    return null;
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const mimeType = input.mimeType?.trim() || "application/octet-stream";
  const extension = extensionFromMimeType(mimeType);
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });

  formData.append(
    "file",
    blob,
    `${input.fileId?.trim() || "voice-note"}.${extension}`
  );
  formData.append(
    "model",
    process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe"
  );
  formData.append(
    "prompt",
    "Trascrivi una nota vocale WhatsApp in italiano per un software per artigiani. Restituisci solo il testo utile."
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData,
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { text?: string };
  const text = payload.text?.trim();
  return text || null;
}
