import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";

async function cleanup() {
    const token = getGitHubToken();
    const config = loadConfig();
    const octokit = new Octokit({ auth: token });
    const org = config.organization;
    const repo = "RimSynapse-Psychology";

    console.log(`Fetching open issues for ${org}/${repo}...`);
    const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: org,
        repo: repo,
        state: "open",
        per_page: 100
    });

    let closedCount = 0;
    for (const issue of issues) {
        if (issue.title.startsWith("[Roadmap Idea]") || issue.title.startsWith("[Test Plan] RimSynapse-Psychology")) {
            console.log(`Closing issue: ${issue.title}`);
            await octokit.rest.issues.update({
                owner: org,
                repo: repo,
                issue_number: issue.number,
                state: "closed"
            });
            closedCount++;
        }
    }
    console.log(`Closed ${closedCount} issues.`);
}

cleanup().catch(console.error);
