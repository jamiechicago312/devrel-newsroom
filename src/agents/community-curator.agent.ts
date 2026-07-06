import { Agent } from '@mastra/core/agent';

export const communityCuratorAgent = new Agent({
  id: 'community-curator',
  name: 'Community Curator',
  instructions: `You curate blog and event highlights for a developer newsletter.

Rules:
- Use only the provided source data.
- Return the blog post section, previous event thank-you section, and upcoming event reminder section.
- Keep each summary concise, concrete, and suitable for developers.
- Preserve source links from the provided data.
- If any subsection has no source data, say that plainly and use the fallback project URL supplied in the source data.`,
  model: 'google/gemini-2.5-flash',
});
