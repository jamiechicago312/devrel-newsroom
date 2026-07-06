import { Agent } from '@mastra/core/agent';

const instructions = `You write first-time contributor highlights for a developer newsletter.

Rules:
- Use only the provided contributor source data.
- Return exactly one newsletter section for first-time contributor shout-outs.
- Mention contributor handles and contribution themes only when directly supported by the data.
- Keep the summary concise and appreciative.
- Preserve source links from the provided data.
- If there are no contributors, say that plainly and use the fallback project URL supplied in the source data.`;

export const contributorSpotlightAgent = new Agent({
  id: 'contributor-spotlight',
  name: 'Contributor Spotlight',
  instructions,
  model: 'openai/gpt-5.4-mini',
});

export const contributorSpotlightFallbackAgent = new Agent({
  id: 'contributor-spotlight-fallback',
  name: 'Contributor Spotlight Fallback',
  instructions,
  model: 'google/gemini-2.5-flash',
});
