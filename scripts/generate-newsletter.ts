import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { newsletterPipelineWorkflow } from '../src/workflows/newsletter-pipeline.workflow.ts';
import { newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';

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

const run = await newsletterPipelineWorkflow.createRun();
const result = await run.start({
  inputData: windowInput,
});

if (result.status !== 'success') {
  throw new Error(`Newsletter pipeline workflow failed with status: ${result.status}`);
}

const outputDir = path.resolve(import.meta.dirname, '..', 'output');
mkdirSync(outputDir, { recursive: true });

const researchPath = path.resolve(outputDir, 'newsletter-data.json');
const draftPath = path.resolve(outputDir, 'newsletter-draft.json');
const reportPath = path.resolve(outputDir, 'newsletter-agent-report.json');
const htmlPath = path.resolve(outputDir, 'newsletter.html');
const jsonPath = path.resolve(outputDir, 'newsletter.json');

writeFileSync(researchPath, `${JSON.stringify(result.result.research, null, 2)}\n`);
writeFileSync(draftPath, `${JSON.stringify(result.result.draft, null, 2)}\n`);
writeFileSync(reportPath, `${JSON.stringify({
  draftingSource: result.result.draftingSource,
  agentBriefs: result.result.agentBriefs,
  qaReport: result.result.qaReport,
}, null, 2)}\n`);
writeFileSync(htmlPath, result.result.emailArtifact.html);
writeFileSync(jsonPath, `${JSON.stringify(result.result.emailArtifact, null, 2)}\n`);

console.log(`Wrote workflow output to ${researchPath}`);
console.log(`Wrote newsletter draft to ${draftPath}`);
console.log(`Wrote multi-agent report to ${reportPath}`);
console.log(`Wrote rendered newsletter HTML to ${htmlPath}`);
console.log(`Wrote Resend-ready newsletter JSON to ${jsonPath}`);
console.log(`Subject: ${result.result.draft.subject}`);
console.log(`Preview: ${result.result.draft.previewText}`);
console.log(`QA status: ${result.result.qaReport.status}`);
console.log(`QA summary: ${result.result.qaReport.summary}`);
