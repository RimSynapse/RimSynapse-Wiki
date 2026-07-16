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
exports.testingTools = void 0;
exports.handleTestingTool = handleTestingTool;
const fs = __importStar(require("fs"));
exports.testingTools = [
    {
        name: "create_testing_plan_issues",
        description: "Parse a local testing plan Markdown file and create a tracking issue on GitHub",
        inputSchema: {
            type: "object",
            properties: {
                repo: { type: "string", description: "The repository to create the issue in" },
                planFilePath: { type: "string", description: "Absolute local path to the testing plan MD file" },
                featureName: { type: "string", description: "Name of the feature being tested" }
            },
            required: ["repo", "planFilePath", "featureName"]
        }
    }
];
async function handleTestingTool(name, args, octokit, org) {
    if (name === "create_testing_plan_issues") {
        if (!fs.existsSync(args.planFilePath)) {
            throw new Error(`Testing plan file not found: ${args.planFilePath}`);
        }
        const content = fs.readFileSync(args.planFilePath, "utf8");
        // Basic checklist extraction logic could go here, 
        // but for now we'll just push the raw testing plan body as the issue content
        // so the user can check off the boxes natively in GitHub.
        const issueBody = `## Testing Plan for ${args.featureName}\n\n${content}`;
        const { data } = await octokit.rest.issues.create({
            owner: org,
            repo: args.repo,
            title: `[Test Plan] ${args.featureName}`,
            body: issueBody
        });
        return { content: [{ type: "text", text: `Testing Plan issue created: ${data.html_url} (Node ID: ${data.node_id})` }] };
    }
    throw new Error(`Unknown testing tool: ${name}`);
}
