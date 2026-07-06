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

const githubApiBaseUrl = 'https://api.github.com';

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
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'devrel-newsroom',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (input.githubToken) {
    headers.Authorization = `Bearer ${input.githubToken}`;
  }

  const response = await fetchImpl(`${githubApiBaseUrl}/repos/${owner}/${repo}/releases?per_page=20`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`GitHub releases request failed with ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as GitHubReleaseApiRecord[];
  return payload.map(normalizeGitHubRelease);
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
