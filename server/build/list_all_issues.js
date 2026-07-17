"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const config_1 = require("./config");
async function listAllIssues() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const octokit = new rest_1.Octokit({ auth: token });
    const repos = [
        "Core",
        "Conversations",
        "Psychology",
        "Factions",
        "Local-AI-Wrapper",
        "NVIDIA-Tool",
        "WorldNews",
        "AuraAlgorithm"
    ];
    for (const repo of repos) {
        console.log(`\n=== Repository: ${repo} ===`);
        const { data: issues } = await octokit.rest.issues.listForRepo({
            owner: config.organization,
            repo: repo,
            state: "all"
        });
        for (const issue of issues) {
            console.log(`- #${issue.number} [${issue.state.toUpperCase()}] Title: "${issue.title}" (${issue.html_url})`);
        }
    }
}
listAllIssues().catch(console.error);
