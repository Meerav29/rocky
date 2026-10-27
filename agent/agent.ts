import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const provider = process.env.BELL_PROVIDER || "anthropic";
const model = provider === "openai"
  ? openai.responses(process.env.BELL_MODEL || "gpt-5.6-sol")
  : anthropic(process.env.BELL_MODEL || "claude-opus-5-5");

export default defineAgent({
  model,
  build: {
    externalDependencies: [
      "@browserbasehq/sdk",
      "@browserbasehq/stagehand",
      "playwright-core",
    ],
  },
  limits: { sessionTimeoutMs: 24 * 60 * 60 * 1_000 },
});
