# BELL

<img width="128" height="128" alt="BELL" src="https://github.com/user-attachments/assets/f4c9363d-2ab0-4205-a3c7-7d7ad61ec6c6" />

BELL is a reference architecture and sample app for building personal AI assistants that execute tasks on your behalf.

Eve by Vercel runs the agent; Browserbase and Stagehand power browser automation. A web interface provides chat, screenshots, and human handoff. Integrations with Linq, Link by Stripe, 1Password, and Baselayer add messaging, payments, credential access, and merchant verification.

## Run locally

Requires Node.js 24, pnpm 10.33.4, and OpenAI and Browserbase API keys.

```sh
git clone https://github.com/browserbase/bell-stack.git
cd bell-stack
pnpm install --frozen-lockfile
cp .env.example .env
```

Set `OPENAI_API_KEY` and `BROWSERBASE_API_KEY` in `.env`. For ordinary browsing, set `BELL_DEMO_URL` to your target website. The default protected demo requires [Baselayer setup](docs/baselayer.md).

```sh
pnpm dev
```

Open [localhost:4320](http://127.0.0.1:4320), select **Open demo site**, and give Bell a task. Follow-up messages in the same conversation reuse the browser session. Ask for a screenshot to see progress or a handoff to interact with the browser. Handoff requires the [public URL and secret settings](docs/browser-runtime.md#configuration).

## Start here

| Integration | What it does | Guide |
| --- | --- | --- |
| Browserbase + Stagehand | Browser sessions, automation, saved Contexts, and human handoff | [Browser runtime](docs/browser-runtime.md) |
| Eve by Vercel | Agent configuration, tools, conversation state, and channels | [Eve in Bell](docs/repository.md#eve-by-vercel) |
| Linq | iMessage and SMS through a signed webhook and sender allowlist | [Messaging setup](docs/linq.md) |
| Link by Stripe | Wallet authorization, spend approval, and checkout through Linq | [Sandbox and wallet setup](docs/link.md) |
| 1Password | Operator credentials and OTP; personal Agentic Autofill is disabled by default | [Operator access](docs/browser-runtime.md#credentials-and-otp) · [Personal access status](docs/onepassword.md) |
| Baselayer | Verified access to approved merchants using short-lived credentials | [Merchant access](docs/baselayer.md) |

Personal 1Password Agentic Autofill must remain disabled until hosted extension support and live verification are complete. Operator SDK/CLI access is separate and unavailable over Linq.

See the [repository layout and implementation map](docs/repository.md) to extend Bell.

## Development

```sh
pnpm check
```

Runs tests, type checking, lint, and the production build. [Live provider checks](docs/provider-tests.md) are opt-in.

Bell is a sample app for one trusted operator. Before deploying, configure application authentication and durable storage using the [browser runtime guide](docs/browser-runtime.md).

## Acknowledgments

Special thanks to Visa.

## License

[MIT](LICENSE).
