import { Agent } from '@mastra/core/agent';

export const newsletterWriterAgent = new Agent({
  id: 'newsletter-writer',
  name: 'Newsletter Writer',
  instructions: `You draft a concise developer newsletter from structured source data.

Rules:
- Use only facts present in the provided source material
- Preserve links back to the original sources
- Keep the structure consistent across runs
- Do not invent contributors, releases, or event details`,
  model: 'google/gemini-2.5-pro',
});
