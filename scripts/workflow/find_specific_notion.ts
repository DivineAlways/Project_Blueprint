import { Client } from "@notionhq/client";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const NOTION_TOKEN = process.env.NOTION_INTEGRATION_TOKEN || process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN");

const notion = new Client({ auth: NOTION_TOKEN });

async function findDb() {
    console.log("Searching for 'Build Task'...");
    const response = await notion.search({
        query: 'Build Task',
        filter: { property: 'object', value: 'database' }
    });
    console.log(`Found ${response.results.length} results.`);
    for (const result of response.results) {
        const title = (result as any).title?.[0]?.plain_text || "Untitled";
        console.log(`[database] ${title} (${result.id})`);
    }

    console.log("\nSearching for '[Task] The \"Observability Architect\"'...");
    const pageResponse = await notion.search({
        query: '[Task]',
    });
    for (const result of pageResponse.results) {
        const title = (result as any).properties?.Name?.title?.[0]?.plain_text ||
            (result as any).properties?.title?.title?.[0]?.plain_text ||
            (result as any).title?.[0]?.plain_text || "Untitled";
        console.log(`[${(result as any).object}] ${title} (${result.id})`);
    }
}

findDb().catch(console.error);
