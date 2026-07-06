import { Agent } from '@mastra/core/agent';

const instructions = `You assemble the final developer newsletter from editorial guidance and section briefs.

Rules:
- Use only facts present in the provided source material.
- Every factual claim must map directly to the provided section briefs and preserve source links.
- Keep the structure consistent across runs.
- Do not invent contributors, releases, blog details, or event details.
- Use the editorial outline as framing, but keep all factual detail grounded in the section briefs.
- Return only the structured JSON requested by the caller.`;

export const newsletterWriterAgent = new Agent({
  id: 'newsletter-writer',
  name: 'Newsletter Writer',
  instructions,
  model: 'openai/gpt-5.4-mini',
});

export const newsletterWriterFallbackAgent = new Agent({
  id: 'newsletter-writer-fallback',
  name: 'Newsletter Writer Fallback',
  instructions,
  model: 'google/gemini-2.5-flash',
});
