import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { newsletterWindowInputSchema } from '../schemas/newsletter.schema';

const newsletterWindowSchema = z.object({
  sourceProject: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  windowDays: z.number().int().nonnegative(),
  status: z.literal('ready'),
});

const prepareNewsletterWindow = createStep({
  id: 'prepare-newsletter-window',
  description: 'Validates the requested newsletter window for later collection steps.',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterWindowSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const parsed = newsletterWindowInputSchema.parse(inputData);
    const start = new Date(`${parsed.startDate}T00:00:00Z`);
    const end = new Date(`${parsed.endDate}T00:00:00Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid date input');
    }

    if (end < start) {
      throw new Error('endDate must be on or after startDate');
    }

    const windowDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    return {
      sourceProject: parsed.sourceProject,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      windowDays,
      status: 'ready' as const,
    };
  },
});

export const newsletterWorkflow = createWorkflow({
  id: 'newsletter-workflow',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterWindowSchema,
})
  .then(prepareNewsletterWindow);

newsletterWorkflow.commit();
