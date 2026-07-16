import { Octokit } from "@octokit/rest";

export const issueTools = [
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

export async function handleIssueTool(name: string, args: any, octokit: Octokit, org: string) {
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
        return { content: [{ type: "text", text: JSON.stringify(data.items.slice(0, 10).map((i: any) => ({
            title: i.title,
            url: i.html_url,
            state: i.state
        })), null, 2) }] };
    }
    
    throw new Error(`Unknown issue tool: ${name}`);
}
