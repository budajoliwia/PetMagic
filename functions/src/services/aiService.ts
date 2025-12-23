import OpenAI, { toFile } from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  if (!client) {
    client = new OpenAI({ apiKey: openAiApiKey });
  }
  return client;
}

export interface RunStyleModelParams {
  jobId: string;
  userId: string;
  style: string;
  type: "sticker" | "image";
}

export async function runStyleModel({
  jobId,
  userId,
  style,
  type,
}: RunStyleModelParams): Promise<string> {
  const prompt = `You are defining a concise visual brief for a pet illustration job.
Job: ${jobId}
User: ${userId}
Mode: ${type === "sticker" ? "Sticker (transparent background PNG)" : "Image (wallpaper style)"}
Requested style: ${style}

Write a single short line describing how the final creature looks, including pose and mood.
If mode is Sticker, it should clearly state transparent background PNG.`;

  const response = await getClient().responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  // Najprościej i bez walki z typami:
  return (response.output_text ?? "Stylized art generated.").trim();
}

export interface GenerateImageParams {
  type: "sticker" | "image";
  style: string;
  inputImage: Buffer;
}

function buildStylePrompt(type: "sticker" | "image", style: string) {
  const base =
    type === "sticker"
      ? "Create a high-quality sticker of the pet with a transparent background PNG, clean cutout, crisp edges, no text, no watermark."
      : "Create a high-quality illustration of the pet.";

  const styleHint = (() => {
    const s = style.toLowerCase();
    if (s.includes("kawaii plush") || s.includes("kawii plush")) {
      return "Style: kawaii plush, cute pet illustration, plush toy look, soft rounded shapes, pastel colors, big expressive eyes, simple details.";
    }
    if (s.includes("kawaii")) return "Style: kawaii, anime style, cute but not too childish, soft shapes, .";
    if (s.includes("line")) return "Style: minimal line art, clean contours, monochrome lines.";
    if (s.includes("cartoon")) return "Style: cartoon, bold outlines, saturated colors.";
    return `Style: ${style}.`;
  })();

  const bg = type === "sticker" ? "Background: transparent." : "Background: simple, clean.";

  return `${base}\n${styleHint}\n${bg}\nAvoid text or watermarks.`;
}

export async function generateImageFromInput({
  type,
  style,
  inputImage,
}: GenerateImageParams): Promise<Buffer> {
  const prompt = buildStylePrompt(type, style);

  // gpt-image-1 image-to-image is supported via the Images Edit API (not Responses API).
  const imageFile = await toFile(inputImage, "input.png", { type: "image/png" });

  const response = await getClient().images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: "1024x1024",
    output_format: "png",
    background: type === "sticker" ? "transparent" : "auto",
    input_fidelity: "high",
    quality: "high",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image generation failed: empty response");
  }
  return Buffer.from(b64, "base64");
}

