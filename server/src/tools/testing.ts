import { Octokit } from "@octokit/rest";
import * as fs from "fs";

export const testingTools = [
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

export async function handleTestingTool(name: string, args: any, octokit: Octokit, org: string) {
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
