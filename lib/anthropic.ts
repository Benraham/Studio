import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const MODEL = "claude-sonnet-4-6";

/**
 * Strip a possible ```json ... ``` fence and parse JSON.
 * Throws on bad JSON.
 */
export function parseJsonFromText<T>(text: string): T {
  let trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    trimmed = trimmed.trim();
  }
  // Some models wrap JSON in stray prose — try to find the first { or [
  const firstBrace = trimmed.search(/[\[{]/);
  if (firstBrace > 0) {
    trimmed = trimmed.slice(firstBrace);
  }
  // Trim trailing prose after the matching close
  const lastClose = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
  if (lastClose > 0 && lastClose < trimmed.length - 1) {
    trimmed = trimmed.slice(0, lastClose + 1);
  }
  return JSON.parse(trimmed) as T;
}

/**
 * Single-shot call that expects JSON output.
 */
export async function callJson<T>(opts: {
  system: string;
  userPrompt: string;
  maxTokens?: number;
  cacheSystem?: boolean;
}): Promise<T> {
  const a = getAnthropic();
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: opts.system,
      ...(opts.cacheSystem ? { cache_control: { type: "ephemeral" } } : {}),
    },
  ];
  const res = await a.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemBlocks,
    messages: [{ role: "user", content: opts.userPrompt }],
  });
  const textBlock = res.content.find((c) => c.type === "text") as
    | Anthropic.TextBlock
    | undefined;
  if (!textBlock) {
    throw new Error("Model returned no text content");
  }
  return parseJsonFromText<T>(textBlock.text);
}
