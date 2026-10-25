import { beforeEach, describe, expect, it, vi } from "vitest";

import vaultLogin from "../../agent/tools/vault_login";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  secureLogin: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("../../server/browser/vault/onepassword.js", () => ({
  onePasswordVault: { login: mocks.login },
}));
vi.mock("../../agent/lib/task-state", () => ({
  taskState: { update: mocks.updateTask },
}));
vi.mock("../../agent/lib/browser-runtime", () => ({
  runCancelableBrowserWork: async (
    _sessionId: string,
    signal: AbortSignal,
    operation: () => Promise<unknown>,
  ) => {
    signal.throwIfAborted();
    return operation();
  },
  runBrowserOperation: async (
    _sessionId: string,
    operation: (browser: { secureLogin: typeof mocks.secureLogin }) => Promise<unknown>,
  ) => ({ result: await operation({ secureLogin: mocks.secureLogin }), workbench: {} }),
}));

const input = {
  itemId: "login-item",
  vaultId: "permitted-vault",
  usernameTarget: "#username",
  passwordTarget: "#password",
  submitTarget: "#submit",
  successTarget: "#account",
  totpFlow: "same_form" as const,
};
const credentials = {
  username: "fixture-private-user",
  password: "fixture-private-password",
  allowedHosts: ["shop.example"],
};
const context = (signal = new AbortController().signal) => ({
  session: { id: "vault-tool-test" }, abortSignal: signal,
});

describe("1Password login tool boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockResolvedValue(credentials);
    mocks.secureLogin.mockResolvedValue({ status: "complete", host: "shop.example" });
  });

  it("keeps credentials inside the browser operation", async () => {
    const output = await vaultLogin.execute(input, context() as never);
    expect(mocks.login).toHaveBeenCalledExactlyOnceWith(input.vaultId, input.itemId);
    expect(mocks.secureLogin).toHaveBeenCalledWith(expect.objectContaining(credentials));
    for (const secret of [credentials.username, credentials.password]) {
      expect(JSON.stringify(output)).not.toContain(secret);
    }
  });

  it("does not fill credentials when cancelled during 1Password authorization", async () => {
    const controller = new AbortController();
    mocks.login.mockImplementation(async () => {
      controller.abort();
      return credentials;
    });
    await expect(vaultLogin.execute(input, context(controller.signal) as never))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(mocks.secureLogin).not.toHaveBeenCalled();
  });

  it("preserves the browser runtime's CAPTCHA wait state", async () => {
    mocks.secureLogin.mockResolvedValue({ status: "waiting_for_user", reason: "captcha" });
    await vaultLogin.execute(input, context() as never);
    expect(mocks.updateTask).not.toHaveBeenCalled();
  });

  it("records an unavailable OTP as waiting for the user", async () => {
    mocks.secureLogin.mockResolvedValue({ status: "waiting_for_user", host: "shop.example" });
    await vaultLogin.execute(input, context() as never);
    const update = mocks.updateTask.mock.calls[0][0];
    expect(update({})).toMatchObject({ status: "waiting_for_user", waitReason: "otp" });
  });
});
