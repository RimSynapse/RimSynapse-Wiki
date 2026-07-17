import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";

async function listAllIssues() {
    const token = getGitHubToken();
    const config = loadConfig();
    const octokit = new Octokit({ auth: token });
    
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
