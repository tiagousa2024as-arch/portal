import Anthropic from "@anthropic-ai/sdk";

export function claudeModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
}

export function claudeClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}
