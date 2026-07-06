import { z } from 'zod';
import { newsletterDraftSchema } from './newsletter.schema.ts';

export const newsletterEmailArtifactSchema = z.object({
  subject: z.string().min(1),
  previewText: z.string().min(1),
  generatedAt: z.string().datetime({ offset: true }),
  sourceProject: z.string().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  html: z.string().min(1),
  text: z.string().min(1),
  sourceMetadata: z.array(z.string().min(1)).min(1),
  draft: newsletterDraftSchema,
});

export type NewsletterEmailArtifact = z.infer<typeof newsletterEmailArtifactSchema>;
