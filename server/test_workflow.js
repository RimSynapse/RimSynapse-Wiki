import { handleIssueTool } from "./src/tools/issues";
import { handleProjectTool } from "./src/tools/projects";
import { handleTestingTool } from "./src/tools/testing";
import { Octokit } from "@octokit/rest";
import { loadConfig, getGitHubToken } from "./src/config";
import * as fs from "fs";
async function run() {
    try {
        const config = loadConfig();
        const token = getGitHubToken();
        const octokit = new Octokit({ auth: token });
        console.log("--- STARTING WORKFLOW ---");
        console.log("1. Executing 'create_issue' tool...");
        const issueRes = await handleIssueTool("create_issue", {
            repo: "Local-AI-Wrapper",
            title: "Feature: Embed RAG context for Local LLMs",
            body: "Embed a Retrieval-Augmented Generation (RAG) system directly into the mod. This will allow users to pass the RAG context to their local LLM, enabling the LLM to access relevant game/mod data easily."
        }, octokit, config.organization);
        console.log(issueRes.content[0].text);
        const nodeIdMatch = issueRes.content[0].text.match(/\(ID: (.*?)\)/);
        const nodeId = nodeIdMatch ? nodeIdMatch[1] : null;
        if (nodeId) {
            console.log("\n2. Executing 'add_project_item' tool...");
            const projRes = await handleProjectTool("add_project_item", { contentId: nodeId }, token, config.defaultProjectId);
            console.log(projRes.content[0].text);
        }
        console.log("\n3. Executing 'create_testing_plan_issues' tool...");
        fs.writeFileSync("temp_test_plan.md", "### Objective\nTest the new RAG embedding feature.\n\n### Checklist\n- [ ] Verify vector embeddings are correctly generated for RimWorld Defs.\n- [ ] Ensure RAG pipeline retrieves relevant nodes based on user queries.\n- [ ] Test context window limits when passing RAG chunks to the Local LLM wrapper.\n- [ ] Validate performance (no stuttering during retrieval).");
        const testRes = await handleTestingTool("create_testing_plan_issues", {
            repo: "Local-AI-Wrapper",
            planFilePath: "temp_test_plan.md",
            featureName: "RAG Embedding"
        }, octokit, config.organization);
        console.log(testRes.content[0].text);
        fs.unlinkSync("temp_test_plan.md");
        console.log("\n--- WORKFLOW COMPLETE ---");
    }
    catch (err) {
        console.error("Error running workflow:", err);
    }
}
run();
