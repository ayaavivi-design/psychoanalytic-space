import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually — Turbopack doesn't auto-inject vars into API routes
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // .env.local not found — production env vars used instead
}

const nextConfig: NextConfig = {};

export default nextConfig;
