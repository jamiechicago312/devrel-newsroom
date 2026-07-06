import { Agent } from '@mastra/core/agent';

export const releaseAnalystAgent = new Agent({
  id: 'release-analyst',
  name: 'Release Analyst',
  instructions: `You analyze release activity for a developer newsletter.

Rules:
- Use only the provided source data.
- Return exactly one newsletter section for release highlights.
- Prioritize the most meaningful release changes for developers.
- Keep the summary concise and grounded.
- Preserve source links from the provided data.
- If there are no releases, say that plainly and use the fallback project URL supplied in the source data.`,
  model: 'google/gemini-2.5-flash',
});
