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
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const rest_1 = require("@octokit/rest");
const path = __importStar(require("path"));
// 1. Setup GitHub Client
const tokenFilePath = path.join(__dirname, "..", "..", "github_token.txt");
let githubToken = process.env.GITHUB_TOKEN;
const issues_1 = require("./tools/issues");
const projects_1 = require("./tools/projects");
const codebase_1 = require("./tools/codebase");
const testing_1 = require("./tools/testing");
const sync_1 = require("./tools/sync");
const config_1 = require("./config");
// 1. Setup Config & Auth
const config = (0, config_1.loadConfig)();
const token = (0, config_1.getGitHubToken)();
const octokit = new rest_1.Octokit({ auth: token });
// 2. Setup MCP Server
const server = new index_js_1.Server({
    name: "rimsynapse-mcp-server",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});
const ALL_TOOLS = [
    ...issues_1.issueTools,
    ...projects_1.projectTools,
    ...codebase_1.codebaseTools,
    ...testing_1.testingTools,
    ...sync_1.syncTools
];
// 3. Register Tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return { tools: ALL_TOOLS };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (issues_1.issueTools.some(t => t.name === name)) {
        return await (0, issues_1.handleIssueTool)(name, args, octokit, config.organization);
    }
    if (projects_1.projectTools.some(t => t.name === name)) {
        return await (0, projects_1.handleProjectTool)(name, args, token, config.defaultProjectId);
    }
    if (codebase_1.codebaseTools.some(t => t.name === name)) {
        return await (0, codebase_1.handleCodebaseTool)(name, args, octokit, config.organization);
    }
    if (testing_1.testingTools.some(t => t.name === name)) {
        return await (0, testing_1.handleTestingTool)(name, args, octokit, config.organization);
    }
    if (sync_1.syncTools.some(t => t.name === name)) {
        return await (0, sync_1.handleSyncTool)(name, args, config.organization, token);
    }
    throw new Error(`Unknown tool: ${name}`);
});
// 4. Start Server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("RimSynapse MCP Server running on stdio");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
