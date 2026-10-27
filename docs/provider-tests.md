# Provider regression checks

Run `pnpm check` for the normal credential-free checks. Live provider tests are
opt-in and use real service resources. Keep credentials in ignored environment files.
Browserbase must use `verified: true` and managed proxies, including after launch retries.

## Saved Browserbase Context

With the Browserbase environment loaded, run:

```sh
BELL_LIVE_CONTEXT=1 STAGEHAND_BROWSER=browserbase pnpm exec vitest run tests/browser/context-save-real.test.ts
```

This writes a synthetic example.com cookie, releases the writer, starts a reader with the
same Context, and checks the restored cookie. It then releases both browsers and deletes the
temporary Context. Cleanup failures must fail the check rather than silently leaving resources.
