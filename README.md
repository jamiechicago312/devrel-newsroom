# DevRel Newsroom

[![Portfolio](https://img.shields.io/badge/Portfolio-jamiechicago.com-111111?logo=googlechrome&logoColor=white)](https://jamiechicago.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Jamie%20Steinberg-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/steinbergjamie)
[![X](https://img.shields.io/badge/X-@jamiechicago312-000000?logo=x&logoColor=white)](https://x.com/jamiechicago312)
[![YouTube](https://img.shields.io/badge/YouTube-@jamiechicago312-FF0000?logo=youtube&logoColor=white)](https://youtube.com/@jamiechicago312)

DevRel Newsroom is a Mastra-based TypeScript app that turns real open-source activity into a review-ready developer newsletter.

I built it to solve a practical DevRel problem: the updates developers actually care about are usually spread across GitHub releases, merged pull requests, blog posts, and community events. Pulling that together manually is slow, and generic summaries are usually too vague to be useful. This project shows how an agent workflow can gather the signal, draft a credible recap, and leave a human editor with something worth refining instead of starting from a blank page.

For developers, the point is bigger than newsletters. The same pattern works for release digests, OSS project roundups, internal engineering updates, launch recaps, or community reporting. The core question behind the project is simple: why does this matter to developers, and how can they use the result?

## Why This Stack

- `Mastra` provides the workflow and agent framework so the collection, drafting, and QA stages are explicit, inspectable, and easy to demo.
- `TypeScript` keeps the schemas and handoffs strict across collectors, agents, rendering, and publishing.
- `Gemini Flash` keeps iterative multi-agent drafting affordable while staying fast enough for repeated runs.
- `React Email` turns the final draft into a deliverable email artifact instead of leaving the output as raw JSON.
- `Notion` makes it easy to push the draft into a real editorial workflow and pull edited copy back out.

The main implementation decision was to optimize for usefulness over novelty. Each workflow stage should help a developer answer what changed, why it matters, and what they should read or do next.

## Quickstart

### Requirements

- Node.js 22.13.0 or newer
- npm

### Setup

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

Environment notes:

- `GOOGLE_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` is required for the Gemini-backed agent pipeline
- `GITHUB_TOKEN` is required for live release and contributor collection and for the full workflow runner
- `TAVILY_API_KEY` is optional and is only used if the Astro RSS feed returns no posts in the requested window
- `NOTION_TOKEN` and `NOTION_PAGE_ID` are required for live Notion publishing and sync-back

Install dependencies:

```bash
npm install
```

### Start locally

Run Mastra from the repository root:

```bash
npm run dev
```

Mastra Studio should be available at `http://localhost:4111` unless that port is already in use.

In Mastra Studio, use `newsletter-pipeline-workflow` for the clean end-to-end demo flow. It takes only `sourceProject`, `startDate`, and `endDate`, then runs research collection, drafting, QA, and email rendering in one workflow run.

### Verify locally

Run the automated gate:

```bash
npm test
```

Build the production bundle:

```bash
npm run build
```

`npm test` runs TypeScript typechecking plus a smoke path that validates the release, contributor, blog, event, draft-source, email render, and Notion sync-back flows without opening Mastra Studio.

## How Developers Can Use This

- generate a repeatable newsletter workflow from real project activity instead of manually assembling updates from several tools
- adapt the same pattern for release digests, launch notes, community roundups, or internal engineering newsletters
- demo Mastra with a concrete multi-agent use case where each agent has a narrow job and produces visible artifacts

## What It Produces

- `output/newsletter-data.json` with collected source material
- `output/newsletter-draft.json` with the structured draft
- `output/newsletter-agent-report.json` with the multi-agent report
- `output/newsletter.html` and `output/newsletter.json` with rendered email artifacts
- `output/notion-publish-result.json` and `output/newsletter-edited.md` for the Notion publishing loop

## Workflow Commands

Collect live releases for a specific window:

```bash
npm run collect:releases -- withastro/astro 2026-06-28 2026-07-05
```

Collect merged pull requests and first-time contributors for a specific window:

```bash
npm run collect:contributors -- withastro/astro 2026-06-28 2026-07-05
```

Collect Astro blog posts for a specific window:

```bash
npm run collect:blog -- withastro/astro 2026-06-28 2026-07-05
```

Collect the local mock event summary for a specific window:

```bash
npm run collect:events -- withastro/astro 2026-06-28 2026-07-05
```

Run the full newsletter research workflow:

```bash
npm run workflow:newsletter -- withastro/astro 2026-06-28 2026-07-05
```

Run the end-to-end newsletter pipeline from the CLI. This now performs research, drafting, QA, and rendering in one command:

```bash
npm run generate:newsletter -- withastro/astro 2026-06-28 2026-07-05
```

Render the React Email newsletter artifacts again from existing draft and research files if you want to rerender without rerunning the agent pipeline:

```bash
npm run render:newsletter
```

Publish the generated draft and workflow metadata to Notion:

```bash
npm run publish:notion
```

Sync the edited newsletter body back from Notion:

```bash
npm run sync:notion
```

## Agent Roles

- `release-analyst` turns release data into a grounded release highlights section
- `contributor-spotlight` turns merged PR data into first-time contributor highlights
- `community-curator` curates the latest blog and event sections
- `newsletter-editor` creates the subject line, preview text, intro, and closing
- `newsletter-writer` assembles the final structured newsletter draft from the specialized briefs
- `newsletter-qa` reviews the final draft and returns a structured QA report

## Project Layout

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
