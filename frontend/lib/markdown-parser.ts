/**
 * Markdown Parser Utility for AI Architect Summaries
 * 
 * Parses markdown content from AI responses into structured data format.
 * Handles various markdown formats including:
 * - Headers (#, ##, ###)
 * - Bold text (**text**)
 * - Bullet lists (- item, * item)
 * - Numbered lists (1. item)
 * - Key-value pairs (Key: Value)
 * - Code blocks (```code```)
 */

export interface ParsedAISummary {
    purpose: string;
    stack: {
        framework: string;
        language: string;
        runtime: string;
        database: string;
        orm: string;
        auth: string;
        packageManager?: string;
    };
    insights: string[];
    recommendations: string[];
    raw: {
        markdown: string;
        sections: string[];
    };
}

export interface ParsedAISummarySections {
    purpose: string;
    stack: { framework: string; language: string; runtime: string; database: string; orm: string; auth: string; };
    insights: string[];
    recommendations: string[];
    lifecycle?: string[];        // ← ADD
    quickStart?: string[];       // ← ADD
    authDetected?: boolean;      // ← ADD
    authEnvVars?: string[];      // ← ADD
}

function extractLifecycle(sections: Record<string, string>, markdown: string): string[] {
    const lifecycleKeys = ['request lifecycle', 'lifecycle', 'flow', 'execution flow'];
    for (const key of lifecycleKeys) {
        if (sections[key]) {
            const steps = sections[key]
                .replace(/→/g, '|')
                .split(/[|→]/)
                .map(s => s.trim())
                .filter(Boolean);
            if (steps.length > 0) return steps;
        }
    }
    return [];
}

function extractQuickStart(sections: Record<string, string>, markdown: string): string[] {
    const quickStartKeys = ['quick start', 'getting started', 'setup', 'installation'];
    for (const key of quickStartKeys) {
        if (sections[key]) {
            const items = sections[key]
                .split(/\n/)
                .filter(line => /^[-*•]|\d+\./.test(line.trim()))
                .map(line => line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
                .filter(Boolean);
            if (items.length > 0) return items;
        }
    }
    return [];
}

function extractAuthInfo(sections: Record<string, string>, markdown: string): { detected: boolean; envVars: string[] } {
    const authKeys = ['authentication', 'auth', 'security'];
    let detected = false;
    const envVars: string[] = [];

    for (const key of authKeys) {
        if (sections[key]) {
            const section = sections[key];
            detected = !/(?:no|none|not)\s*(?:detected|found|present|available|implemented)/i.test(section);
            const vars = section.match(/[A-Z_]{3,}_[A-Z_]{3,}/g) || [];
            envVars.push(...vars);
            break;
        }
    }
    return { detected, envVars };
}

// ── Update parseAISummary function ──
export function parseAISummary(markdown: string): ParsedAISummarySections {
    if (!markdown || typeof markdown !== 'string') {
        return getDefaultSummary();
    }

    const sections = extractSections(markdown);
    const authInfo = extractAuthInfo(sections, markdown);

    return {
        purpose: extractPurpose(sections, markdown),
        stack: extractStack(sections, markdown),
        insights: extractInsights(sections, markdown),
        recommendations: extractRecommendations(sections, markdown),
        lifecycle: extractLifecycle(sections, markdown),
        quickStart: extractQuickStart(sections, markdown),
        authDetected: authInfo.detected,
        authEnvVars: authInfo.envVars,
    };
}
/**
 * Extract sections from markdown based on headers
 */
function extractSections(markdown: string): Record<string, string> {
    const sections: Record<string, string> = {};

    // Split by headers (#, ##, ###)
    const lines = markdown.split('\n');
    let currentSection = 'intro';
    let currentContent: string[] = [];

    for (const line of lines) {
        // Check for header lines
        const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headerMatch) {
            // Save previous section
            if (currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            // Start new section
            currentSection = headerMatch[2].trim().toLowerCase();
            currentContent = [];
        } else if (line.trim()) {
            currentContent.push(line);
        }
    }

    // Save last section
    if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}

/**
 * Extract purpose/project description
 */
function extractPurpose(sections: Record<string, string>, markdown: string): string {
    // Try common section names
    const purposeKeys = ['purpose', 'project purpose', 'summary', 'introduction', 'overview'];

    for (const key of purposeKeys) {
        if (sections[key]) {
            return cleanText(sections[key]);
        }
    }

    // Fallback: find first paragraph after Project Purpose or similar
    const purposeMatch = markdown.match(/(?:project purpose|purpose|overview|summary)[\s:]*["“]?([^"“]*?)(?:["“]|$)/i);
    if (purposeMatch) {
        return purposeMatch[1].trim();
    }

    // Fallback: first paragraph
    const paragraphs = markdown.split('\n\n');
    for (const para of paragraphs) {
        const cleaned = cleanText(para);
        if (cleaned.length > 50 && !cleaned.startsWith('#')) {
            return cleaned;
        }
    }

    return '';
}

/**
 * Extract technology stack
 */
function extractStack(sections: Record<string, string>, markdown: string): {
    framework: string;
    language: string;
    runtime: string;
    database: string;
    orm: string;
    auth: string;
} {
    const stack: {
        framework: string;
        language: string;
        runtime: string;
        database: string;
        orm: string;
        auth: string;
    } = {
        framework: 'N/A',
        language: 'N/A',
        runtime: 'N/A',
        database: 'N/A',
        orm: 'N/A',
        auth: 'N/A',
    };

    // Try stack section
    const stackContent = sections['stack'] || sections['technical stack'] || sections['tech stack'] || '';

    if (stackContent) {
        // Parse key-value pairs
        const lines = stackContent.split('\n');
        for (const line of lines) {
            const match = line.match(/\*\*([^*]+)\*\*:\s*(.+)/);
            if (match) {
                const key = match[1].toLowerCase().trim();
                const value = match[2].trim();
                assignStackValue(stack, key, value);
            }
        }
    }

    // Parse from markdown
    const stackRegex = /\*\*(Framework|Language|Runtime|Database|ORM|Auth|Authentication|PackageManager)\*\*:\s*([^\n]+)/gi;
    let match;
    while ((match = stackRegex.exec(markdown)) !== null) {
        const key = match[1].toLowerCase().trim();
        const value = match[2].trim();
        assignStackValue(stack, key, value);
    }

    // Parse from table-like format
    const tableRegex = /\|\s*(Framework|Language|Runtime|Database|ORM|Auth)\s*\|/i;
    if (tableRegex.test(markdown)) {
        const tableLines = markdown.split('\n').filter(line => line.includes('|'));
        for (const line of tableLines) {
            const parts = line.split('|').map(s => s.trim());
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i].toLowerCase();
                const value = parts[i + 1];
                assignStackValue(stack, key, value);
            }
        }
    }

    return stack;
}

/**
 * Helper to assign stack values
 */
function assignStackValue(
    stack: {
        framework: string;
        language: string;
        runtime: string;
        database: string;
        orm: string;
        auth: string;
    },
    key: string,
    value: string
): void {
    if (key.includes('framework')) stack.framework = value || 'N/A';
    else if (key.includes('language')) stack.language = value || 'N/A';
    else if (key.includes('runtime')) stack.runtime = value || 'N/A';
    else if (key.includes('database')) stack.database = value || 'N/A';
    else if (key.includes('orm')) stack.orm = value || 'N/A';
    else if (key.includes('auth') || key.includes('authentication')) stack.auth = value || 'N/A';
}

/**
 * Extract insights from the content
 */
function extractInsights(sections: Record<string, string>, markdown: string): string[] {
    const insights: string[] = [];

    // Try insights section
    const insightKeys = ['insights', 'key insights', 'key points', 'highlights', 'key findings'];

    for (const key of insightKeys) {
        if (sections[key]) {
            const items = extractBulletItems(sections[key]);
            if (items.length > 0) {
                return items;
            }
        }
    }

    // Extract from markdown
    const bulletRegex = /^[-*]\s+(.+)$/gm;
    let match;
    while ((match = bulletRegex.exec(markdown)) !== null) {
        const text = cleanText(match[1]);
        if (text.length > 10 && !text.includes('Framework:') && !text.includes('Language:')) {
            insights.push(text);
        }
    }

    // Extract numbered items
    const numberedRegex = /^\d+\.\s+(.+)$/gm;
    while ((match = numberedRegex.exec(markdown)) !== null) {
        const text = cleanText(match[1]);
        if (text.length > 10) {
            insights.push(text);
        }
    }

    return insights.slice(0, 8);
}

/**
 * Extract recommendations
 */
function extractRecommendations(sections: Record<string, string>, markdown: string): string[] {
    const recommendations: string[] = [];

    // Try recommendations section
    const recKeys = ['recommendations', 'recommendation', 'next steps', 'suggestions', 'improvements', 'action items'];

    for (const key of recKeys) {
        if (sections[key]) {
            const items = extractBulletItems(sections[key]);
            if (items.length > 0) {
                return items;
            }
        }
    }

    // Extract from markdown
    const bulletRegex = /^[-*]\s+(.+)$/gm;
    let match;
    while ((match = bulletRegex.exec(markdown)) !== null) {
        const text = cleanText(match[1]);
        if (text.length > 10 &&
            !text.includes('Framework:') &&
            !text.includes('Language:') &&
            !text.includes('N/A')) {
            recommendations.push(text);
        }
    }

    return recommendations.slice(0, 10);
}

/**
 * Extract bullet items from text
 */
function extractBulletItems(text: string): string[] {
    const items: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        // Check for bullet points
        const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
        const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);

        if (bulletMatch) {
            const item = cleanText(bulletMatch[1]);
            if (item.length > 3) items.push(item);
        } else if (numberedMatch) {
            const item = cleanText(numberedMatch[1]);
            if (item.length > 3) items.push(item);
        }
    }

    return items;
}

/**
 * Clean text: remove extra whitespace, fix quotes
 */
function cleanText(text: string): string {
    return text
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/^["“]|["”]$/g, '') // Remove quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}

/**
 * Get default summary structure
 */
function getDefaultSummary(): ParsedAISummarySections {
    return {
        purpose: 'No AI summary available.',
        stack: {
            framework: 'N/A',
            language: 'N/A',
            runtime: 'N/A',
            database: 'N/A',
            orm: 'N/A',
            auth: 'N/A',
        },
        insights: ['No insights available.'],
        recommendations: ['No recommendations available.'],
    };
}

/**
 * Validate if the parsed summary has meaningful data
 */
export function isValidSummary(summary: ParsedAISummarySections): boolean {
    return (
        summary.purpose.length > 10 ||
        summary.insights.some(i => i.length > 10) ||
        summary.recommendations.some(r => r.length > 10)
    );
}

/**
 * Extract structured data from AI summary object
 * Handles both raw markdown and pre-structured data
 */
export function extractStructuredSummary(aiSummary: any): ParsedAISummarySections {
    // If already structured, use it
    if (aiSummary?.purpose && typeof aiSummary.purpose === 'string') {
        return {
            purpose: aiSummary.purpose || '',
            stack: {
                framework: aiSummary.stack?.framework || 'N/A',
                language: aiSummary.stack?.language || 'N/A',
                runtime: aiSummary.stack?.runtime || 'N/A',
                database: aiSummary.stack?.database || 'N/A',
                orm: aiSummary.stack?.orm || 'N/A',
                auth: aiSummary.stack?.auth || 'N/A',
            },
            insights: aiSummary.insights || [],
            recommendations: aiSummary.recommendations || [],
        };
    }

    // If markdown summary exists, parse it
    if (aiSummary?.markdownSummary) {
        const parsed = parseAISummary(aiSummary.markdownSummary);
        if (isValidSummary(parsed)) {
            return parsed;
        }
    }

    // Return default
    return getDefaultSummary();
}

/**
 * Check if AI summary contains stack information
 */
export function hasStackInfo(summary: ParsedAISummarySections): boolean {
    const stack = summary.stack;
    return (
        stack.framework !== 'N/A' ||
        stack.language !== 'N/A' ||
        stack.runtime !== 'N/A' ||
        stack.database !== 'N/A'
    );
}