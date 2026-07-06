import { z } from 'zod';
import { newsletterEmailArtifactSchema } from './email.schema.ts';
import { newsletterResearchSchema } from './newsletter.schema.ts';
import { newsletterDraftWorkflowOutputSchema } from './agent.schema.ts';

export const persistedNewsletterArtifactsSchema = z.object({
  runFolder: z.string().min(1),
  researchPath: z.string().min(1),
  draftPath: z.string().min(1),
  reportPath: z.string().min(1),
  htmlPath: z.string().min(1),
  jsonPath: z.string().min(1),
});

export const newsletterPipelineDraftBundleSchema = z.object({
  research: newsletterResearchSchema,
  draftingSource: newsletterDraftWorkflowOutputSchema.shape.draftingSource,
  agentBriefs: newsletterDraftWorkflowOutputSchema.shape.agentBriefs,
  draft: newsletterDraftWorkflowOutputSchema.shape.draft,
  qaReport: newsletterDraftWorkflowOutputSchema.shape.qaReport,
});

export const newsletterPipelineWorkflowOutputSchema = newsletterPipelineDraftBundleSchema.extend({
  emailArtifact: newsletterEmailArtifactSchema,
  persistedArtifacts: persistedNewsletterArtifactsSchema,
});

export type PersistedNewsletterArtifacts = z.infer<typeof persistedNewsletterArtifactsSchema>;
export type NewsletterPipelineDraftBundle = z.infer<typeof newsletterPipelineDraftBundleSchema>;
export type NewsletterPipelineWorkflowOutput = z.infer<typeof newsletterPipelineWorkflowOutputSchema>;
