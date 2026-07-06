import { createStep, createWorkflow } from '@mastra/core/workflows';
import {
  newsletterCommunityBriefSchema,
  newsletterDraftWorkflowOutputSchema,
  newsletterAgentBriefsSchema,
  newsletterEditorialOutlineSchema,
  newsletterQaReportSchema,
} from '../schemas/agent.schema.ts';
import { newsletterDraftSchema, newsletterDraftingSourceSchema, newsletterResearchSchema, newsletterSectionSchema } from '../schemas/newsletter.schema.ts';
import { buildNewsletterDraftingSource } from '../lib/drafting-source.ts';
import { communityCuratorAgent } from '../agents/community-curator.agent.ts';
import { contributorSpotlightAgent } from '../agents/contributor-spotlight.agent.ts';
import { newsletterEditorAgent } from '../agents/newsletter-editor.agent.ts';
import { newsletterQaAgent } from '../agents/newsletter-qa.agent.ts';
import { newsletterWriterAgent } from '../agents/newsletter-writer.agent.ts';
import { releaseAnalystAgent } from '../agents/release-analyst.agent.ts';

const draftingBundleSchema = newsletterDraftingSourceSchema.extend({
  agentBriefs: newsletterAgentBriefsSchema,
});

const prepareDraftingSource = createStep({
  id: 'prepare-drafting-source',
  description: 'Condenses collected research into a focused briefing payload for the agent pipeline.',
  inputSchema: newsletterResearchSchema,
  outputSchema: newsletterDraftingSourceSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    return buildNewsletterDraftingSource(inputData);
  },
});

const generateAgentBriefs = createStep({
  id: 'generate-agent-briefs',
  description: 'Runs multiple specialized Mastra agents to prepare newsletter section briefs and editorial framing.',
  inputSchema: newsletterDraftingSourceSchema,
  outputSchema: draftingBundleSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const releasePrompt = `Create the release highlights section from this source data.\n\nSource data:\n${JSON.stringify({
      projectUrl: inputData.projectUrl,
      releaseCount: inputData.releaseCount,
      releases: inputData.releases,
    }, null, 2)}`;

    const contributorPrompt = `Create the first-time contributor shout-outs section from this source data.\n\nSource data:\n${JSON.stringify({
      projectUrl: inputData.projectUrl,
      contributorCount: inputData.contributorCount,
      contributors: inputData.contributors,
    }, null, 2)}`;

    const communityPrompt = `Create the blog and event sections from this source data.\n\nSource data:\n${JSON.stringify({
      projectUrl: inputData.projectUrl,
      blogPostCount: inputData.blogPostCount,
      blogPosts: inputData.blogPosts,
      mostRecentPastEvent: inputData.mostRecentPastEvent,
      nextUpcomingEvent: inputData.nextUpcomingEvent,
    }, null, 2)}`;

    const [releaseResult, contributorResult, communityResult] = await Promise.all([
      releaseAnalystAgent.generate(releasePrompt, {
        structuredOutput: { schema: newsletterSectionSchema },
      }),
      contributorSpotlightAgent.generate(contributorPrompt, {
        structuredOutput: { schema: newsletterSectionSchema },
      }),
      communityCuratorAgent.generate(communityPrompt, {
        structuredOutput: { schema: newsletterCommunityBriefSchema },
      }),
    ]);

    const editorialPrompt = `Create the editorial frame for this newsletter.\n\nSource data:\n${JSON.stringify({
      sourceProject: inputData.sourceProject,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
      releaseCount: inputData.releaseCount,
      contributorCount: inputData.contributorCount,
      blogPostCount: inputData.blogPostCount,
      releaseHighlights: releaseResult.object,
      firstTimeContributorShoutOuts: contributorResult.object,
      latestBlogPost: communityResult.object.latestBlogPost,
      previousEventThankYou: communityResult.object.previousEventThankYou,
      upcomingEventReminder: communityResult.object.upcomingEventReminder,
    }, null, 2)}`;

    const editorialResult = await newsletterEditorAgent.generate(editorialPrompt, {
      structuredOutput: { schema: newsletterEditorialOutlineSchema },
    });

    return {
      ...inputData,
      agentBriefs: {
        releaseHighlights: releaseResult.object,
        firstTimeContributorShoutOuts: contributorResult.object,
        latestBlogPost: communityResult.object.latestBlogPost,
        previousEventThankYou: communityResult.object.previousEventThankYou,
        upcomingEventReminder: communityResult.object.upcomingEventReminder,
        editorialOutline: editorialResult.object,
      },
    };
  },
});

const composeDraft = createStep({
  id: 'compose-newsletter-draft',
  description: 'Uses the final writer agent to assemble the newsletter draft from the agent briefs.',
  inputSchema: draftingBundleSchema,
  outputSchema: newsletterDraftWorkflowOutputSchema.omit({ qaReport: true }).extend({
    qaReport: newsletterQaReportSchema.optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const prompt = `Assemble the final newsletter from this editorial outline and section brief package.\n\nDraft package:\n${JSON.stringify({
      sourceProject: inputData.sourceProject,
      startDate: inputData.startDate,
      endDate: inputData.endDate,
      agentBriefs: inputData.agentBriefs,
    }, null, 2)}`;

    const draftResult = await newsletterWriterAgent.generate(prompt, {
      structuredOutput: {
        schema: newsletterDraftSchema,
      },
    });

    return {
      draftingSource: newsletterDraftingSourceSchema.parse(inputData),
      agentBriefs: inputData.agentBriefs,
      draft: draftResult.object,
    };
  },
});

const reviewDraft = createStep({
  id: 'review-newsletter-draft',
  description: 'Runs the QA agent to produce a structured review report for the final draft.',
  inputSchema: newsletterDraftWorkflowOutputSchema.omit({ qaReport: true }).extend({
    qaReport: newsletterQaReportSchema.optional(),
  }),
  outputSchema: newsletterDraftWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data is required');
    }

    const qaPrompt = `Review this newsletter draft against the supporting briefs and return a concise QA report.\n\nReview package:\n${JSON.stringify({
      sourceProject: inputData.draftingSource.sourceProject,
      startDate: inputData.draftingSource.startDate,
      endDate: inputData.draftingSource.endDate,
      agentBriefs: inputData.agentBriefs,
      draft: inputData.draft,
    }, null, 2)}`;

    const qaResult = await newsletterQaAgent.generate(qaPrompt, {
      structuredOutput: {
        schema: newsletterQaReportSchema,
      },
    });

    const qaReport = {
      ...qaResult.object,
      checks: qaResult.object.checks.length > 0
        ? qaResult.object.checks
        : [qaResult.object.status === 'pass'
            ? 'No additional QA issues were flagged.'
            : 'QA reported concerns but did not enumerate them.'],
    };

    return {
      draftingSource: inputData.draftingSource,
      agentBriefs: inputData.agentBriefs,
      draft: inputData.draft,
      qaReport,
    };
  },
});

export const newsletterDraftWorkflow = createWorkflow({
  id: 'newsletter-draft-workflow',
  inputSchema: newsletterResearchSchema,
  outputSchema: newsletterDraftWorkflowOutputSchema,
})
  .then(prepareDraftingSource)
  .then(generateAgentBriefs)
  .then(composeDraft)
  .then(reviewDraft);

newsletterDraftWorkflow.commit();
