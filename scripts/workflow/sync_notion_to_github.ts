import { Client } from "@notionhq/client";
import { Octokit } from "octokit";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Setup
dotenv.config({ path: path.join(__dirname, '../../.env') });

const NOTION_TOKEN = process.env.NOTION_INTEGRATION_TOKEN || process.env.NOTION_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

if (!NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN");
if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN for Octokit");

// Initialize Clients
const notion = new Client({ auth: NOTION_TOKEN });
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Default Configuration (Fallback)
const DEFAULT_OWNER = 'DivineAlways';
const DEFAULT_REPO = 'TradingMethods';

async function syncStrategies() {
    console.log(`🔌 Connecting to Notion & GitHub...`);

    const allResults = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;

    while (hasMore) {
        const notionResponse = await notion.search({
            sort: { direction: 'descending', timestamp: 'last_edited_time' },
            start_cursor: nextCursor,
        });
        allResults.push(...notionResponse.results);
        hasMore = notionResponse.has_more;
        nextCursor = notionResponse.next_cursor || undefined;
    }

    console.log(`\n--- 🕵️ Notion Search Report ---`);
    console.log(`Total Objects Found: ${allResults.length}`);

    for (const page of allResults) {
        const type = (page as any).object;
        const title = (page as any).properties?.Name?.title?.[0]?.plain_text ||
            (page as any).properties?.title?.title?.[0]?.plain_text ||
            (page as any).title?.[0]?.plain_text || "Untitled";

        console.log(`[${type.toUpperCase()}] ${title} (ID: ${page.id})`);
    }
    console.log(`--- End of Report ---\n`);

    for (const page of allResults) {
        if ((page as any).object !== 'page') continue;
        const titleFragments = (page as any).properties?.Name?.title ||
            (page as any).properties?.title?.title ||
            (page as any).title || [];

        let title = titleFragments.map((t: any) => t.plain_text).join('').replace(/\s+/g, ' ').trim();

        if (!title) {
            console.log(`  ⚠️ Skipping page with no title (ID: ${page.id})`);
            continue;
        }

        const keywords = [
            'ICC', 'OFI', 'Mean Reversion',
            'Blueprint', 'Feature', 'Bug', 'Refactor', 'Task', 'Idea', 'Project',
            '[Task]', '[Project]', '[Idea]', '[Blueprint]', '[Feature]', '[Bug]', '[Refactor]'
        ];
        const matchesKeyword = keywords.some(k => title.toLowerCase().includes(k.toLowerCase()));

        if (!matchesKeyword) {
            console.log(`  ⏭️ Skipping "${title}" (No keyword match)`);
            continue;
        }

        // 1. Determine Repository Dynamically
        const props = (page as any).properties;
        let currentOwner = DEFAULT_OWNER;
        let currentRepo = DEFAULT_REPO;

        // Check for 'GitHub Repo Link' as a URL property or a simple Text property
        const repoLink = props['GitHub Repo Link']?.url ||
            props['GitHub Repo Link']?.rich_text?.[0]?.plain_text;

        if (repoLink) {
            try {
                // Parse "https://github.com/owner/repo"
                const parts = repoLink.replace('https://github.com/', '').split('/');
                if (parts.length >= 2) {
                    currentOwner = parts[0];
                    currentRepo = parts[1].replace('.git', '').split('?')[0]; // Remove .git or query params
                    console.log(`📍 Dynamic Repo detected: ${currentOwner}/${currentRepo}`);
                }
            } catch (e) {
                console.warn(`⚠️ Failed to parse GitHub link: ${repoLink}. Using defaults.`);
            }
        }

        console.log(`\nProcessing Strategy/Task: ${title} -> ${currentOwner}/${currentRepo}`);

        // 2. Extract Content & Properties
        let body = `**Source**: [Notion Link](${(page as any).url})\n\n`;
        const metadata = [];

        if (props.Status?.select?.name || props.Status?.status?.name) {
            metadata.push(`- **Status**: ${props.Status.select?.name || props.Status.status?.name}`);
        }
        if (props['Tech Stack']?.multi_select) {
            const stack = props['Tech Stack'].multi_select.map((s: any) => s.name).join(', ');
            if (stack) metadata.push(`- **Tech Stack**: ${stack}`);
        }
        const priorityVal = props.Priority?.select?.name || props.Priority?.number;
        if (priorityVal !== undefined && priorityVal !== null) {
            metadata.push(`- **Priority**: ${priorityVal}`);
        }
        if (props['Definition of Done']?.rich_text) {
            const dod = props['Definition of Done'].rich_text.map((t: any) => t.plain_text).join('');
            if (dod) metadata.push(`- **Definition of Done**: ${dod}`);
        }

        if (metadata.length > 0) {
            body += `### 📋 Metadata\n${metadata.join('\n')}\n\n---\n\n`;
        }

        // Property Content
        const contentProp = props.Content;
        if (contentProp?.rich_text) {
            body += contentProp.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
        }

        // Block Content
        const blocks = await notion.blocks.children.list({ block_id: page.id });
        for (const block of blocks.results) {
            if ((block as any).type === 'paragraph') {
                body += (block as any).paragraph.rich_text.map((t: any) => t.plain_text).join('') + '\n';
            } else if ((block as any).type === 'heading_1') {
                body += '# ' + (block as any).heading_1.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
            } else if ((block as any).type === 'heading_2') {
                body += '## ' + (block as any).heading_2.rich_text.map((t: any) => t.plain_text).join('') + '\n\n';
            } else if ((block as any).type === 'bulleted_list_item') {
                body += '- ' + (block as any).bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('') + '\n';
            } else if ((block as any).type === 'to_do') {
                const check = (block as any).to_do.checked ? '[x]' : '[ ]';
                body += `${check} ` + (block as any).to_do.rich_text.map((t: any) => t.plain_text).join('') + '\n';
            }
        }

        // 3. Sync to GitHub
        try {
            const issues = await octokit.rest.search.issuesAndPullRequests({
                q: `repo:${currentOwner}/${currentRepo} is:issue "${title}" in:title`
            });

            const existingIssue = issues.data.items.find((i: any) => i.title === title);

            if (existingIssue) {
                console.log(`  ✅ Issue exists #${existingIssue.number}. Updating...`);
                await octokit.rest.issues.update({
                    owner: currentOwner,
                    repo: currentRepo,
                    issue_number: existingIssue.number,
                    body: body
                });
            } else {
                console.log(`  🆕 Creating new issue...`);
                await octokit.rest.issues.create({
                    owner: currentOwner,
                    repo: currentRepo,
                    title: title,
                    body: body,
                    labels: ['strategy-sync', 'automated']
                });
            }
        } catch (githubErr) {
            console.error(`❌ GitHub Sync failed for ${currentOwner}/${currentRepo}:`, (githubErr as any).message);
        }
    }
}

syncStrategies().catch(console.error);
