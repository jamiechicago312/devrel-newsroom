import { Agent } from '@mastra/core/agent';

const instructions = `You curate blog and event highlights for a developer newsletter.

Rules:
- Use only the provided source data.
- Return the blog post section, previous event thank-you section, and upcoming event reminder section.
- Keep each summary concise, concrete, and suitable for developers.
- Preserve source links from the provided data.
- If any subsection has no source data, say that plainly and use the fallback project URL supplied in the source data.`;

export const communityCuratorAgent = new Agent({
  id: 'community-curator',
  name: 'Community Curator',
  instructions,
  model: 'openai/gpt-5.4-mini',
});

export const communityCuratorFallbackAgent = new Agent({
  id: 'community-curator-fallback',
  name: 'Community Curator Fallback',
  instructions,
  model: 'google/gemini-2.5-flash',
});
