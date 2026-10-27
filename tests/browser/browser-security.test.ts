import { afterEach, describe, expect, it, vi } from "vitest";

import { BrowserSession } from "../../server/browser/browser-session";
import type { ConversationState } from "../../server/browser/types";

function fixture() {
  const state: ConversationState = {
    id: "browser-security-test",
    traces: [],
    browser: { provider: "not-started", status: "idle" },
  };
  const session = new BrowserSession(state);
  let url = "https://shop.example/login";
  const fill = vi.fn<(target: string, value: string) => Promise<void>>().mockResolvedValue();
  const click = vi.fn<(target: string) => Promise<void>>().mockResolvedValue();
  const page = {
    url: async () => url,
    title: async () => "Test shop",
    goto: vi.fn(async (next: string) => { url = next; }),
    waitForLoadState: vi.fn(async () => {}),
    waitForTimeout: vi.fn(async () => {}),
    locator: (target: string) => ({
      fill: (value: string) => fill(target, value),
      click: () => click(target),
      count: async () => 1,
    }),
  };
  const batch = vi.fn(async <T, A>(
    callback: (context: { page: typeof page }, args: A) => Promise<T>,
    args: A,
  ) => callback({ page }, args));
  const start = vi.spyOn(session, "start").mockResolvedValue();
  vi.spyOn(session as unknown as { gateCaptcha(): Promise<void> }, "gateCaptcha")
    .mockResolvedValue();
  Object.assign(session, {
    stagehand: { experimentalBatch: batch },
    browserbase: {},
  });
  return { session, state, start, batch, page, fill, click, setUrl: (next: string) => { url = next; } };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("browser navigation boundary", () => {
  it("fills the original values without retaining them in traces", async () => {
    const { session, state, fill } = fixture();
    const values = ["synthetic-credential-2b87e", "4242424242424242"];
    await session.run(values.map((value, i) => ({ action: "fill", target: `#field-${i}`, value })));
    for (const [i, value] of values.entries()) {
      expect(fill).toHaveBeenCalledWith(`#field-${i}`, value);
      expect(JSON.stringify(state.traces)).not.toContain(value);
    }
    expect(state.traces.find(trace => trace.name === "run")?.detail).toMatchObject({
      actions: values.map((_, i) => ({ action: "fill", target: `#field-${i}`, value: "[value hidden]" })),
    });
  });

  it("rejects operations queued behind a browser that has been closed", async () => {
    const { session, batch } = fixture();
    Object.assign(session, { stagehand: { experimentalBatch: batch, close: vi.fn(async () => {}) } });
    let resume!: () => void;
    const gate = new Promise<void>(resolve => { resume = resolve; });
    batch.mockImplementationOnce(async () => { await gate; return { url: "https://shop.example", title: "Fixture" }; });
    const first = session.run([{ action: "fill", target: "#first", value: "one" }]);
    await vi.waitFor(() => expect(batch).toHaveBeenCalledOnce());
    const second = session.run([{ action: "fill", target: "#second", value: "two" }]);
    const rejected = expect(second).rejects.toMatchObject({ name: "AbortError" });
    await session.close();
    resume();
    await first;
    await rejected;
    await expect(session.run([{ action: "wait", milliseconds: 1 }])).rejects.toMatchObject({ name: "AbortError" });
    expect(batch).toHaveBeenCalledOnce();
  });
  it.each([
    "file:///tmp/bell-synthetic-fixture",
    "javascript:alert(1)",
    "data:text/html,example",
    "https://user:password@shop.example/",
  ])("rejects unsafe navigation before starting a browser: %s", async (url) => {
    const { session, start, batch } = fixture();
    await expect(session.run([{ action: "goto", url }])).rejects.toThrow();
    expect(start).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });

  it("validates the whole batch before executing an earlier action", async () => {
    const { session, batch } = fixture();
    await expect(session.run([
      { action: "goto", url: "https://shop.example/" },
      { action: "goto", url: "file:///tmp/bell-synthetic-fixture" },
    ])).rejects.toThrow();
    expect(batch).not.toHaveBeenCalled();
  });

  it("does not let a loopback URL override the configured browser provider", async () => {
    vi.stubEnv("STAGEHAND_BROWSER", "browserbase");
    const { session, start, page } = fixture();
    await session.run([{ action: "goto", url: "http://127.0.0.1:4318/" }]);
    expect(start).toHaveBeenCalledWith();
    expect(page.goto).toHaveBeenCalledWith("http://127.0.0.1:4318/");
  });
});
