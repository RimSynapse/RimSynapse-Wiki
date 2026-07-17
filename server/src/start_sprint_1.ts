import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";
import { Octokit } from "@octokit/rest";

async function startSprint() {
    const token = getGitHubToken();
    const config = loadConfig();
    const octokit = new Octokit({ auth: token });

    console.log("Creating new Issue 'Cross-Mod API Context Hooks'...");
    const issueRes = await octokit.issues.create({
        owner: "RimSynapse",
        repo: "Psychology",
        title: "[Roadmap Idea] Cross-Mod API Context Hooks",
        body: "Generic API for dynamic backstory context injection (e.g. generate.childhoodbackstory) to allow other mods like Conversations and Factions to hook in without bloating the core."
    });
    console.log(`Created Issue: ${issueRes.data.html_url}`);

    console.log("Adding Issue to Project Board...");
    const addRes: any = await handleProjectTool("add_project_item", { contentId: issueRes.data.node_id }, token, config.defaultProjectId);
    const text = addRes.content[0].text;
    const itemIdMatch = text.match(/Added item (PVTI_[a-zA-Z0-9]+) to project/);
    if (!itemIdMatch) {
        console.error("Could not extract Item ID!");
    }

    console.log("Fetching all project items...");
    const result: any = await handleProjectTool("get_project_items", {}, token, config.defaultProjectId);
    const items = JSON.parse(result.content[0].text);

    const iteration1Targets = [
        "[Roadmap Idea] High-Trust Insult Shield",
        "[Roadmap Idea] Familiarity Milestone Events",
        "[Roadmap Idea] Dynamic Trait History Timeline",
        "[Roadmap Idea] Faction Leader Context Injection Hooks",
        "[Roadmap Idea] Therapy Session Auto-Modes (Requires RimSynapse-Conversations)",
        "[Roadmap Idea] PTSD Counseling and Desensitization Therapy",
        "[Test Plan] RimSynapse-Psychology",
        "[Roadmap Idea] Backstory Arrival Memory Contract",
        "[Roadmap Idea] Cross-Mod API Context Hooks"
    ];

    const backlogTargets = [
        "[Roadmap Idea] Colony Cliques and The Rumor Mill",
        "[Roadmap Idea] Social Network Visualization"
    ];

    for (const item of items) {
        if (!item.content || !item.content.title) continue;

        if (iteration1Targets.includes(item.content.title)) {
            console.log(`Setting Iteration 1 & Planned for: ${item.content.title}`);
            await handleProjectTool("update_project_item_status", { itemId: item.id, status: "Planned" }, token, config.defaultProjectId);
            await handleProjectTool("update_project_item_iteration", { itemId: item.id, iterationName: "Iteration 1" }, token, config.defaultProjectId);
        } else if (backlogTargets.includes(item.content.title)) {
            console.log(`Setting Backlog for: ${item.content.title}`);
            await handleProjectTool("update_project_item_status", { itemId: item.id, status: "Backlog" }, token, config.defaultProjectId);
        }
    }

    console.log("Sprint 1 has officially started!");
}

startSprint().catch(console.error);
