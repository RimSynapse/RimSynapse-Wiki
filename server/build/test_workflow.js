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
const issues_1 = require("./tools/issues");
const projects_1 = require("./tools/projects");
const testing_1 = require("./tools/testing");
const rest_1 = require("@octokit/rest");
const config_1 = require("./config");
const fs = __importStar(require("fs"));
async function run() {
    try {
        const config = (0, config_1.loadConfig)();
        const token = (0, config_1.getGitHubToken)();
        const octokit = new rest_1.Octokit({ auth: token });
        console.log("--- STARTING WORKFLOW ---");
        console.log("1. Executing 'create_issue' tool with labels...");
        const issueRes = await (0, issues_1.handleIssueTool)("create_issue", {
            repo: "Local-AI-Wrapper",
            title: "Feature: Embed RAG context for Local LLMs",
            body: "Embed a Retrieval-Augmented Generation (RAG) system directly into the mod. This will allow users to pass the RAG context to their local LLM, enabling the LLM to access relevant game/mod data easily.",
            labels: ["feature", "good first issue"]
        }, octokit, config.organization);
        console.log(issueRes.content[0].text);
        const nodeIdMatch = issueRes.content[0].text.match(/\(ID: (.*?)\)/);
        const nodeId = nodeIdMatch ? nodeIdMatch[1] : null;
        const urlMatch = issueRes.content[0].text.match(/issues\/(\d+)/);
        const issueNumber = urlMatch ? parseInt(urlMatch[1], 10) : null;
        if (nodeId) {
            console.log("\n2. Executing 'add_project_item' tool...");
            const projRes = await (0, projects_1.handleProjectTool)("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
            console.log(projRes.content[0].text);
        }
        console.log("\n3. Executing 'create_testing_plan_issues' tool (commenting and status update)...");
        fs.writeFileSync("temp_test_plan.md", "### Objective\nTest the new RAG embedding feature.\n\n### Checklist\n- [ ] Verify vector embeddings are correctly generated for RimWorld Defs.\n- [ ] Ensure RAG pipeline retrieves relevant nodes based on user queries.\n- [ ] Test context window limits when passing RAG chunks to the Local LLM wrapper.\n- [ ] Validate performance (no stuttering during retrieval).");
        const testRes = await (0, testing_1.handleTestingTool)("create_testing_plan_issues", {
            repo: "Local-AI-Wrapper",
            planFilePath: "temp_test_plan.md",
            issueNumber: issueNumber
        }, octokit, config.organization, token, config.defaultProjectId);
        console.log(testRes.content[0].text);
        fs.unlinkSync("temp_test_plan.md");
        console.log("\n--- WORKFLOW COMPLETE ---");
    }
    catch (err) {
        console.error("Error running workflow:", err);
    }
}
run();
