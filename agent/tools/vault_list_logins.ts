import { defineTool, toolOutput } from "eve/tools";
import { z } from "zod";

import { onePasswordVault } from "../../server/browser/vault/onepassword.js";

export default defineTool({
  description:
    "List safe 1Password Login metadata and opaque vault and item IDs. No secret values are returned. Choose only an item whose allowedHosts contains the current page host.",
  inputSchema: z.object({}),
  async execute() {
    return { items: await onePasswordVault.list() };
  },
  toModelOutput(output) {
    return toolOutput.json(output);
  },
});
