"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueTools = void 0;
exports.handleIssueTool = handleIssueTool;
exports.issueTools = [
    {
        name: "create_issue",
        description: "Create a new GitHub issue in a repository",
        inputSchema: {
            type: "object",
            properties: {
                repo: { type: "string" },
                title: { type: "string" },
                body: { type: "string" }
            },
            required: ["repo", "title"]
        }
    },
    {
        name: "search_issues",
        description: "Search for issues and pull requests",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string" }
            },
            required: ["query"]
        }
    }
];
async function handleIssueTool(name, args, octokit, org) {
    if (name === "create_issue") {
        const { data } = await octokit.rest.issues.create({
            owner: org,
            repo: args.repo,
            title: args.title,
            body: args.body
        });
        return { content: [{ type: "text", text: `Issue created: ${data.html_url} (ID: ${data.node_id})` }] };
    }
    if (name === "search_issues") {
        const q = `${args.query} org:${org}`;
        const { data } = await octokit.rest.search.issuesAndPullRequests({ q });
        return { content: [{ type: "text", text: JSON.stringify(data.items.slice(0, 10).map((i) => ({
                        title: i.title,
                        url: i.html_url,
                        state: i.state
                    })), null, 2) }] };
    }
    throw new Error(`Unknown issue tool: ${name}`);
}
