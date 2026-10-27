# bell-agent

A personal browser agent, trimmed down from [browserbase/bell-stack](https://github.com/browserbase/bell-stack) (MIT).

It keeps only three pieces:

- **Browserbase + Stagehand** for a cloud browser that persists across turns, can save logins as reusable Contexts, and hands off to you for logins, OTP and CAPTCHAs.
- **Eve by Vercel** for the agent loop, tools, skills and the web chat.
- **OpenAI** as the model.

Removed from upstream: Linq (iMessage/SMS), Link by Stripe (payments), 1Password, Baselayer, and the PostgreSQL storage they needed.

## Run locally

You need Node.js 24 (Eve refuses to start on older versions), pnpm 10.33.4, an OpenAI API key and a Browserbase API key.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

Set `OPENAI_API_KEY` and `BROWSERBASE_API_KEY` in `.env`. To use human handoff, also set `BELL_HANDOFF_SECRET` (generate it with `openssl rand -base64 32`). Then:

```sh
pnpm dev
```

Open http://127.0.0.1:4320.

If you don't have pnpm, `corepack pnpm <command>` works without installing it globally.

## Example task: Hacker News brief

Click **Hacker News brief** in the chat, or type "give me today's Hacker News brief". The agent loads the [`hn-brief`](agent/skills/hn-brief/SKILL.md) skill, opens news.ycombinator.com in its browser, reads the front page, and replies with the top 5 stories (points and comment counts) plus a screenshot.

It needs no login, so it's a quick way to check that your keys and the browser work.

## Adding your own tasks

| You want | Add | Example |
| --- | --- | --- |
| A repeatable procedure | A markdown skill in `agent/skills/<name>/SKILL.md` with a `description` saying when to use it | [`hn-brief`](agent/skills/hn-brief/SKILL.md) |
| Typed code the model can call | A tool in `agent/tools/<name>.ts` using `defineTool` | [`snapshot.ts`](agent/tools/snapshot.ts) |
| Something that runs on a timer | A schedule in `agent/schedules/<name>.md` with `cron` frontmatter (runs under `pnpm start`, not `pnpm dev`) | See `node_modules/eve/docs/schedules.mdx` |
| A site you have to log into | Ask the agent to open it. It sends a handoff link, you log in, then say "save this browser as <name>" | `context_save` tool |

Behaviour rules live in [`agent/instructions.md`](agent/instructions.md). Restart `pnpm dev` after changing anything under `agent/`.

## Development

```sh
pnpm check
```

Runs tests, type checking, lint and the production build. On Windows, `tests/browser/context-metadata-store.test.ts` fails one assertion because Windows doesn't support Unix `0600` file permissions. It passes on Linux CI.

See [repository layout](docs/repository.md) and [browser runtime](docs/browser-runtime.md) for internals.

This is a single-user app. Before deploying it anywhere public, set `BELL_OPERATOR_USERNAME`/`BELL_OPERATOR_PASSWORD` and read the browser runtime guide.

## Upstream

The `upstream` remote points at browserbase/bell-stack. To pull their fixes:

```sh
git fetch upstream && git merge upstream/main
```

Expect conflicts in files this fork trimmed.

## License

[MIT](LICENSE), with Browserbase's original copyright.
