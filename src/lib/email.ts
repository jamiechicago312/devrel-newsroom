import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { render, toPlainText } from '@react-email/render';
import { newsletterEmailArtifactSchema, type NewsletterEmailArtifact } from '../schemas/email.schema.ts';
import type { NewsletterDraft, NewsletterResearch } from '../schemas/newsletter.schema.ts';
import { buildNewsletterSourceMetadata, renderNewsletterBodyMarkdown } from './newsletter.ts';

const colors = {
  background: '#0b0d16',
  surface: '#11131f',
  surfaceMuted: '#171b2b',
  border: '#29324a',
  text: '#eef2ff',
  muted: '#aab4d6',
  cyan: '#7dd3fc',
  orange: '#fbbf24',
  pink: '#f472b6',
  violet: '#a78bfa',
};

function gradientHeadline(text: string): React.ReactElement {
  return React.createElement(
    'span',
    {
      style: {
        color: colors.cyan,
        backgroundImage: `linear-gradient(90deg, ${colors.cyan} 0%, ${colors.violet} 55%, ${colors.pink} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
      },
    },
    text,
  );
}

function sectionCard(input: {
  eyebrow: string;
  title: string;
  summary: string;
  links: string[];
  accent: string;
  primaryLabel?: string;
}): React.ReactElement {
  const primaryLink = input.links[0];
  const extraLinks = input.links.slice(1);

  return React.createElement(
    Section,
    {
      style: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.24)',
      },
    },
    React.createElement(Text, {
      style: {
        color: input.accent,
        fontSize: '11px',
        lineHeight: '16px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        margin: '0 0 10px',
      },
    }, input.eyebrow),
    React.createElement(Heading, {
      as: 'h2',
      style: {
        color: colors.text,
        fontSize: '24px',
        lineHeight: '30px',
        fontWeight: '700',
        margin: '0 0 12px',
      },
    }, input.title),
    React.createElement(Text, {
      style: {
        color: colors.muted,
        fontSize: '15px',
        lineHeight: '25px',
        margin: '0 0 18px',
      },
    }, input.summary),
    primaryLink ? React.createElement(Button, {
      href: primaryLink,
      style: {
        backgroundColor: input.accent,
        color: '#0a0c14',
        borderRadius: '999px',
        fontSize: '14px',
        fontWeight: '700',
        textDecoration: 'none',
        padding: '12px 18px',
      },
    }, input.primaryLabel ?? 'Open link') : null,
    extraLinks.length > 0 ? React.createElement(Section, { style: { marginTop: '18px' } },
      ...extraLinks.map(link => React.createElement(Text, {
        style: {
          margin: '0 0 8px',
          fontSize: '14px',
          lineHeight: '22px',
          color: colors.muted,
        },
        key: link,
      }, '• ', React.createElement(Link, {
        href: link,
        style: {
          color: colors.text,
          textDecoration: 'underline',
        },
      }, link)))) : null,
  );
}

function contributorCard(research: NewsletterResearch): React.ReactElement {
  return React.createElement(
    Section,
    {
      style: {
        backgroundColor: colors.surfaceMuted,
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '16px',
      },
    },
    React.createElement(Text, {
      style: {
        color: colors.orange,
        fontSize: '11px',
        lineHeight: '16px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        margin: '0 0 10px',
      },
    }, 'Contributors'),
    React.createElement(Heading, {
      as: 'h2',
      style: {
        color: colors.text,
        fontSize: '24px',
        lineHeight: '30px',
        fontWeight: '700',
        margin: '0 0 12px',
      },
    }, `${research.contributorCount} first-time contributors this week`),
    React.createElement(Text, {
      style: {
        color: colors.muted,
        fontSize: '15px',
        lineHeight: '24px',
        margin: '0 0 16px',
      },
    }, 'Shout-outs pulled directly from merged pull requests in the newsletter window.'),
    ...research.contributors.map(contributor => React.createElement(Section, {
      key: contributor.pullRequest.url,
      style: {
        borderTop: `1px solid ${colors.border}`,
        paddingTop: '14px',
        marginTop: '14px',
      },
    },
    React.createElement(Text, {
      style: {
        color: colors.text,
        fontSize: '15px',
        lineHeight: '22px',
        fontWeight: '700',
        margin: '0 0 4px',
      },
    }, `${contributor.login} • ${contributor.mergedDate}`),
    React.createElement(Text, {
      style: {
        color: colors.muted,
        fontSize: '14px',
        lineHeight: '22px',
        margin: '0',
      },
    }, React.createElement(Link, {
      href: contributor.pullRequest.url,
      style: {
        color: colors.cyan,
        textDecoration: 'underline',
      },
    }, contributor.pullRequest.title)))),
  );
}

function metadataCard(lines: string[]): React.ReactElement {
  return React.createElement(
    Section,
    {
      style: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '12px',
      },
    },
    React.createElement(Text, {
      style: {
        color: colors.violet,
        fontSize: '11px',
        lineHeight: '16px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        margin: '0 0 10px',
      },
    }, 'Source metadata'),
    ...lines.map(line => React.createElement(Text, {
      key: line,
      style: {
        color: colors.muted,
        fontSize: '14px',
        lineHeight: '22px',
        margin: '0 0 8px',
      },
    }, line)),
  );
}

function NewsletterEmail(props: {
  draft: NewsletterDraft;
  research: NewsletterResearch;
  generatedAt: string;
}): React.ReactElement {
  const { draft, research, generatedAt } = props;
  const sourceMetadata = buildNewsletterSourceMetadata(research);

  return React.createElement(
    Html,
    null,
    React.createElement(Head),
    React.createElement(Preview, null, draft.previewText),
    React.createElement(
      Body,
      {
        style: {
          margin: '0',
          padding: '0',
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
      },
      React.createElement(
        Container,
        {
          style: {
            width: '100%',
            maxWidth: '640px',
            margin: '0 auto',
            padding: '32px 18px 48px',
          },
        },
        React.createElement(
          Section,
          {
            style: {
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '28px',
              padding: '28px 28px 24px',
              marginBottom: '18px',
            },
          },
          React.createElement(Text, {
            style: {
              color: colors.orange,
              fontSize: '11px',
              lineHeight: '16px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              margin: '0 0 12px',
            },
          }, 'Astro DevRel Newsroom'),
          React.createElement(Heading, {
            as: 'h1',
            style: {
              color: colors.text,
              fontSize: '34px',
              lineHeight: '38px',
              fontWeight: '800',
              margin: '0 0 14px',
            },
          }, gradientHeadline(draft.subject)),
          React.createElement(Text, {
            style: {
              color: colors.text,
              fontSize: '17px',
              lineHeight: '28px',
              margin: '0 0 16px',
            },
          }, draft.previewText),
          React.createElement(Text, {
            style: {
              color: colors.muted,
              fontSize: '15px',
              lineHeight: '25px',
              margin: '0',
            },
          }, draft.intro),
        ),
        sectionCard({
          eyebrow: 'Shipping',
          title: draft.releaseHighlights.title,
          summary: draft.releaseHighlights.summary,
          links: draft.releaseHighlights.links,
          accent: colors.cyan,
          primaryLabel: 'View release notes',
        }),
        contributorCard(research),
        sectionCard({
          eyebrow: 'Community',
          title: draft.firstTimeContributorShoutOuts.title,
          summary: draft.firstTimeContributorShoutOuts.summary,
          links: draft.firstTimeContributorShoutOuts.links,
          accent: colors.orange,
          primaryLabel: 'Open contributor PR',
        }),
        sectionCard({
          eyebrow: 'Editorial',
          title: draft.latestBlogPost.title,
          summary: draft.latestBlogPost.summary,
          links: draft.latestBlogPost.links,
          accent: colors.pink,
          primaryLabel: 'Read the blog post',
        }),
        sectionCard({
          eyebrow: 'Events',
          title: draft.previousEventThankYou.title,
          summary: draft.previousEventThankYou.summary,
          links: draft.previousEventThankYou.links,
          accent: colors.violet,
          primaryLabel: 'View event recap',
        }),
        sectionCard({
          eyebrow: 'Upcoming',
          title: draft.upcomingEventReminder.title,
          summary: draft.upcomingEventReminder.summary,
          links: draft.upcomingEventReminder.links,
          accent: colors.cyan,
          primaryLabel: 'Reserve your spot',
        }),
        metadataCard(sourceMetadata),
        React.createElement(Hr, {
          style: {
            borderColor: colors.border,
            margin: '24px 0',
          },
        }),
        React.createElement(Text, {
          style: {
            color: colors.text,
            fontSize: '15px',
            lineHeight: '24px',
            margin: '0 0 8px',
          },
        }, draft.closing),
        React.createElement(Text, {
          style: {
            color: colors.muted,
            fontSize: '12px',
            lineHeight: '20px',
            margin: '0',
          },
        }, `Generated ${generatedAt} from ${research.sourceProject}. This artifact is Resend-ready but not sent in v1.`),
      ),
    ),
  );
}

export async function renderNewsletterEmail(input: {
  draft: NewsletterDraft;
  research: NewsletterResearch;
  generatedAt: string;
}): Promise<NewsletterEmailArtifact> {
  const component = React.createElement(NewsletterEmail, input);
  const html = await render(component, {
    pretty: true,
  });
  const text = toPlainText(html);
  const artifact = newsletterEmailArtifactSchema.parse({
    subject: input.draft.subject,
    previewText: input.draft.previewText,
    generatedAt: input.generatedAt,
    sourceProject: input.research.sourceProject,
    startDate: input.research.startDate,
    endDate: input.research.endDate,
    html,
    text: text.trim() || renderNewsletterBodyMarkdown(input.draft),
    sourceMetadata: buildNewsletterSourceMetadata(input.research),
    draft: input.draft,
  });

  return artifact;
}
