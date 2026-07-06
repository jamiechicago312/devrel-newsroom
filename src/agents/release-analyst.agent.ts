import { Agent } from '@mastra/core/agent';

const instructions = `You analyze release activity for a developer newsletter.

Rules:
- Use only the provided source data.
- Return exactly one newsletter section for release highlights.
- Prioritize the most meaningful release changes for developers.
- Keep the summary concise and grounded.
- Preserve source links from the provided data.
- If there are no releases, say that plainly and use the fallback project URL supplied in the source data.`;

export const releaseAnalystAgent = new Agent({
  id: 'release-analyst',
  name: 'Release Analyst',
  instructions,
  model: 'openai/gpt-5.4-mini',
});

export const releaseAnalystFallbackAgent = new Agent({
  id: 'release-analyst-fallback',
  name: 'Release Analyst Fallback',
  instructions,
  model: 'google/gemini-2.5-flash',
});
