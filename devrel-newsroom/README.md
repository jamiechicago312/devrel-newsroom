# DevRel Newsroom

DevRel Newsroom is a Mastra-based TypeScript project that generates a review-ready developer newsletter from real open-source project activity.

Milestone 4 adds Astro blog discovery on top of the release and contributor collection scaffold.

## What exists in Milestone 4

- project-specific Mastra entrypoint with stable local runtime storage
- newsletter workflow with live GitHub release collection and contributor detection
- shared newsletter, release, contributor, and blog schemas
- GitHub release and contributor collection utilities and CLI scripts
- Astro blog collection via RSS with Tavily fallback when RSS has no matching posts
- smoke script for local verification without network access
- clean `output/` directory for generated milestone artifacts

## Requirements

- Node.js 22.13.0 or newer
- npm

## Environment setup

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

For Milestone 4:

- `GITHUB_TOKEN` is required for live release and contributor collection
- `TAVILY_API_KEY` is optional and is only used if the Astro RSS feed returns no posts in the requested window
- `npm test` does not require live API access
- `npm run dev` starts Mastra Studio for manual inspection, but Studio checks are not part of the automated test gate

## Run locally

Install dependencies:

```bash
npm install
```

Start Mastra Studio for manual inspection:

```bash
npm run dev
```

Mastra Studio should be available at `http://localhost:4111`.

## Test locally

Run the smoke script:

```bash
npm run smoke
```

Run the current test gate:

```bash
npm test
```

The current `test` script runs:

- TypeScript typechecking
- a smoke script that validates the release, contributor, and blog scaffolding without opening Mastra Studio

Collect live releases for a specific window:

```bash
npm run collect:releases -- withastro/astro 2026-06-28 2026-07-05
```

This writes `output/releases.json`.

Collect merged pull requests and first-time contributors for a specific window:

```bash
npm run collect:contributors -- withastro/astro 2026-06-28 2026-07-05
```

This writes `output/contributors.json`.

Collect Astro blog posts for a specific window:

```bash
npm run collect:blog -- withastro/astro 2026-06-28 2026-07-05
```

This writes `output/blog-posts.json`.

Build the app:

```bash
npm run build
```

## Run in this environment

From `/workspace/devrel-newsroom`:

```bash
npm test
npm run dev
```

If port `4111` is already in use, Mastra may choose another port. The terminal output will show the active local URL.

`npm test` does not open Mastra Studio and should not be used as a UI verification step.

## Project layout

```txt
output/
scripts/
src/
  agents/
  lib/
  mastra/
  schemas/
  workflows/
```

## Next milestones

- mock events
- newsletter drafting
- React Email rendering
- Notion publishing
