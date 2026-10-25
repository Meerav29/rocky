import { defineTool, toolOutput } from "eve/tools";
import { z } from "zod";

import { onePasswordVault } from "../../server/browser/vault/onepassword.js";
import { runBrowserOperation, runCancelableBrowserWork } from "../lib/browser-runtime";
import { taskState } from "../lib/task-state";

const selector = z.string().min(1).max(500);
export default defineTool({
  description:
    "Fill and submit a 1Password Login without exposing credentials to the model. Navigate and snapshot first. Pass its vault and item IDs plus exact CSS selectors in the main page. A successTarget is required to prove login. If this returns waiting_for_user, call human_handoff with reason otp (or captcha for a CAPTCHA challenge), share the returned handoff URL, and end the turn until the user replies done.",
  inputSchema: z.object({
    itemId: z.string().min(1),
    vaultId: z.string().min(1),
    usernameTarget: selector,
    passwordTarget: selector,
    submitTarget: selector,
    successTarget: selector,
    totpTarget: selector.optional(),
    otpSubmitTarget: selector.optional(),
    totpFlow: z.enum(["same_form", "after_submit"]).default("same_form"),
  }),
  async execute(input, ctx) {
    const output = await runCancelableBrowserWork(ctx.session.id, ctx.abortSignal, () =>
      runBrowserOperation(ctx.session.id, async (browser) => {
        const login = await onePasswordVault.login(input.vaultId, input.itemId);
        ctx.abortSignal.throwIfAborted();
        return browser.secureLogin({
          ...login,
          usernameTarget: input.usernameTarget,
          passwordTarget: input.passwordTarget,
          submitTarget: input.submitTarget,
          successTarget: input.successTarget,
          totpTarget: input.totpTarget,
          otpSubmitTarget: input.otpSubmitTarget,
          totpAfterSubmit: input.totpFlow === "after_submit",
        });
      }),
    );
    if (
      output.result.status === "waiting_for_user" &&
      !("reason" in output.result && output.result.reason === "captcha")
    )
      taskState.update((current) => ({
        ...current,
        status: "waiting_for_user",
        activeStep: "waiting for OTP or human challenge",
        waitReason: "otp",
        updatedAt: new Date().toISOString(),
      }));
    return output;
  },
  toModelOutput(output) {
    return toolOutput.json(output.result);
  },
});
