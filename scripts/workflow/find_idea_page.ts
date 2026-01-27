import { Client } from "@notionhq/client";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const NOTION_TOKEN = process.env.NOTION_INTEGRATION_TOKEN || process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN");

const notion = new Client({ auth: NOTION_TOKEN });

async function findSpecificPage() {
    const query = 'Apply_to_current_project';
    console.log(`Searching for "${query}"...`);
    const response = await notion.search({
        query: query,
    });
    console.log(`Found ${response.results.length} results.`);
    for (const result of response.results) {
        const title = (result as any).properties?.Name?.title?.[0]?.plain_text ||
            (result as any).properties?.title?.title?.[0]?.plain_text ||
            (result as any).title?.[0]?.plain_text || "Untitled";
        console.log(`[${(result as any).object}] ${title} (${result.id})`);
    }
}

findSpecificPage().catch(console.error);
