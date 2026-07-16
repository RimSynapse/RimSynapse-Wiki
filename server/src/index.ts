import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";

// 1. Setup GitHub Client
const tokenFilePath = path.join(__dirname, "..", "..", "github_token.txt");
let githubToken = process.env.GITHUB_TOKEN;

import { issueTools, handleIssueTool } from "./tools/issues";
import { projectTools, handleProjectTool } from "./tools/projects";
import { codebaseTools, handleCodebaseTool } from "./tools/codebase";
import { testingTools, handleTestingTool } from "./tools/testing";
import { syncTools, handleSyncTool } from "./tools/sync";
import { loadConfig, getGitHubToken } from "./config";

// 1. Setup Config & Auth
const config = loadConfig();
const token = getGitHubToken();
const octokit = new Octokit({ auth: token });

// 2. Setup MCP Server
const server = new Server({
    name: "rimsynapse-mcp-server",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});

const ALL_TOOLS = [
    ...issueTools, 
    ...projectTools,
    ...codebaseTools,
    ...testingTools,
    ...syncTools
];

// 3. Register Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS as any };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params as any;
    
    if (issueTools.some(t => t.name === name)) {
        return await handleIssueTool(name, args, octokit, config.organization);
    }
    
    if (projectTools.some(t => t.name === name)) {
        return await handleProjectTool(name, args, token, config.defaultProjectId);
    }
    
    if (codebaseTools.some(t => t.name === name)) {
        return await handleCodebaseTool(name, args, octokit, config.organization);
    }
    
    if (testingTools.some(t => t.name === name)) {
        return await handleTestingTool(name, args, octokit, config.organization);
    }
    
    if (syncTools.some(t => t.name === name)) {
        return await handleSyncTool(name, args, config.organization, token);
    }
    
    throw new Error(`Unknown tool: ${name}`);
});

// 4. Start Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("RimSynapse MCP Server running on stdio");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
