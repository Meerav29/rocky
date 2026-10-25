import { afterEach, describe, expect, it, vi } from "vitest";
import * as native from "@stripe/link-integrations-eve/tools";
import create from "../agent/extensions/link/tools/create_spend_request";
import retrieve from "../agent/extensions/link/tools/retrieve_spend_request";
import update from "../agent/extensions/link/tools/update_spend_request";
import cancel from "../agent/extensions/link/tools/cancel_spend_request";
import approval from "../agent/extensions/link/tools/request_spend_approval";
import list from "../agent/extensions/link/tools/list_spend_requests";
import disconnect from "../agent/tools/link_disconnect";

const context = { session: { id: "linq-chat-session" }, abortSignal: new AbortController().signal } as never;
const purchase = {
  credential_type: "card" as const, amount: 4200, currency: "usd",
  request_approval: true, test: false,
  merchant_name: "Example", merchant_url: "https://shop.example",
  context: "The user requested this notebook from Example Shop. This amount includes the agreed items, shipping, and taxes.",
};
const metadata = {
  id: "spend_1", status: "approved", amount: 4200, currency: "usd",
  approval_url: "https://link.example/approval", created_at: "2026-10-22T00:00:00Z", updated_at: "2026-10-22T00:00:00Z",
};
const secrets = {
  card: { number: "synthetic-card-number", cvc: "synthetic-cvc" },
  shared_payment_token: { id: "synthetic-shared-token" },
  link_pay_token: "synthetic-link-token",
  future_credential: "synthetic-future-secret",
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("Link payment boundary", () => {
  it("retains spend confirmation and requires confirmation to disconnect", () => {
    expect(create.approval).toBe(native.create_spend_request.approval);
    expect(create.approval).toBeDefined();
    expect(disconnect.approval).toBeDefined();
  });

  it.each([
    ["card"], ["shared_payment_token"], ["link_pay_token"], [], ["future_credential"],
  ])("rejects credential includes before calling Link: %j", async (...include) => {
    const execute = vi.spyOn(native.retrieve_spend_request, "execute");
    await expect(retrieve.execute({ id: "spend_1", include } as never, context)).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });

  it("requests only status and removes unexpected credential fields before returning", async () => {
    const execute = vi.spyOn(native.retrieve_spend_request, "execute")
      .mockResolvedValue({ ...metadata, ...secrets } as never);
    await expect(retrieve.execute({ id: "spend_1" }, context)).resolves.toEqual(metadata);
    expect(execute).toHaveBeenCalledExactlyOnceWith({ id: "spend_1" }, expect.objectContaining(context));
  });

  it("preserves missing requests and approval-required metadata", async () => {
    const nextAction = { type: "contact_support", display_message: "Contact support", action_url: null, resolution: "auto_resume", expires_at: null };
    const status_details = { requires_action: { next_action: nextAction } };
    const execute = vi.spyOn(native.retrieve_spend_request, "execute")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...metadata, status: "requires_action", ...secrets,
        status_details: { ...status_details, ...secrets, requires_action: { next_action: { ...nextAction, ...secrets }, ...secrets } },
      } as never);
    await expect(retrieve.execute({ id: "spend_1" }, context)).resolves.toBeNull();
    await expect(retrieve.execute({ id: "spend_1" }, context)).resolves.toEqual({ ...metadata, status: "requires_action", status_details });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("filters credentials from creation, mutation, approval, and list responses", async () => {
    vi.spyOn(native.create_spend_request, "execute").mockResolvedValue({ ...metadata, ...secrets } as never);
    vi.spyOn(native.update_spend_request, "execute").mockResolvedValue({ ...metadata, ...secrets } as never);
    vi.spyOn(native.cancel_spend_request, "execute").mockResolvedValue({ ...metadata, ...secrets } as never);
    vi.spyOn(native.request_spend_approval, "execute").mockResolvedValue({ ...metadata, ...secrets } as never);
    vi.spyOn(native.list_spend_requests, "execute").mockResolvedValue([{ ...metadata, ...secrets }] as never);
    await expect(create.execute(purchase, context)).resolves.toEqual(metadata);
    await expect(update.execute({ id: "spend_1", amount: 4200 }, context)).resolves.toEqual(metadata);
    await expect(cancel.execute({ id: "spend_1" }, context)).resolves.toEqual(metadata);
    await expect(approval.execute({ id: "spend_1" }, context)).resolves.toEqual({ id: "spend_1", approval_url: metadata.approval_url });
    await expect(list.execute({}, context)).resolves.toEqual([metadata]);
  });

  it("rejects malformed responses without including provider data in the error", async () => {
    vi.spyOn(native.retrieve_spend_request, "execute").mockResolvedValue(secrets as never);
    await expect(retrieve.execute({ id: "spend_1" }, context)).rejects.toThrow("Unexpected Link spend-request response.");
  });

  it.each(["LinkApiError", "LinkResponseError", "LinkTransportError", "LinkConfigurationError"])(
    "withholds provider bodies in %s failures", async (name) => {
      const error = Object.assign(new Error(JSON.stringify(secrets)), { name, status: 400 });
      vi.spyOn(native.retrieve_spend_request, "execute").mockRejectedValue(error);
      await expect(retrieve.execute({ id: "spend_1" }, context)).rejects.toThrow(
        "Link request failed (HTTP 400). Check the existing request before retrying.",
      );
    },
  );

  it("preserves Eve authorization suspension", async () => {
    const signal = { type: "authorization-required", provider: "link" };
    vi.spyOn(native.retrieve_spend_request, "execute").mockRejectedValue(signal);
    await expect(retrieve.execute({ id: "spend_1" }, context)).rejects.toBe(signal);
  });

  it.each([
    "", "spend_1/update_delegated", "../approval_policies/policy_1", "spend_1?include=card#",
    "spend_1#card", "spend_1%3Finclude%3Dcard", "spend_1\\cancel", "a".repeat(256),
  ])("rejects unsafe IDs in every resource-specific wrapper: %s", async (id) => {
    const mocks = [native.retrieve_spend_request, native.update_spend_request, native.cancel_spend_request, native.request_spend_approval]
      .map((tool) => vi.spyOn(tool, "execute"));
    await expect(retrieve.execute({ id }, context)).rejects.toThrow();
    await expect(update.execute({ id, amount: 4200 }, context)).rejects.toThrow();
    await expect(cancel.execute({ id }, context)).rejects.toThrow();
    await expect(approval.execute({ id }, context)).rejects.toThrow();
    for (const execute of mocks) expect(execute).not.toHaveBeenCalled();
  });

  it("does not start spend requests after a turn was cancelled", async () => {
    const execute = vi.spyOn(native.create_spend_request, "execute");
    const aborted = { abortSignal: AbortSignal.abort() } as never;
    await expect(create.execute(purchase, aborted)).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
});
