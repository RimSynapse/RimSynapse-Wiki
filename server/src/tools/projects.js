import { graphql } from "@octokit/graphql";
export const projectTools = [
    {
        name: "add_project_item",
        description: "Add an issue or pull request to a GitHub Project V2",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string", description: "Node ID of the Project V2" },
                contentId: { type: "string", description: "Node ID of the Issue or PR" }
            },
            required: ["contentId"]
        }
    },
    {
        name: "get_project_items",
        description: "List items in a GitHub Project V2",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string" }
            },
            required: []
        }
    }
];
export async function handleProjectTool(name, args, token, defaultProjectId) {
    const graphqlWithAuth = graphql.defaults({
        headers: {
            authorization: `token ${token}`
        }
    });
    if (name === "add_project_item") {
        const projectId = args.projectId || defaultProjectId;
        const query = `
            mutation($projectId: ID!, $contentId: ID!) {
                addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                    item {
                        id
                    }
                }
            }
        `;
        const result = await graphqlWithAuth(query, { projectId, contentId: args.contentId });
        return { content: [{ type: "text", text: `Added to project. Item ID: ${result.addProjectV2ItemById.item.id}` }] };
    }
    if (name === "get_project_items") {
        const projectId = args.projectId || defaultProjectId;
        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        items(first: 20) {
                            nodes {
                                id
                                content {
                                    ... on Issue { title url state }
                                    ... on PullRequest { title url state }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await graphqlWithAuth(query, { projectId });
        return { content: [{ type: "text", text: JSON.stringify(result.node.items.nodes, null, 2) }] };
    }
    throw new Error(`Unknown project tool: ${name}`);
}
