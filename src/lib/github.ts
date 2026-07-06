import {
  firstTimeContributorSchema,
  githubPullRequestSchema,
  type FirstTimeContributor,
  type GitHubPullRequest,
} from '../schemas/contributor.schema.ts';
import { githubReleaseSchema, type GitHubRelease } from '../schemas/release.schema.ts';

type GitHubReleaseApiRecord = {
  id: number;
  tag_name: string;
  name: string | null;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
  published_at: string | null;
  body: string | null;
  author: {
    login: string;
  } | null;
};

type GitHubPullRequestApiRecord = {
  number: number;
  title: string;
  html_url: string;
  merged_at: string | null;
  updated_at: string;
  user: {
    login: string;
  } | null;
};

const githubApiBaseUrl = 'https://api.github.com';

function buildGitHubHeaders(githubToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'devrel-newsroom',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

function trimReleaseSummary(body: string | null | undefined): string {
  if (!body) {
    return 'No release notes provided.';
  }

  const collapsed = body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ');

  if (!collapsed) {
    return 'No release notes provided.';
  }

  return collapsed.length <= 280 ? collapsed : `${collapsed.slice(0, 277).trimEnd()}...`;
}

function getRetryDelayMs(response: Response, attempt: number): number {
  const retryAfterSeconds = response.headers.get('retry-after');
  if (retryAfterSeconds) {
    const parsedSeconds = Number(retryAfterSeconds);
    if (Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
      return parsedSeconds * 1000;
    }
  }

  const rateLimitResetSeconds = response.headers.get('x-ratelimit-reset');
  if (rateLimitResetSeconds) {
    const parsedReset = Number(rateLimitResetSeconds);
    if (Number.isFinite(parsedReset) && parsedReset > 0) {
      return Math.max(parsedReset * 1000 - Date.now(), 1000);
    }
  }

  return Math.min(2000 * 2 ** attempt, 15000);
}

async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithGitHubRetry(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
  retries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetchImpl(url, init);

    if (response.ok) {
      return response;
    }

    const shouldRetry = (response.status === 403 || response.status === 429) && attempt < retries;
    if (!shouldRetry) {
      return response;
    }

    await wait(getRetryDelayMs(response, attempt));
  }

  throw new Error('GitHub request retry loop exhausted unexpectedly');
}

export function normalizeGitHubRelease(record: GitHubReleaseApiRecord): GitHubRelease {
  if (!record.published_at) {
    throw new Error(`Release ${record.tag_name} is missing published_at`);
  }

  return githubReleaseSchema.parse({
    id: record.id,
    tagName: record.tag_name,
    name: record.name?.trim() || record.tag_name,
    url: record.html_url,
    isPrerelease: record.prerelease,
    isDraft: record.draft,
    publishedAt: record.published_at,
    publishedDate: record.published_at.slice(0, 10),
    authorLogin: record.author?.login ?? 'unknown',
    summary: trimReleaseSummary(record.body),
  });
}

export function normalizeGitHubPullRequest(record: GitHubPullRequestApiRecord): GitHubPullRequest {
  if (!record.merged_at) {
    throw new Error(`Pull request #${record.number} is missing merged_at`);
  }

  return githubPullRequestSchema.parse({
    number: record.number,
    title: record.title.trim() || `PR #${record.number}`,
    url: record.html_url,
    authorLogin: record.user?.login ?? 'unknown',
    mergedAt: record.merged_at,
    mergedDate: record.merged_at.slice(0, 10),
  });
}

export function parseSourceProject(sourceProject: string): { owner: string; repo: string } {
  const [owner, repo, ...rest] = sourceProject.split('/').map(part => part.trim()).filter(Boolean);

  if (!owner || !repo || rest.length > 0) {
    throw new Error(`sourceProject must be in "owner/repo" format. Received: ${sourceProject}`);
  }

  return { owner, repo };
}

export async function fetchGitHubReleases(input: {
  sourceProject: string;
  githubToken?: string;
  fetchImpl?: typeof fetch;
}): Promise<GitHubRelease[]> {
  const { owner, repo } = parseSourceProject(input.sourceProject);
  const fetchImpl = input.fetchImpl ?? fetch;

  const response = await fetchImpl(`${githubApiBaseUrl}/repos/${owner}/${repo}/releases?per_page=20`, {
    headers: buildGitHubHeaders(input.githubToken),
  });

  if (!response.ok) {
    throw new Error(`GitHub releases request failed with ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as GitHubReleaseApiRecord[];
  return payload.map(normalizeGitHubRelease);
}

export async function fetchMergedPullRequests(input: {
  sourceProject: string;
  startDate?: string;
  githubToken?: string;
  fetchImpl?: typeof fetch;
  maxPages?: number;
}): Promise<GitHubPullRequest[]> {
  const { owner, repo } = parseSourceProject(input.sourceProject);
  const fetchImpl = input.fetchImpl ?? fetch;
  const maxPages = input.maxPages ?? 10;
  const pullRequests: GitHubPullRequest[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchImpl(
      `${githubApiBaseUrl}/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`,
      {
        headers: buildGitHubHeaders(input.githubToken),
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub pull requests request failed with ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as GitHubPullRequestApiRecord[];
    if (!payload.length) {
      break;
    }

    for (const record of payload) {
      if (record.merged_at) {
        pullRequests.push(normalizeGitHubPullRequest(record));
      }
    }

    const oldestUpdatedAt = payload[payload.length - 1]?.updated_at;
    if (input.startDate && oldestUpdatedAt && oldestUpdatedAt.slice(0, 10) < input.startDate) {
      break;
    }
  }

  return pullRequests;
}

export function filterReleasesByWindow(input: {
  releases: GitHubRelease[];
  startDate: string;
  endDate: string;
}): GitHubRelease[] {
  return input.releases.filter(release => {
    return release.publishedDate >= input.startDate && release.publishedDate <= input.endDate;
  });
}

export function filterPullRequestsByWindow(input: {
  pullRequests: GitHubPullRequest[];
  startDate: string;
  endDate: string;
}): GitHubPullRequest[] {
  return input.pullRequests
    .filter(pullRequest => {
      return pullRequest.mergedDate >= input.startDate && pullRequest.mergedDate <= input.endDate;
    })
    .sort((left, right) => {
      return left.mergedAt.localeCompare(right.mergedAt) || left.number - right.number;
    });
}

async function hasMergedPullRequestBefore(input: {
  sourceProject: string;
  authorLogin: string;
  mergedAt: string;
  githubToken?: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const { owner, repo } = parseSourceProject(input.sourceProject);
  const fetchImpl = input.fetchImpl ?? fetch;
  const query = `repo:${owner}/${repo} is:pr is:merged author:${input.authorLogin} merged:<${input.mergedAt}`;
  const url = `${githubApiBaseUrl}/search/issues?q=${encodeURIComponent(query)}&per_page=1`;

  const response = await fetchWithGitHubRetry(
    url,
    {
      headers: buildGitHubHeaders(input.githubToken),
    },
    fetchImpl,
  );

  if (!response.ok) {
    throw new Error(`GitHub contributor search failed with ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { total_count?: number };
  return (payload.total_count ?? 0) > 0;
}

export async function identifyFirstTimeContributors(input: {
  sourceProject: string;
  pullRequests: GitHubPullRequest[];
  historicalPullRequests?: GitHubPullRequest[];
  githubToken?: string;
  fetchImpl?: typeof fetch;
  hasPriorMergedPullRequest?: (args: {
    sourceProject: string;
    authorLogin: string;
    mergedAt: string;
  }) => Promise<boolean>;
}): Promise<FirstTimeContributor[]> {
  const seenAuthors = new Set<string>();
  const contributors: FirstTimeContributor[] = [];
  const pullRequests = [...input.pullRequests].sort((left, right) => {
    return left.mergedAt.localeCompare(right.mergedAt) || left.number - right.number;
  });
  const historicalPullRequests = [...(input.historicalPullRequests ?? input.pullRequests)].sort((left, right) => {
    return left.mergedAt.localeCompare(right.mergedAt) || left.number - right.number;
  });

  for (const pullRequest of pullRequests) {
    const authorLogin = pullRequest.authorLogin.trim();

    if (!authorLogin || authorLogin === 'unknown' || seenAuthors.has(authorLogin)) {
      continue;
    }

    const hasPriorInFetchedHistory = historicalPullRequests.some(candidate => {
      return candidate.authorLogin.trim() === authorLogin && candidate.mergedAt < pullRequest.mergedAt;
    });

    const hasPriorMergedPullRequest = hasPriorInFetchedHistory
      ? true
      : input.hasPriorMergedPullRequest
        ? await input.hasPriorMergedPullRequest({
            sourceProject: input.sourceProject,
            authorLogin,
            mergedAt: pullRequest.mergedAt,
          })
        : await hasMergedPullRequestBefore({
            sourceProject: input.sourceProject,
            authorLogin,
            mergedAt: pullRequest.mergedAt,
            githubToken: input.githubToken,
            fetchImpl: input.fetchImpl,
          });

    seenAuthors.add(authorLogin);

    if (!hasPriorMergedPullRequest) {
      contributors.push(firstTimeContributorSchema.parse({
        login: authorLogin,
        mergedAt: pullRequest.mergedAt,
        mergedDate: pullRequest.mergedDate,
        pullRequest,
      }));
    }
  }

  return contributors;
}
