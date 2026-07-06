import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { newsletterDraftWorkflow } from '../src/workflows/newsletter-draft.workflow.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { newsletterWorkflow } from '../src/workflows/newsletter.workflow.ts';

const sourceProject = process.argv[2] ?? 'withastro/astro';
const startDate = process.argv[3];
const endDate = process.argv[4];

if (!startDate || !endDate) {
  console.error('Usage: npm run generate:newsletter -- <owner/repo> <start-date> <end-date>');
  process.exit(1);
}

const windowInput = newsletterWindowInputSchema.parse({
  sourceProject,
  startDate,
  endDate,
});

const workflowRun = await newsletterWorkflow.createRun();
const workflowResult = await workflowRun.start({
  inputData: windowInput,
});

if (workflowResult.status !== 'success') {
  throw new Error(`Newsletter workflow failed with status: ${workflowResult.status}`);
}

const draftRun = await newsletterDraftWorkflow.createRun();
const draftResult = await draftRun.start({
  inputData: workflowResult.result,
});

if (draftResult.status !== 'success') {
  throw new Error(`Newsletter draft workflow failed with status: ${draftResult.status}`);
}

const outputDir = path.resolve(import.meta.dirname, '..', 'output');
mkdirSync(outputDir, { recursive: true });

const draftPath = path.resolve(outputDir, 'newsletter-draft.json');
const reportPath = path.resolve(outputDir, 'newsletter-agent-report.json');

writeFileSync(draftPath, `${JSON.stringify(draftResult.result.draft, null, 2)}\n`);
writeFileSync(reportPath, `${JSON.stringify({
  draftingSource: draftResult.result.draftingSource,
  agentBriefs: draftResult.result.agentBriefs,
  qaReport: draftResult.result.qaReport,
}, null, 2)}\n`);

console.log(`Wrote newsletter draft to ${draftPath}`);
console.log(`Wrote multi-agent report to ${reportPath}`);
console.log(`Subject: ${draftResult.result.draft.subject}`);
console.log(`Preview: ${draftResult.result.draft.previewText}`);
console.log(`QA status: ${draftResult.result.qaReport.status}`);
console.log(`QA summary: ${draftResult.result.qaReport.summary}`);
