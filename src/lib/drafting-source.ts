import { newsletterDraftingSourceSchema, type NewsletterDraftingSource, type NewsletterResearch } from '../schemas/newsletter.schema.ts';

export function buildNewsletterDraftingSource(research: NewsletterResearch): NewsletterDraftingSource {
  return newsletterDraftingSourceSchema.parse({
    sourceProject: research.sourceProject,
    projectUrl: `https://github.com/${research.sourceProject}`,
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
  });
}
