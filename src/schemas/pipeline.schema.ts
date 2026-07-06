import { z } from 'zod';
import { newsletterEmailArtifactSchema } from './email.schema.ts';
import { newsletterResearchSchema } from './newsletter.schema.ts';
import { newsletterDraftWorkflowOutputSchema } from './agent.schema.ts';

export const newsletterPipelineDraftBundleSchema = z.object({
  research: newsletterResearchSchema,
  draftingSource: newsletterDraftWorkflowOutputSchema.shape.draftingSource,
  agentBriefs: newsletterDraftWorkflowOutputSchema.shape.agentBriefs,
  draft: newsletterDraftWorkflowOutputSchema.shape.draft,
  qaReport: newsletterDraftWorkflowOutputSchema.shape.qaReport,
});

export const newsletterPipelineWorkflowOutputSchema = newsletterPipelineDraftBundleSchema.extend({
  emailArtifact: newsletterEmailArtifactSchema,
});

export type NewsletterPipelineDraftBundle = z.infer<typeof newsletterPipelineDraftBundleSchema>;
export type NewsletterPipelineWorkflowOutput = z.infer<typeof newsletterPipelineWorkflowOutputSchema>;
