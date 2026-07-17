"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
async function createIssue(octokit, org, repo, title, body) {
    const { data } = await octokit.rest.issues.create({
        owner: org,
        repo: repo,
        title: title,
        body: body
    });
    return data.node_id;
}
async function run() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const octokit = new rest_1.Octokit({ auth: token });
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
                            await (0, projects_1.handleProjectTool)("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
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
                            await (0, projects_1.handleProjectTool)("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
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
                            await (0, projects_1.handleProjectTool)("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
                        }
                    }
                }
            }
        }
    }
    console.log("\n--- INSPIRATIONS MIGRATION COMPLETE ---");
}
run().catch(console.error);
