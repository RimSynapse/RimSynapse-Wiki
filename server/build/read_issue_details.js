"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const config_1 = require("./config");
async function readIssueDetails() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const octokit = new rest_1.Octokit({ auth: token });
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
        console.log(`Labels: ${issue.labels.map((l) => l.name).join(", ")}`);
        console.log(`Body:\n${issue.body}`);
    }
}
readIssueDetails().catch(console.error);
