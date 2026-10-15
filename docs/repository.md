# Bell and Browsie workspace

Bell lives in [browserbase/bell-stack](https://github.com/browserbase/bell-stack).
The complete Browsie package is tracked here so contributors can review and change both sides
of the browser integration in one pull request.

```text
agent/                  Bell's Eve agent, Linq channel, and tool imports
app/                    Bell's web interface and handoff routes
server/                 Bell's Baselayer integration
packages/browsie/        Browsie source, standalone app, shared exports, and tests
scripts/                Bell's standalone mint command
tests/                  Bell's tests
docs/                   Setup and demo guides
pnpm-workspace.yaml     Workspace package membership
pnpm-lock.yaml          Shared dependency resolutions
```

## Source provenance

`packages/browsie` was imported from `projects/browsie` in
[browserbase/cookbook at 93483ce09eacb4d08014bb49c8d701cb77943186](https://github.com/browserbase/cookbook/tree/93483ce09eacb4d08014bb49c8d701cb77943186/projects/browsie),
the exact submodule revision Bell used before this import. The package's MIT license is retained
in [packages/browsie/LICENSE](../packages/browsie/LICENSE). Only tracked package files were imported;
local environment files, browser data, dependencies, and generated output are excluded.

Packaging and contributor documentation are adapted to this workspace. The import removes
unused trace-writing, task-history, and console-event helpers, unused response types, and the
direct dotenv dependency formerly used by the tunnel runner. The active runtime behavior is
preserved. The nested lockfile is consolidated into the root lockfile, and the existing Eve/Undici
override is enforced at the workspace root. Eve remains 0.47.6 in both packages. An Eve upgrade
is separate work. The optional tunnel runner is omitted; messaging and phone handoff use Bell's
direct HTTPS deployment.

Repository-specific coding-agent entry files are omitted. Both Next.js apps disable their
automatic generation; contributor guidance lives in the README and CONTRIBUTING documents.

This is a maintained local copy. Cookbook changes do not arrive automatically. Review upstream
changes against the recorded source revision and bring over relevant fixes deliberately.

## Install and build

Use Node.js 24 and pnpm 10.33.4:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` and `pnpm build` first build Browsie's shared exports. After editing runtime code,
run `pnpm setup:runtime` and restart Bell. The package's standalone app can be started with
`pnpm --filter browsie dev`; it has its own configuration and runs on port 4318.

Bell depends on `browsie` through `workspace:*`. Imports such as `browsie/runtime` and
`browsie/tools/run` resolve to `packages/browsie`. Bell still calls the runtime in-process,
with one browser per conversation. Importing the package does not start its standalone app.

## Verify changes

Run `pnpm check:workspace` from the root. It runs Browsie's tests, typecheck, lint,
and production build, followed by Bell's tests, typecheck, lint, and production
build. Bell and Browsie each use their own TypeScript and ESLint configurations. CI checks both.

The default tests use mocks. Provider-backed tests are opt-in and require service configuration;
report those separately. Keep Eve versions aligned and repeat the workspace checks when changing
shared dependencies. Keep generated `dist`, `.eve`, `.next`, `.output`, and browser data untracked.
