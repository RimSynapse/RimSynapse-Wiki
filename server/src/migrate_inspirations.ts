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
        { name: "AuraAlgorithm", dir: "AuraAlgorithm" },
        { name: "Wiki", dir: "Wiki" }
    ];

    const workspaceRoot = path.join(__dirname, "..", "..", "..");

    for (const mod of modules) {
        console.log(`\n--- Processing ${mod.name} for inspirations ---`);
        
        const filesToCheck = ["inspirations.md", "inspirations2.md"];
        
        for (const file of filesToCheck) {
            let modDir = mod.dir;
            if (mod.dir === "Wiki" && !fs.existsSync(path.join(workspaceRoot, modDir, file))) {
               // Special case since Wiki seems to be mixed or missing
               if (fs.existsSync(path.join(workspaceRoot, "Repo-MCP", file))) {
                   modDir = "Repo-MCP"; // Only for reading file
               }
            }

            const filePath = path.join(workspaceRoot, modDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`Found ${file} in ${modDir}`);
                const content = fs.readFileSync(filePath, "utf8");
                
                // Strategy 1: Parse "### Feature X"
                if (content.includes("### Feature")) {
                    const features = content.split(/### Feature \d+(?:: )?/);
                    for (let i = 1; i < features.length; i++) {
                        const featureContent = features[i].trim();
                        if (featureContent.includes("<missing>")) {
                            const lines = featureContent.split("\n");
                            const title = lines[0].trim();
                            const body = featureContent.substring(title.length).trim();
                            
                            console.log(`Creating Issue: ${title}`);
                            const nodeId = await createIssue(octokit, org, mod.name, `[Roadmap Idea] ${title}`, body);
                            await handleProjectTool("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
                        }
                    }
                }

                // Strategy 2: Parse "## 3. Proposed MCP Tools"
                const mcpToolsIndex = content.indexOf("## 3. Proposed MCP Tools");
                if (mcpToolsIndex !== -1) {
                    const mcpSection = content.substring(mcpToolsIndex).split("---")[0];
                    const bulletPoints = mcpSection.split("\n- `");
                    
                    for (let i = 1; i < bulletPoints.length; i++) {
                        const point = bulletPoints[i].trim();
                        const titleMatch = point.match(/([^`]+)`: (.*)/);
                        
                        if (titleMatch) {
                            const title = `MCP Tool: ${titleMatch[1].trim()}`;
                            const body = titleMatch[2].trim();
                            
                            console.log(`Creating Issue: ${title}`);
                            const nodeId = await createIssue(octokit, org, mod.name, `[Roadmap Idea] ${title}`, body);
                            await handleProjectTool("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
                        }
                    }
                }
                
                // Strategy 3: Parse "## 2. What Changes (The MCP Shift)"
                const whatChangesIndex = content.indexOf("## 2. What Changes (The MCP Shift)");
                if (whatChangesIndex !== -1) {
                    const changesSection = content.substring(whatChangesIndex).split("---")[0];
                    const bulletPoints = changesSection.split("\n- **");
                    
                    for (let i = 1; i < bulletPoints.length; i++) {
                        const point = bulletPoints[i].trim();
                        const titleMatch = point.match(/([^**]+)\*\*: (.*)/s);
                        
                        if (titleMatch) {
                            const title = `MCP Shift: ${titleMatch[1].trim()}`;
                            const body = titleMatch[2].trim();
                            
                            console.log(`Creating Issue: ${title}`);
                            const nodeId = await createIssue(octokit, org, mod.name, `[Roadmap Idea] ${title}`, body);
                            await handleProjectTool("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
                        }
                    }
                }
            }
        }
    }
    console.log("\n--- INSPIRATIONS MIGRATION COMPLETE ---");
}

run().catch(console.error);
