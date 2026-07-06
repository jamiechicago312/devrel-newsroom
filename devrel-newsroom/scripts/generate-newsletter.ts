import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { newsletterWriterAgent } from '../src/agents/newsletter-writer.agent.ts';
import { newsletterDraftSchema, newsletterWindowInputSchema } from '../src/schemas/newsletter.schema.ts';
import { newsletterWorkflow } from '../src/workflows/newsletter.workflow.ts';

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

const workflowRun = await newsletterWorkflow.createRun();
const workflowResult = await workflowRun.start({
  inputData: windowInput,
});

if (workflowResult.status !== 'success') {
  throw new Error(`Newsletter workflow failed with status: ${workflowResult.status}`);
}

const research = workflowResult.result;
const draftingSource = {
  sourceProject: research.sourceProject,
  startDate: research.startDate,
  endDate: research.endDate,
  releaseCount: research.releaseCount,
  releases: research.releases.slice(0, 5).map(release => ({
    name: release.name,
    tagName: release.tagName,
    url: release.url,
    publishedDate: release.publishedDate,
    summary: release.summary,
  })),
  contributorCount: research.contributorCount,
  contributors: research.contributors.slice(0, 5).map(contributor => ({
    login: contributor.login,
    mergedDate: contributor.mergedDate,
    pullRequestTitle: contributor.pullRequest.title,
    pullRequestUrl: contributor.pullRequest.url,
  })),
  blogPostCount: research.blogPostCount,
  blogPosts: research.blogPosts.slice(0, 3).map(post => ({
    title: post.title,
    url: post.url,
    publishedDate: post.publishedDate,
    summarySourceText: post.summarySourceText,
  })),
  mostRecentPastEvent: research.mostRecentPastEvent,
  nextUpcomingEvent: research.nextUpcomingEvent,
};

const prompt = `Draft a concise developer newsletter from the structured source data below.

Required output sections:
- subject
- previewText
- intro
- releaseHighlights
- firstTimeContributorShoutOuts
- latestBlogPost
- previousEventThankYou
- upcomingEventReminder
- closing

Use only facts and links present in the source data.
Keep it concise.

Source data:
${JSON.stringify(draftingSource, null, 2)}`;

const draftResult = await newsletterWriterAgent.generate(prompt, {
  structuredOutput: {
    schema: newsletterDraftSchema,
  },
});

const outputPath = path.resolve(import.meta.dirname, '..', 'output', 'newsletter-draft.json');
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(draftResult.object, null, 2)}\n`);

console.log(`Wrote newsletter draft to ${outputPath}`);
console.log(`Subject: ${draftResult.object.subject}`);
console.log(`Preview: ${draftResult.object.previewText}`);
