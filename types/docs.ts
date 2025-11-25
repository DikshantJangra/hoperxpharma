export interface DocArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  summary: string;
  content: string; // Markdown content
  markdownPath?: string; // Optional path to markdown file
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string; // e.g., "5 min"
  roles: string[]; // e.g., ['admin', 'pharmacist', 'cashier']
  steps: string[];
  troubleshooting: string[];
  relatedArticles: string[]; // article IDs
  videoUrl?: string;
  lastUpdated: string;
  contributors: string[];
}

export interface DocCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  order: number;
  color: string; // Tailwind gradient classes
}

export interface SearchResult {
  article: DocArticle;
  score: number;
  matchedFields: string[];
}
