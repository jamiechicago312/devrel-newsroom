# DevRel Newsroom

DevRel Newsroom is a Mastra-based TypeScript project that generates a review-ready developer newsletter from real open-source project activity.

Milestone 10a makes the drafting layer deliberately Mastra-forward by splitting newsletter generation across multiple specialized agents coordinated by a dedicated draft workflow.

## What exists currently

- project-specific Mastra entrypoint with stable local runtime storage
- newsletter workflow that orchestrates release, contributor, blog, and event collection
- multi-agent newsletter draft workflow that coordinates release, contributor, community, editorial, writer, and QA agents
- specialized Mastra agents for release analysis, contributor spotlighting, community curation, editorial framing, final assembly, and QA review
- shared newsletter, research, email, and agent-brief schemas
- GitHub release and contributor collection utilities and CLI scripts
- Astro blog collection via RSS with Tavily fallback when RSS has no matching posts
- local mock Luma-style event collection from `data/events.json`
- workflow runner script that writes `output/newsletter-data.json`
- newsletter draft runner script that writes `output/newsletter-draft.json`
- multi-agent report artifact that writes `output/newsletter-agent-report.json`
- newsletter email renderer that writes `output/newsletter.html` and `output/newsletter.json`
- Notion publisher script that creates a child page under a configured parent page and writes `output/notion-publish-result.json`
- Notion sync-back script that reads an edited Notion page and writes `output/newsletter-edited.md`
- smoke script for local verification without network access
- clean `output/` directory for generated milestone artifacts

## Agent roles

- `release-analyst` turns release data into a grounded release highlights section
- `contributor-spotlight` turns merged PR data into first-time contributor highlights
- `community-curator` curates the latest blog and event sections
- `newsletter-editor` creates the subject line, preview text, intro, and closing
- `newsletter-writer` assembles the final structured newsletter draft from the specialized briefs
- `newsletter-qa` reviews the final draft and returns a structured QA report

## Requirements

- Node.js 22.13.0 or newer
- npm

## Environment setup

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

For the current milestones:

- `GOOGLE_API_KEY` is required for newsletter drafting with Gemini
- `GITHUB_TOKEN` is required for live release and contributor collection and for the full workflow runner
- `TAVILY_API_KEY` is optional and is only used if the Astro RSS feed returns no posts in the requested window
- `NOTION_TOKEN` and `NOTION_PAGE_ID` are required for live Notion publishing and sync-back
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
- a smoke script that validates the release, contributor, blog, event, draft-source, email render, and Notion sync-back extraction paths without opening Mastra Studio

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

Collect the local mock event summary for a specific window:

```bash
npm run collect:events -- withastro/astro 2026-06-28 2026-07-05
```

This writes `output/events.json`.

Run the full newsletter research workflow:

```bash
npm run workflow:newsletter -- withastro/astro 2026-06-28 2026-07-05
```

This writes `output/newsletter-data.json`.

Generate the structured newsletter draft through the multi-agent pipeline:

```bash
npm run generate:newsletter -- withastro/astro 2026-06-28 2026-07-05
```

This writes `output/newsletter-draft.json` and `output/newsletter-agent-report.json`.

Render the React Email newsletter artifacts:

```bash
npm run render:newsletter
```

This reads `output/newsletter-draft.json` and `output/newsletter-data.json`, then writes `output/newsletter.html` and `output/newsletter.json`.

Publish the generated draft and workflow metadata to Notion:

```bash
npm run publish:notion
```

This reads `output/newsletter-draft.json` and `output/newsletter-data.json`, creates a child page under `NOTION_PAGE_ID`, and writes `output/notion-publish-result.json`.

Sync the edited newsletter body back from Notion:

```bash
npm run sync:notion
```

This reads `output/notion-publish-result.json`, fetches the published page from Notion, extracts the `Full Newsletter Body` section, and writes `output/newsletter-edited.md`.

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

- Flatten repository structure
