# DevRel Newsroom

DevRel Newsroom is a Mastra-based TypeScript project that generates a review-ready developer newsletter from real open-source project activity.

Milestone 2 adds live GitHub release collection for Astro on top of the Milestone 1 newsroom scaffold.

## What exists in Milestone 2

- project-specific Mastra entrypoint
- initial newsletter agent placeholder
- newsletter workflow with a live GitHub release collection step
- shared newsletter and release schemas
- GitHub release collection utilities and CLI script
- smoke script for local verification without network access
- clean `data/` and `output/` directories for future milestones

## Requirements

- Node.js 22.13.0 or newer
- npm

## Environment setup

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

For Milestone 2:

- `GITHUB_TOKEN` is required for live release collection and workflow runs that hit the GitHub API
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
- a smoke script that validates the release collection scaffolding without opening Mastra Studio

Collect live releases for a specific window:

```bash
npm run collect:releases -- withastro/astro 2026-07-01 2026-07-05
```

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
data/
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

- PR and contributor collection
- blog discovery
- mock events
- newsletter drafting
- React Email rendering
- Notion publishing
