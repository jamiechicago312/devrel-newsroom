import { readEnv } from '../src/lib/env.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';

const sampleWindow = newsletterWindowInputSchema.parse({
  sourceProject: 'withastro/astro',
  startDate: '2026-07-01',
  endDate: '2026-07-05',
});

const env = readEnv();
const configuredKeys = Object.entries(env)
  .filter(([, value]) => Boolean(value))
  .map(([key]) => key)
  .sort();

console.log('DevRel Newsroom smoke test');
console.log(`Source project: ${sampleWindow.sourceProject}`);
console.log(`Window: ${sampleWindow.startDate} -> ${sampleWindow.endDate}`);
console.log(`Configured env keys: ${configuredKeys.length ? configuredKeys.join(', ') : 'none'}`);
