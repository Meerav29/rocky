import { describe, expect, it } from "vitest";

import { parseTaskHistory } from "../src/task-history";

describe("task history", () => {
  it("rejects invalid stored data", () => {
    expect(parseTaskHistory("not json")).toEqual([]);
    expect(parseTaskHistory(JSON.stringify([{ sessionId: "a" }]))).toEqual([]);
  });
});
