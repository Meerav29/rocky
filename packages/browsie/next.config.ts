import path from "node:path";
import { fileURLToPath } from "node:url";

import { withEve } from "eve/next";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(appRoot, "../..");

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingRoot: workspaceRoot,
  serverExternalPackages: ["@browserbasehq/stagehand"],
  turbopack: { root: workspaceRoot },
};

export default withEve(nextConfig);
