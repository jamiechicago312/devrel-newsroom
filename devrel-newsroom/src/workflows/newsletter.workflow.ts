import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { readEnv } from '../lib/env';
import { fetchGitHubReleases, filterReleasesByWindow } from '../lib/github';
import { newsletterWindowInputSchema } from '../schemas/newsletter.schema';
import { githubReleaseSchema } from '../schemas/release.schema';

const newsletterWindowSchema = z.object({
  sourceProject: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  windowDays: z.number().int().nonnegative(),
  status: z.literal('ready'),
});

const newsletterResearchSchema = newsletterWindowSchema.extend({
  releaseCount: z.number().int().nonnegative(),
  releases: z.array(githubReleaseSchema),
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

const collectGitHubReleases = createStep({
  id: 'collect-github-releases',
  description: 'Collects published GitHub releases for the configured source project within the requested window.',
  inputSchema: newsletterWindowSchema,
  outputSchema: newsletterResearchSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const env = readEnv();
    if (!env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is required to collect live GitHub releases');
    }

    const releases = await fetchGitHubReleases({
      sourceProject: inputData.sourceProject,
      githubToken: env.GITHUB_TOKEN,
    });

    const filteredReleases = filterReleasesByWindow({
      releases,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
    });

    return {
      ...inputData,
      releaseCount: filteredReleases.length,
      releases: filteredReleases,
    };
  },
});

export const newsletterWorkflow = createWorkflow({
  id: 'newsletter-workflow',
  inputSchema: newsletterWindowInputSchema,
  outputSchema: newsletterResearchSchema,
})
  .then(prepareNewsletterWindow)
  .then(collectGitHubReleases);

newsletterWorkflow.commit();
