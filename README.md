# Claude Code Session Explorer

A browser-based inspector for Claude Code JSONL session transcripts. Think Chrome DevTools' Network tab, but for understanding what Claude did during a coding session — every tool call, thinking block, context window shift, and subagent spawn laid out on a single interactive timeline.

<img width="1914" height="911" alt="ClaudeCodeAnalysis" src="https://github.com/user-attachments/assets/c1ed2024-eeb2-4ae1-b4af-9d5391f83f45" />

## Why

Claude Code sessions can run for hundreds of turns across multiple subagents, consuming tokens in ways that are hard to reason about from the raw JSONL. This tool lets you:

- Watch a session live as Claude works — the timeline updates automatically
- See exactly where context tokens are spent and when compactions fire
- Trace tool call chains and inspect their inputs/outputs
- Understand subagent lifecycles — which tool spawned them, what they did
- Spot errors, slow calls, and repeated patterns at a glance

## Quick Start

### Run with npx

```bash
npx ccexplorer
```

To open a specific session file:

```bash
npx ccexplorer ~/.claude/projects/<project>/<session-id>.jsonl
```

### Local development

```bash
npm install
npm start
```

Opens the explorer at `http://127.0.0.1:3457`. It auto-discovers all sessions from `~/.claude/projects/`.

`npm start` runs the CLI locally (`ccexplorer`) via `tsx`.

## Features

### Event Timeline

The main view is a filterable table of every event in the session, ordered chronologically:

- **Tool calls** — name, input, result, duration, and error status
- **Thinking blocks** — model reasoning with token usage
- **Assistant text** — response content
- **User messages** — prompts and tool results
- **Hooks** — pre/post hook executions (deduplicated from command+callback pairs)
- **System events** — turn boundaries, compactions
- **Compaction events** — context resets with trigger reason and pre-compaction token count

Each row shows the context added (Ctx+), running context total, time, and timestamp.

### Context Tracking

- **Running total column** resets to zero after compaction boundaries
- **Context sparkline** — an inline area chart showing token usage over time, with compaction drops marked as vertical lines. Click anywhere on the chart to jump to that event.
- **Hover breakdown** — hover the Total column to see cache read, cache creation, input, and output token counts
- **Streaming deduplication** — events sharing a requestId (streamed chunks from the same API call) are dimmed with an `↑` indicator to avoid double-counting

### Agent Scopes

Sessions with subagents show a scope picker on the left. Each agent (main, Task subagents, compaction subagents) has its own timeline. Events that spawn a subagent display a purple **Spawns Subagent** badge, and the detail panel links directly to that agent's scope.

### Detail Panel

Click any row to inspect it. The detail panel shows:

- **Tool calls** — JSON tree viewer for input (collapsible, syntax-highlighted), full result text, metadata from tool_result events, success/error badge
- **Thinking/Assistant** — full content with token breakdown
- **Compaction** — trigger, pre-compaction token count, link to compaction subagent
- **All events** — timestamp badge, context info with hover breakdown

### Filtering

- **Kind pills** — toggle event types (Tool, Thinking, User, Assistant, Hook, System, Compaction) with a three-state cycle: show all → solo → exclude
- **Tool pills** — filter by specific tool names within the current scope
- **Status pills** — filter by ok/error
- **Search** — full-text search across summaries, tool names, IDs, and content
- **Min Time** — filter tool calls by minimum duration

### Session Browser

A modal session picker groups sessions by project and labels each with the first user message from the session. Sessions are sorted by recency. The active session is polled for changes and the timeline updates live.

### Navigation

Back/forward buttons track your selection history across scope jumps and row selections, similar to browser navigation.

## Architecture

```
src/
  cli.ts                  — CLI entry point (published as `ccex`)
  index.ts                — programmatic entry point
  types.ts                — shared TypeScript types for all events and analysis
  parser/
    jsonl-reader.ts       — reads session JSONL bundles (main + subagent files)
    session-tree.ts       — builds a tree of events with tool pairing
  analyzers/
    network-tab.ts        — builds scoped event timelines with tool pairs
    reasoning-chain.ts    — chronological thinking/tool/text timeline
    tool-dashboard.ts     — tool stats, file access patterns, sequential patterns
    context-tracker.ts    — per-turn token tracking with compaction resets
    skill-detector.ts     — estimates token impact of CLAUDE.md and skill files
  web/
    server.ts             — HTTP server with session discovery and caching
    public/
      index.html          — shell HTML
      app.js              — single-file UI application
      styles.css           — dark theme styles
```

## Development

```bash
npm test           # run tests once
npm run test:watch # watch mode
```

## Publish

```bash
npm publish --access public
```

The `prepack` script builds TypeScript and copies static web assets into `dist/` so the CLI works when installed via npm.
