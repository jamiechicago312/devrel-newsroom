import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { newsletterWorkflow } from '../src/workflows/newsletter.workflow.ts';

const sourceProject = process.argv[2] ?? 'withastro/astro';
const startDate = process.argv[3];
const endDate = process.argv[4];

if (!startDate || !endDate) {
  console.error('Usage: npm run workflow:newsletter -- <owner/repo> <start-date> <end-date>');
  process.exit(1);
}

const windowInput = newsletterWindowInputSchema.parse({
  sourceProject,
  startDate,
  endDate,
});

const run = await newsletterWorkflow.createRun();
const result = await run.start({
  inputData: windowInput,
});

if (result.status !== 'success') {
  throw new Error(`Newsletter workflow failed with status: ${result.status}`);
}

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'newsletter-data.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result.result, null, 2)}\n`);

console.log(`Wrote workflow output to ${outputPath}`);
console.log(`Releases: ${result.result.releaseCount}`);
console.log(`Merged PRs: ${result.result.mergedPullRequestCount}`);
console.log(`First-time contributors: ${result.result.contributorCount}`);
console.log(`Blog posts: ${result.result.blogPostCount}`);
console.log(`Most recent past event: ${result.result.mostRecentPastEvent?.title ?? 'none'}`);
console.log(`Next upcoming event: ${result.result.nextUpcomingEvent?.title ?? 'none'}`);
