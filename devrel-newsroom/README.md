# DevRel Newsroom

DevRel Newsroom is a Mastra-based TypeScript project that will generate a review-ready developer newsletter from real open-source project activity.

Milestone 1 turns the stock Mastra weather scaffold into a newsroom-shaped base for the Astro newsletter workflow.

## What exists in Milestone 1

- project-specific Mastra entrypoint
- initial newsletter agent placeholder
- initial newsletter workflow placeholder
- shared newsletter schemas
- environment template
- smoke script for local verification
- clean `data/` and `output/` directories for future milestones

## Requirements

- Node.js 22.13.0 or newer
- npm

## Environment setup

Copy `.env.example` to `.env` and fill values as later milestones need them.

```bash
cp .env.example .env
```

Milestone 1 does not require all API keys to be present just to build, run the dev server, or run the smoke script.

## Run locally

Install dependencies:

```bash
npm install
```

Start Mastra Studio:

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
- a smoke script that validates the initial newsroom scaffold

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

- GitHub release collection
- PR and contributor collection
- blog discovery
- mock events
- newsletter drafting
- React Email rendering
- Notion publishing
