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
            await (0, projects_1.handleProjectTool)("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
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
                        await (0, projects_1.handleProjectTool)("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
                        console.log(`Mapped '${title}' to Project!`);
                    }
                }
            }
        }
    }
    console.log("\n--- MIGRATION COMPLETE ---");
}
run().catch(console.error);
