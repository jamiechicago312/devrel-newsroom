import { createStep, createWorkflow } from '@mastra/core/workflows';
import { renderNewsletterEmail } from '../lib/email.ts';
import { newsletterDraftWorkflow } from './newsletter-draft.workflow.ts';
import { newsletterWorkflow } from './newsletter.workflow.ts';
import { newsletterDraftWorkflowOutputSchema } from '../schemas/agent.schema.ts';
import {
  newsletterPipelineDraftBundleSchema,
  newsletterPipelineWorkflowOutputSchema,
} from '../schemas/pipeline.schema.ts';
import { newsletterResearchSchema, newsletterWindowInputSchema } from '../schemas/newsletter.schema.ts';

const runNewsletterResearch = createStep({
  id: 'run-newsletter-research',
  description: 'Runs the research workflow for the requested project window.',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterResearchSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const run = await newsletterWorkflow.createRun();
    const result = await run.start({ inputData });

    if (result.status !== 'success') {
      throw new Error(`Newsletter workflow failed with status: ${result.status}`);
    }

    return newsletterResearchSchema.parse(result.result);
  },
});

const runNewsletterDraft = createStep({
  id: 'run-newsletter-draft',
  description: 'Runs the multi-agent draft workflow using the collected research payload.',
  inputSchema: newsletterResearchSchema,
  outputSchema: newsletterPipelineDraftBundleSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const run = await newsletterDraftWorkflow.createRun();
    const result = await run.start({ inputData });

    if (result.status !== 'success') {
      throw new Error(`Newsletter draft workflow failed with status: ${result.status}`);
    }

    const draftBundle = newsletterDraftWorkflowOutputSchema.parse(result.result);

    return {
      research: inputData,
      draftingSource: draftBundle.draftingSource,
      agentBriefs: draftBundle.agentBriefs,
      draft: draftBundle.draft,
      qaReport: draftBundle.qaReport,
    };
  },
});

const renderNewsletterArtifact = createStep({
  id: 'render-newsletter-artifact',
  description: 'Renders the final email artifact so the workflow returns a full ready-to-review newsletter package.',
  inputSchema: newsletterPipelineDraftBundleSchema,
  outputSchema: newsletterPipelineWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const generatedAt = new Date().toISOString();
    const emailArtifact = await renderNewsletterEmail({
      draft: inputData.draft,
      research: inputData.research,
      generatedAt,
    });

    return {
      ...inputData,
      emailArtifact,
    };
  },
});

export const newsletterPipelineWorkflow = createWorkflow({
  id: 'newsletter-pipeline-workflow',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterPipelineWorkflowOutputSchema,
})
  .then(runNewsletterResearch)
  .then(runNewsletterDraft)
  .then(renderNewsletterArtifact);

newsletterPipelineWorkflow.commit();
