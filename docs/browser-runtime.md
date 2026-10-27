# Browser runtime

Bell's Eve by Vercel agent owns conversation history and tool execution. Browser tools share one in-process
Stagehand runtime per Eve session. Follow-up turns reuse the browser; saved Browserbase session
metadata supports reconnecting after a worker restart. Hosted launches request managed proxies,
Verified Browsers, and keep-alive on every attempt, including retries.

`snapshot` reads page text and short-lived targets, `run` performs typed browser actions, and
`screenshot` captures the page for Bell's viewer. Navigation accepts HTTP and HTTPS URLs without
embedded credentials. A destination URL cannot change the browser provider. Local fixtures
require `STAGEHAND_BROWSER=local`.

## Configuration

Copy the root [`.env.example`](../.env.example) for Bell and integration settings.
Hosted browser sessions always disable network logging and recording.

| Variable | Purpose |
| --- | --- |
| `STAGEHAND_BROWSER` | `browserbase`, `local`, or `auto`; `auto` uses Browserbase when its API key is present. |
| `BROWSERBASE_CONTEXT_ID` | Optional existing Context for saved browser state. |
| `BELL_PUBLIC_URL` | Reachable HTTPS Bell origin for handoff links; loopback HTTP is allowed locally. |
| `BELL_HANDOFF_SECRET` | Handoff encryption secret, at least 32 bytes. |
| `BELL_HEADLESS` | Local browser headless mode; defaults to `true`. |
| `BELL_BROWSER_IDLE_MS` | Browser inactivity timeout; defaults to 30 minutes. |
| `BELL_CAPTCHA_TIMEOUT_MS` | CAPTCHA wait timeout; defaults to 30 seconds. |
| `BELL_DRAFT_CONTEXT_TTL_MS` | Unused draft Context lifetime; defaults to seven days. |
| `BELL_CONTEXT_METADATA_PATH` | Context metadata file; defaults to `.bell/contexts.json`. |
| `BELL_OPERATOR_USERNAME` / `BELL_OPERATOR_PASSWORD` | Optional HTTP Basic operator credentials for Bell; password must be at least 32 bytes. |

The HTTP channel also supports Vercel OIDC. Unauthenticated development access is restricted
to loopback hosts. Production deployments must protect the web interface and session routes.
Never commit credentials, `.env` files, or `.bell` data. Keep the handoff secret
stable across restarts.

## Contexts and storage

Browserbase Contexts preserve cookies and site state; they do not store passwords. Hosted
tasks get a draft Context. Bell's `context_save` tool names and retains it, and `context_list`,
`context_create`, and `context_select` manage saved browser identities. Select a separate Context
for each identity or work boundary.

Eve stores durable conversation and browser state. Context labels use a local
file scoped to one trusted operator and one process. Preserve that file across restarts.
Writes are serialized within that process; this file is not a shared database. Multi-instance or
multi-user deployments need shared durable storage and user isolation before sharing these features.

## Logins and OTP

This fork has no password vault. When a site needs a login, OTP, passkey, or CAPTCHA, the agent
calls `human_handoff`, which returns a Browserbase Live View link. Complete the step there, reply
"done" in the chat, and the agent continues in the same browser. Use `context_save` afterwards so
later conversations start already logged in. Never put secrets in generic `run` arguments: Eve
records tool inputs separately from the browser runtime's redacted activity traces.

Handoff links expire after ten minutes by default and are not single-use. Expiry prevents opening
the link again; it does not revoke a Browserbase Live View already opened. That view can remain
usable until the browser session ends. Keep both URLs private and close the conversation when done.
The reachable Bell origin and handoff secret must be configured before issuing a link.
See [provider checks](provider-tests.md) for opt-in login and saved-Context regressions.
