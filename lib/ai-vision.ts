function toBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

export async function extractTextFromImageUrl(input: {
  downloadUrl: string;
  mimeType?: string | null;
  accessToken?: string | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !input.downloadUrl) {
    return null;
  }

  const imageResponse = await fetch(input.downloadUrl, {
    headers: input.accessToken
      ? {
          Authorization: `Bearer ${input.accessToken}`
        }
      : undefined,
    cache: "no-store"
  });

  if (!imageResponse.ok) {
    return null;
  }

  const mimeType = input.mimeType?.trim() || "image/jpeg";
  const imageBuffer = await imageResponse.arrayBuffer();
  const dataUrl = `data:${mimeType};base64,${toBase64(imageBuffer)}`;
  const model = process.env.OPENAI_VISION_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Read text or useful job details from an image sent by a customer to a handyman business. Return only the useful extracted text in Italian. If there is no readable text, return a short factual description of the visible issue."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Estrai testo utile, misure, indirizzi, materiali o dettagli di lavoro da questa immagine."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() || null;
}
