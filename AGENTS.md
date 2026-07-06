# AGENTS.md

## CRITICAL: Load `mastra` skill first

Load the `mastra` skill BEFORE any Mastra work. Never rely on cached knowledge - APIs change between versions.

## Rules

- Register all agents, tools, workflows, and scorers in `src/mastra/index.ts`
- Use the `dev` and `build` scripts from `package.json` instead of running `mastra dev` / `mastra build` directly
- When a milestone is completed, push the work to a new branch and open a PR for review
- In every PR, prioritize clear instructions for how to run and test the milestone locally and in this environment
- In every PR, explicitly separate automated test steps from manual verification steps. If UI checks such as Mastra Studio are optional and not covered by `npm test`, say that directly.

## Resources

- [Mastra Documentation](https://mastra.ai/llms.txt)
- [Skills Discovery](https://mastra.ai/.well-known/skills/index.json)

## Project Role

You are helping build `devrel-newsroom`, a TypeScript/Mastra project that generates developer newsletters from real open-source project activity.

The app uses Astro as the source project.

The goal is to build a polished portfolio project that demonstrates:

- AI agent workflows
- DevRel automation
- GitHub API usage
- contributor recognition
- newsletter generation
- React Email rendering
- Notion publishing

Do not turn this into a generic toy AI newsletter app.

## Build Philosophy

Work in small milestones.

Do not build the entire app at once.

Each milestone should be independently runnable and committed before moving on.

Prefer simple, readable code over clever abstractions.

Prioritize:

1. correctness
2. debuggability
3. clean structure
4. demo value
5. production-shaped architecture

## Important Constraints

Do not include email sending in v1.

Do not create fake GitHub repos, fake contributors, or fake releases.

Use real Astro GitHub and blog data.

Events may be mocked with local Luma-style JSON.

Do not use browser automation unless explicitly requested.

Do not add Jinja2 or Python unless absolutely necessary.

Use TypeScript throughout.

Use React Email for newsletter styling.

Use Mastra as the agent/workflow framework.

Use Gemini as the model provider.

## Expected Stack

Use:

- TypeScript
- Mastra
- Gemini API
- Octokit or GitHub REST/GraphQL API
- Tavily API where useful
- Notion SDK
- React Email
- Zod
- dotenv
- date-fns
- tsx
- Vitest when tests are added

## Suggested Directory Structure

```txt
src/
  agents/
    newsletter-writer.agent.ts
    newsletter-qa.agent.ts

  workflows/
    newsletter.workflow.ts

  tools/
    github-releases.tool.ts
    github-prs.tool.ts
    contributors.tool.ts
    blog.tool.ts
    events.tool.ts
    notion-publisher.tool.ts
    notion-sync.tool.ts

  templates/
    NewsletterEmail.tsx

  schemas/
    newsletter.schema.ts
    release.schema.ts
    contributor.schema.ts
    blog.schema.ts
    event.schema.ts

  data/
    events.json

  output/
    .gitkeep

  lib/
    env.ts
    logger.ts
    dates.ts
    github.ts
    notion.ts

  scripts/
    collect-releases.ts
    collect-contributors.ts
    collect-blog.ts
    collect-events.ts
    generate-newsletter.ts
    publish-notion.ts
    sync-notion.ts
```
