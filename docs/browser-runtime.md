# Browser runtime

Bell's Eve agent owns conversation history and tool execution. Browser tools share one in-process
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
Never commit credentials, `.env` files, or `.bell` data. Keep handoff and Link encryption keys
stable across restarts.

## Updating an existing deployment

This cleanup changes environment names, the default Context metadata path, and the browser
state namespace. Before deploying it, finish or reset active conversations using the previous
version and verify their Browserbase sessions are released. Start new conversations after updating;
do not resume sessions created by the previous version.

Use the variable names in the table above; old configuration names are no longer read.
To preserve saved Context labels, move the previous metadata file to `.bell/contexts.json`,
or set `BELL_CONTEXT_METADATA_PATH` to its existing location. The file format is unchanged.
The retired local vault and incomplete account-connection endpoint are removed; use the
1Password SDK settings below for credential access.

## Contexts and storage

Browserbase Contexts preserve cookies and site state; they do not store vault secrets. Hosted
tasks get a draft Context. Bell's `context_save` tool names and retains it, and `context_list`,
`context_create`, and `context_select` manage saved browser identities. Select a separate Context
for each identity or work boundary.

Eve stores durable conversation and browser state. Context labels use a local
file scoped to one trusted operator and one process. Preserve that file across restarts.
Writes are serialized within that process; this file is not a shared database. Multi-instance or
multi-user deployments need shared durable storage and user isolation before sharing these features.

## Credentials and OTP

Use `vault_login` or `human_handoff` for login. Never put secrets in generic `run` arguments:
Eve records tool inputs separately from the browser runtime's redacted activity traces.
The model receives login labels, host mappings, field availability, and opaque item references;
credentials resolve server-side immediately before filling.

For hosted 1Password access, set `OP_SERVICE_ACCOUNT_TOKEN` with access only to the required vault.
For local use, enable SDK integration in the 1Password desktop app and set `OP_ACCOUNT` to the
account name shown in its sidebar. Service-account mode takes precedence over desktop access.

Vault login requires HTTPS and the saved hostname, checked before each credential fill and
submission, including an OTP step after navigation. Credential selectors must target the main page;
iframe and XPath selectors are rejected. A success selector is required to verify login.
Persisted sessions with unverified logging settings are replaced before automation resumes.
TOTP values resolve server-side. When a login needs an unavailable OTP, passkey, or human approval,
use `human_handoff`, complete the challenge in Live View, and reply in the original Bell conversation.

Handoff links expire after ten minutes by default and are not single-use. Expiry prevents opening
the link again; it does not revoke a Browserbase Live View already opened. That view can remain
usable until the browser session ends. Keep both URLs private and close the conversation when done.
The reachable Bell origin and handoff secret must be configured before issuing a link.
See [provider checks](provider-tests.md) for opt-in login and saved-Context regressions.
