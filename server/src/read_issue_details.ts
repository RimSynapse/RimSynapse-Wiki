import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";

async function readIssueDetails() {
    const token = getGitHubToken();
    const config = loadConfig();
    const octokit = new Octokit({ auth: token });
    
    const issuesToFetch = [
        { repo: "Core", number: 4 },
        { repo: "Psychology", number: 16 }
    ];
    
    for (const item of issuesToFetch) {
        console.log(`\nFetching ${item.repo} #${item.number}...`);
        const { data: issue } = await octokit.rest.issues.get({
            owner: config.organization,
            repo: item.repo,
            issue_number: item.number
        });
        
        console.log(`Title: ${issue.title}`);
        console.log(`Labels: ${issue.labels.map((l: any) => l.name).join(", ")}`);
        console.log(`Body:\n${issue.body}`);
    }
}

readIssueDetails().catch(console.error);
