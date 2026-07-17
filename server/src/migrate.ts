import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";
import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";

async function createIssue(octokit: Octokit, org: string, repo: string, title: string, body: string) {
    const { data } = await octokit.rest.issues.create({
        owner: org,
        repo: repo,
        title: title,
        body: body
    });
    return data.node_id;
}

async function run() {
    const token = getGitHubToken();
    const config = loadConfig();
    const octokit = new Octokit({ auth: token });
    const org = config.organization;

    const modules = [
        { name: "RimSynapse-Chat", dir: "Conversations" },
        { name: "RimSynapse-Core", dir: "Core" },
        { name: "RimSynapse-Factions", dir: "Factions" },
        { name: "Local-AI-Wrapper", dir: "Local-AI-Wrapper" },
        { name: "RimSynapse-NVIDIA-Tool", dir: "NVIDIA-Tool" },
        { name: "RimSynapse-WorldNews", dir: "WorldNews" },
        { name: "AuraAlgorithm", dir: "AuraAlgorithm" }
    ];

    const workspaceRoot = path.join(__dirname, "..", "..", "..");

    for (const mod of modules) {
        console.log(`\n--- Processing ${mod.name} ---`);
        
        // 1. Testing Plans
        const testPlanName = mod.dir === "Conversations" ? "Chat_Testing_Plan.md" : `${mod.dir}_Testing_Plan.md`;
        const testPlanPath = path.join(workspaceRoot, mod.dir, "Development", testPlanName);
        
        if (fs.existsSync(testPlanPath)) {
            const content = fs.readFileSync(testPlanPath, "utf8");
            const issueBody = `**Assigned to: Testing Team**\n\n${content}`;
            console.log(`Creating Testing Plan Issue for ${mod.name}...`);
            const nodeId = await createIssue(octokit, org, mod.name, `[Test Plan] ${mod.name}`, issueBody);
            await handleProjectTool("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
            console.log(`Mapped Testing Plan to Project!`);
        }

        // 2. Future Features
        const futurePath = path.join(workspaceRoot, mod.dir, "FutureFeatures.md");
        if (fs.existsSync(futurePath)) {
            const content = fs.readFileSync(futurePath, "utf8");
            
            // Extremely simple parsing: Find "Unimplemented Features" or "Backlog", split by "### "
            const backlogIndex = content.indexOf("Unimplemented Features");
            if (backlogIndex !== -1) {
                const backlogContent = content.substring(backlogIndex);
                const features = backlogContent.split(/\n### |\n#### /);
                
                // Skip the first split which is the header text
                for (let i = 1; i < features.length; i++) {
                    const featureLines = features[i].trim().split("\n");
                    const title = featureLines[0].trim();
                    const body = featureLines.slice(1).join("\n").trim();
                    
                    if (title && !title.startsWith("Tier")) {
                        console.log(`Creating Future Feature Issue: ${title}...`);
                        const issueTitle = `[Roadmap Idea] ${title}`;
                        const nodeId = await createIssue(octokit, org, mod.name, issueTitle, body);
                        await handleProjectTool("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
                        console.log(`Mapped '${title}' to Project!`);
                    }
                }
            }
        }
    }
    console.log("\n--- MIGRATION COMPLETE ---");
}

run().catch(console.error);
