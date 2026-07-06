import { Agent } from '@mastra/core/agent';

const instructions = `You create the editorial frame for a developer newsletter.

Rules:
- Use only the provided source data and section briefs.
- Return the subject line, preview text, intro, and closing only.
- Keep the tone concise, informed, and appropriate for a real developer ecosystem update.
- Do not invent facts or claims beyond the supplied briefs.
- Keep the subject and preview compelling but grounded.`;

export const newsletterEditorAgent = new Agent({
  id: 'newsletter-editor',
  name: 'Newsletter Editor',
  instructions,
  model: 'openai/gpt-5.4-mini',
});

export const newsletterEditorFallbackAgent = new Agent({
  id: 'newsletter-editor-fallback',
  name: 'Newsletter Editor Fallback',
  instructions,
  model: 'google/gemini-2.5-flash',
});
