import { DocArticle, SearchResult } from '@/types/docs';
import { ARTICLES } from './articles';

/**
 * Search articles by query string
 * Searches across title, summary, content, and tags
 */
export function searchArticles(
    query: string,
    options: {
        category?: string;
        role?: string;
        difficulty?: string;
        limit?: number;
    } = {}
): SearchResult[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const article of ARTICLES) {
        // Apply filters
        if (options.category && article.category !== options.category) {
            continue;
        }

        if (options.role && !article.roles.includes(options.role) && !article.roles.includes('all')) {
            continue;
        }

        if (options.difficulty && article.difficulty !== options.difficulty) {
            continue;
        }

        // Calculate relevance score
        let score = 0;
        const matchedFields: string[] = [];

        // Title match (highest weight)
        if (article.title.toLowerCase().includes(searchTerm)) {
            score += 10;
            matchedFields.push('title');
        }

        // Tag match (high weight)
        const tagMatch = article.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        if (tagMatch) {
            score += 8;
            matchedFields.push('tags');
        }

        // Summary match (medium weight)
        if (article.summary.toLowerCase().includes(searchTerm)) {
            score += 5;
            matchedFields.push('summary');
        }

        // Content match (lower weight)
        if (article.content.toLowerCase().includes(searchTerm)) {
            score += 3;
            matchedFields.push('content');
        }

        // Steps match
        const stepMatch = article.steps.some(step => step.toLowerCase().includes(searchTerm));
        if (stepMatch) {
            score += 4;
            matchedFields.push('steps');
        }

        // Add to results if any match
        if (score > 0) {
            results.push({
                article,
                score,
                matchedFields,
            });
        }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    if (options.limit) {
        return results.slice(0, options.limit);
    }

    return results;
}

/**
 * Get search suggestions based on partial query
 */
export function getSearchSuggestions(query: string, limit: number = 5): string[] {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions = new Set<string>();

    for (const article of ARTICLES) {
        // Add matching titles
        if (article.title.toLowerCase().includes(searchTerm)) {
            suggestions.add(article.title);
        }

        // Add matching tags
        article.tags.forEach(tag => {
            if (tag.toLowerCase().includes(searchTerm)) {
                suggestions.add(tag);
            }
        });

        if (suggestions.size >= limit) {
            break;
        }
    }

    return Array.from(suggestions).slice(0, limit);
}

/**
 * Get popular search terms
 */
export function getPopularSearches(): string[] {
    return [
        'create sale',
        'add product',
        'prescription',
        'refund',
        'inventory',
        'receipt',
        'GST',
        'reports'
    ];
}

/**
 * Filter articles by multiple criteria
 */
export function filterArticles(filters: {
    categories?: string[];
    roles?: string[];
    difficulties?: string[];
    tags?: string[];
}): DocArticle[] {
    return ARTICLES.filter(article => {
        // Category filter
        if (filters.categories && filters.categories.length > 0) {
            if (!filters.categories.includes(article.category)) {
                return false;
            }
        }

        // Role filter
        if (filters.roles && filters.roles.length > 0) {
            const hasRole = filters.roles.some(role =>
                article.roles.includes(role) || article.roles.includes('all')
            );
            if (!hasRole) {
                return false;
            }
        }

        // Difficulty filter
        if (filters.difficulties && filters.difficulties.length > 0) {
            if (!filters.difficulties.includes(article.difficulty)) {
                return false;
            }
        }

        // Tag filter
        if (filters.tags && filters.tags.length > 0) {
            const hasTag = filters.tags.some(tag => article.tags.includes(tag));
            if (!hasTag) {
                return false;
            }
        }

        return true;
    });
}
