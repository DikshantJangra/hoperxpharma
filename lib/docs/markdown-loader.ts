import matter from 'gray-matter';

export interface MarkdownArticle {
    frontmatter: {
        title: string;
        slug: string;
        category: string;
        tags: string[];
        summary: string;
        difficulty: string;
        last_updated: string;
        estimated_time: string;
    };
    content: string;
}

/**
 * Load and parse a markdown file from the public/docs directory
 * @param markdownPath - Path relative to /public (e.g., "/docs/getting-started/initial-setup.md")
 */
export async function loadMarkdownArticle(markdownPath: string): Promise<MarkdownArticle> {
    try {
        const response = await fetch(markdownPath);
        if (!response.ok) {
            throw new Error(`Failed to load markdown: ${response.statusText}`);
        }

        const text = await response.text();
        const { data, content } = matter(text);

        return {
            frontmatter: data as MarkdownArticle['frontmatter'],
            content: content.trim()
        };
    } catch (error) {
        console.error('Error loading markdown:', error);
        throw error;
    }
}

/**
 * Extract quick steps from markdown content
 * Looks for "Quick Steps" section and extracts numbered list
 */
export function extractQuickSteps(content: string): string[] {
    const quickStepsMatch = content.match(/Quick Steps[\s\S]*?\n((?:\d+\.[\s\S]*?\n)+)/);
    if (!quickStepsMatch) return [];

    const steps = quickStepsMatch[1]
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return steps;
}

/**
 * Extract troubleshooting items from markdown content
 * Looks for "Troubleshooting:" sections
 */
export function extractTroubleshooting(content: string): string[] {
    const troubleshootingMatch = content.match(/Troubleshooting:?\s*\n((?:[-•*][\s\S]*?\n)+)/g);
    if (!troubleshootingMatch) return [];

    const items = troubleshootingMatch.flatMap(match =>
        match
            .split('\n')
            .filter(line => line.trim().match(/^[-•*]/))
            .map(line => line.replace(/^[-•*]\s*/, '').trim())
    );

    return items;
}

/**
 * Extract related article links from markdown content
 */
export function extractRelatedArticles(content: string): string[] {
    const relatedMatch = content.match(/Related:(.+?)$/m);
    if (!relatedMatch) return [];

    const links = relatedMatch[1]
        .split(',')
        .map(link => {
            const match = link.match(/`([^`]+)`/);
            return match ? match[1].replace('/docs/', '') : null;
        })
        .filter(Boolean) as string[];

    return links;
}
