import { Octokit } from "octokit";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getIssue() {
    const owner = 'DivineAlways';
    const repo = 'trading_app';
    const searchTitle = 'Technical Trading Structure';

    console.log(`Searching for issue in ${owner}/${repo}...`);

    const issues = await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} is:issue "${searchTitle}" in:title`
    });

    if (issues.data.items.length === 0) {
        console.log("Issue not found.");
        return;
    }

    const issue = issues.data.items[0];
    console.log(`Found Issue #${issue.number}: ${issue.title}`);
    console.log(`\n--- BODY START ---\n`);
    console.log(issue.body);
    console.log(`\n--- BODY END ---\n`);
}

getIssue();
