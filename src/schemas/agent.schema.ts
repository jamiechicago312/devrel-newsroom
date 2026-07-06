import { z } from 'zod';
import { newsletterDraftSchema, newsletterDraftingSourceSchema, newsletterSectionSchema } from './newsletter.schema.ts';

export const newsletterEditorialOutlineSchema = z.object({
  subject: z.string().min(1),
  previewText: z.string().min(1),
  intro: z.string().min(1),
  closing: z.string().min(1),
});

export const newsletterCommunityBriefSchema = z.object({
  latestBlogPost: newsletterSectionSchema,
  previousEventThankYou: newsletterSectionSchema,
  upcomingEventReminder: newsletterSectionSchema,
});

export const newsletterAgentBriefsSchema = z.object({
  releaseHighlights: newsletterSectionSchema,
  firstTimeContributorShoutOuts: newsletterSectionSchema,
  latestBlogPost: newsletterSectionSchema,
  previousEventThankYou: newsletterSectionSchema,
  upcomingEventReminder: newsletterSectionSchema,
  editorialOutline: newsletterEditorialOutlineSchema,
});

export const newsletterQaReportSchema = z.object({
  status: z.enum(['pass', 'warn']),
  summary: z.string().min(1),
  checks: z.array(z.string().min(1)),
});

export const newsletterDraftWorkflowOutputSchema = z.object({
  draftingSource: newsletterDraftingSourceSchema,
  agentBriefs: newsletterAgentBriefsSchema,
  draft: newsletterDraftSchema,
  qaReport: newsletterQaReportSchema,
});

export type NewsletterEditorialOutline = z.infer<typeof newsletterEditorialOutlineSchema>;
export type NewsletterCommunityBrief = z.infer<typeof newsletterCommunityBriefSchema>;
export type NewsletterAgentBriefs = z.infer<typeof newsletterAgentBriefsSchema>;
export type NewsletterQaReport = z.infer<typeof newsletterQaReportSchema>;
export type NewsletterDraftWorkflowOutput = z.infer<typeof newsletterDraftWorkflowOutputSchema>;
