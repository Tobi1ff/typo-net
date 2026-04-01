export interface GitHubRepoData {
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  description: string;
}

export async function fetchGitHubRepo(repoUrl: string): Promise<GitHubRepoData | null> {
  try {
    // Extract owner and repo from URL
    // e.g., https://github.com/facebook/react
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      updatedAt: data.updated_at,
      description: data.description,
    };
  } catch (error) {
    console.error('Error fetching GitHub repo:', error);
    return null;
  }
}
