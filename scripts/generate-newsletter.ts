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

console.log(`Wrote workflow output to ${result.result.persistedArtifacts.researchPath}`);
console.log(`Wrote newsletter draft to ${result.result.persistedArtifacts.draftPath}`);
console.log(`Wrote multi-agent report to ${result.result.persistedArtifacts.reportPath}`);
console.log(`Wrote rendered newsletter HTML to ${result.result.persistedArtifacts.htmlPath}`);
console.log(`Wrote Resend-ready newsletter JSON to ${result.result.persistedArtifacts.jsonPath}`);
console.log(`Run folder: ${result.result.persistedArtifacts.runFolder}`);
console.log(`Subject: ${result.result.draft.subject}`);
console.log(`Preview: ${result.result.draft.previewText}`);
console.log(`QA status: ${result.result.qaReport.status}`);
console.log(`QA summary: ${result.result.qaReport.summary}`);
