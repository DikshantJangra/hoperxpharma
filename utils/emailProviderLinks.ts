/**
 * Generate provider-specific webmail search links
 */

export interface EmailProviderInfo {
    name: string;
    iconType: 'gmail' | 'outlook' | 'generic';
    color: string;
}

/**
 * Get provider information for display
 */
export function getProviderInfo(provider: string): EmailProviderInfo {
    const normalizedProvider = provider?.toLowerCase() || '';

    switch (normalizedProvider) {
        case 'gmail':
            return {
                name: 'Gmail',
                iconType: 'gmail',
                color: '#EA4335',
            };
        case 'outlook':
        case 'office365':
            return {
                name: 'Outlook',
                iconType: 'outlook',
                color: '#0078D4',
            };
        default:
            return {
                name: provider || 'Email',
                iconType: 'generic',
                color: '#64748b',
            };
    }
}

/**
 * Generate a webmail search link for the sent email
 * This allows users to quickly find the email in their provider's webmail interface
 */
export function getProviderWebmailLink(
    provider: string,
    subject: string,
    sentAt?: Date | string
): string | null {
    const normalizedProvider = provider?.toLowerCase() || '';
    const encodedSubject = encodeURIComponent(subject);

    switch (normalizedProvider) {
        case 'gmail':
            // Gmail search by subject - opens in inbox with search query
            return `https://mail.google.com/mail/u/0/#search/subject%3A${encodedSubject}`;

        case 'outlook':
        case 'office365':
            // Outlook web search
            return `https://outlook.office.com/mail/search?q=subject:${encodedSubject}`;

        default:
            // No specific link for unknown providers
            return null;
    }
}

/**
 * Get a human-readable label for the webmail link button
 */
export function getWebmailLinkLabel(provider: string): string {
    const info = getProviderInfo(provider);
    return `View in ${info.name}`;
}
