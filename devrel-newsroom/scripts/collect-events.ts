import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadMockEvents, selectNewsletterEvents } from '../src/lib/events.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';

const sourceProject = process.argv[2] ?? 'withastro/astro';
const startDate = process.argv[3];
const endDate = process.argv[4];

if (!startDate || !endDate) {
  console.error('Usage: npm run collect:events -- <owner/repo> <start-date> <end-date>');
  process.exit(1);
}

const windowInput = newsletterWindowInputSchema.parse({
  sourceProject,
  startDate,
  endDate,
});

const events = loadMockEvents();
const collection = selectNewsletterEvents({
  events,
  sourceProject: windowInput.sourceProject,
  startDate: windowInput.startDate,
  endDate: windowInput.endDate,
});

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'events.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Wrote event collection to ${outputPath}`);
console.log(`Most recent past event: ${collection.mostRecentPastEvent?.title ?? 'none'}`);
console.log(`Next upcoming event: ${collection.nextUpcomingEvent?.title ?? 'none'}`);
