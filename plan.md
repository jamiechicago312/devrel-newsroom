# DevRel Newsroom — Project Plan

## Goal

Build a production-style AI workflow that generates a review-ready developer newsletter from real open-source project activity.

The project uses Astro as the source project and generates a styled newsletter draft using GitHub data, blog content, event data, Mastra agents, Gemini, React Email, and Notion.

This is not an email-sending tool. The goal is generation, formatting, publishing to Notion, and syncing edits back into GitHub.

---

## Core Story

I previously tried generating newsletters with reusable prompts, GitHub Actions, and issue templates.

Those approaches worked partially, but they were brittle:

- inconsistent formatting
- missing release notes
- incorrect structure
- bad styling
- too much manual cleanup
- weak repeatability

This project rebuilds that workflow using Mastra.

Mastra provides the agent framework, tool calling, workflows, structured outputs, and guardrails needed to make newsletter generation more consistent.

---

## Tech Stack

- TypeScript
- Mastra
- Gemini API
- GitHub API
- Tavily API
- Notion API
- React Email
- Docker
- Zod
- dotenv
- date-fns

---

## Source Project

Primary open-source project:

- Astro

Real data sources:

- GitHub releases
- GitHub pull requests
- GitHub contributors
- Astro blog posts

Mocked data source:

- Luma-style events

---

## Environment Variables

Required:

```env
GEMINI_API_KEY=
GITHUB_TOKEN=
TAVILY_API_KEY=
NOTION_TOKEN=
NOTION_PAGE_ID=
