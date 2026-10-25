import { update_spend_request } from "@stripe/link-integrations-eve/tools";
import { defineTool } from "eve/tools";
import { freshLinkContext } from "../../../lib/link-auth";
import { linkMetadataRequest, spendRequestMetadata, validateSpendRequestId } from "../lib/spend-requests";

export default defineTool({
  description: "Update a Link spend request and return approval/status metadata only. Bell never retrieves payment credentials; hand checkout to the user.",
  inputSchema: update_spend_request.inputSchema,
  approval: update_spend_request.approval,
  async execute(input, ctx) {
    validateSpendRequestId(input);
    ctx.abortSignal.throwIfAborted();
    return spendRequestMetadata(await linkMetadataRequest(() => update_spend_request.execute(input, freshLinkContext(ctx))));
  },
});
