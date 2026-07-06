import type { NewsletterDraft, NewsletterResearch } from '../schemas/newsletter.schema.ts';

export function renderNewsletterBodyMarkdown(draft: NewsletterDraft): string {
  const sections = [
    draft.releaseHighlights,
    draft.firstTimeContributorShoutOuts,
    draft.latestBlogPost,
    draft.previousEventThankYou,
    draft.upcomingEventReminder,
  ];

  return [
    `# ${draft.subject}`,
    '',
    `Preview text: ${draft.previewText}`,
    '',
    draft.intro,
    '',
    ...sections.flatMap(section => [
      `## ${section.title}`,
      '',
      section.summary,
      '',
      ...section.links.map(link => `- ${link}`),
      '',
    ]),
    draft.closing,
  ].join('\n');
}

export function buildNewsletterSourceMetadata(research: NewsletterResearch): string[] {
  return [
    `Source project: ${research.sourceProject}`,
    `Window: ${research.startDate} to ${research.endDate} (${research.windowDays} days)`,
    `Release count: ${research.releaseCount}`,
    `Merged pull request count: ${research.mergedPullRequestCount}`,
    `First-time contributor count: ${research.contributorCount}`,
    `Blog source: ${research.blogSource}`,
    `Blog post count: ${research.blogPostCount}`,
    `Event source: ${research.eventSource}`,
    `Most recent past event: ${research.mostRecentPastEvent?.title ?? 'none'}`,
    `Next upcoming event: ${research.nextUpcomingEvent?.title ?? 'none'}`,
  ];
}
