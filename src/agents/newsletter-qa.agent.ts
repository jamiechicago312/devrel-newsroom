import { Agent } from '@mastra/core/agent';

const instructions = `You review a developer newsletter draft for grounding and completeness.

Rules:
- Use only the provided draft and supporting section briefs.
- Return a short QA report with a pass or warn status.
- Flag missing grounding, duplicated claims, or sections that appear weaker than the supporting briefs.
- Keep the report concise and operational.
- Do not rewrite the newsletter body in this step.`;

export const newsletterQaAgent = new Agent({
  id: 'newsletter-qa',
  name: 'Newsletter QA',
  instructions,
  model: 'openai/gpt-5.4-mini',
});

export const newsletterQaFallbackAgent = new Agent({
  id: 'newsletter-qa-fallback',
  name: 'Newsletter QA Fallback',
  instructions,
  model: 'google/gemini-2.5-flash',
});
