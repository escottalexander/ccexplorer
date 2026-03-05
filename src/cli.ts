#!/usr/bin/env node

import { resolve } from "node:path";
import { startWebServer } from "./web/server.js";

interface CliOptions {
  sessionPath?: string;
  port?: number;
}

function printHelp(): void {
  console.log(`Claude Code Session Explorer

Usage:
  ccexplorer [session.jsonl] [--port <number>]

Examples:
  ccexplorer
  ccexplorer ~/.claude/projects/my-project/session-id.jsonl
  ccexplorer --port 4567
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--port" || arg === "-p") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --port");
      }
      const parsedPort = Number.parseInt(value, 10);
      if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        throw new Error(`Invalid port: ${value}`);
      }
      options.port = parsedPort;
      i += 1;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.sessionPath) {
      options.sessionPath = resolve(arg);
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return options;
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    const requestedPort = options.port ?? 3457;
    const web = await startWebServer({
      port: requestedPort,
      initialSessionPath: options.sessionPath,
    });
    const actualPort = new URL(web.baseUrl).port;
    const didFallbackPort = requestedPort !== Number(actualPort);

    if (didFallbackPort) {
      console.log(
        `Requested port ${requestedPort} was unavailable. Using port ${actualPort} instead.`
      );
    }

    console.log(
      `Open ${web.baseUrl} in your browser to view your Claude Code sessions. (Ctrl+C to stop)`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    console.error("Run `ccexplorer --help` for usage.");
    process.exit(1);
  }
}

await main();
