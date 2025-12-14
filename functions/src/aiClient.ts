import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable.");
}

const client = new OpenAI({ apiKey: openAiApiKey });

export interface RunStyleModelParams {
  jobId: string;
  userId: string;
  style: string;
}

export async function runStyleModel({
  jobId,
  userId,
  style,
}: RunStyleModelParams): Promise<string> {
  const prompt = `You are producing a short textual description for a pet illustration job.
Job: ${jobId}
User: ${userId}
Requested style: ${style}

Write a single short line describing how the final creature looks.`;

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });

  // Najprościej i bez walki z typami:
  return (response.output_text ?? "Stylized art generated.").trim();
}
