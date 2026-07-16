"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const config_1 = require("./config");
async function deduplicate() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const octokit = new rest_1.Octokit({ auth: token });
    const org = config.organization;
    const modules = [
        "RimSynapse-Chat", "RimSynapse-Core", "RimSynapse-Factions",
        "Local-AI-Wrapper", "RimSynapse-NVIDIA-Tool", "RimSynapse-Psychology",
        "RimSynapse-WorldNews", "AuraAlgorithm"
    ];
    let totalClosed = 0;
    for (const repo of modules) {
        console.log(`\nChecking duplicates in ${org}/${repo}...`);
        try {
            const { data: issues } = await octokit.rest.issues.listForRepo({
                owner: org,
                repo: repo,
                state: "open",
                per_page: 100
            });
            const seenTitles = new Set();
            // Sort issues by created_at (oldest first), so we keep the original and close the newer duplicates
            issues.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            for (const issue of issues) {
                if (issue.title.startsWith("[Roadmap Idea]") || issue.title.startsWith("[Test Plan]")) {
                    if (seenTitles.has(issue.title)) {
                        console.log(`Closing duplicate issue: ${issue.title} (#${issue.number})`);
                        await octokit.rest.issues.update({
                            owner: org,
                            repo: repo,
                            issue_number: issue.number,
                            state: "closed"
                        });
                        totalClosed++;
                    }
                    else {
                        seenTitles.add(issue.title);
                    }
                }
            }
        }
        catch (e) {
            if (e.status !== 404) {
                console.error(`Error processing ${repo}:`, e.message);
            }
        }
    }
    console.log(`\nTotal duplicate issues closed: ${totalClosed}`);
}
deduplicate().catch(console.error);
