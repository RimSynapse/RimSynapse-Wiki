"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectTools = void 0;
exports.handleProjectTool = handleProjectTool;
const graphql_1 = require("@octokit/graphql");
exports.projectTools = [
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
    },
    {
        name: "update_project_item_status",
        description: "Update the status of a GitHub Project V2 item (e.g. 'Todo', 'In progress', 'Done')",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string", description: "Node ID of the Project V2" },
                itemId: { type: "string", description: "Node ID of the Project Item to update" },
                status: { type: "string", description: "The status string exactly as it appears in the project (e.g. 'Todo', 'In progress', 'Done')" }
            },
            required: ["itemId", "status"]
        }
    }
];
async function handleProjectTool(name, args, token, defaultProjectId) {
    const graphqlWithAuth = graphql_1.graphql.defaults({
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
    if (name === "update_project_item_status") {
        const projectId = args.projectId || defaultProjectId;
        // Use hardcoded IDs found via our manual query:
        // Status Field ID: PVTSSF_lADOEfI01s4BdlhxzhYGB9g
        // Status Options: "Todo" -> f75ad846, "In progress" -> 47fc9ee4, "Done" -> 98236657
        const fieldId = "PVTSSF_lADOEfI01s4BdlhxzhYGB9g";
        let optionId = "";
        const requestedStatus = args.status.toLowerCase();
        if (requestedStatus.includes("todo") || requestedStatus.includes("backlog"))
            optionId = "f75ad846";
        else if (requestedStatus.includes("progress"))
            optionId = "47fc9ee4";
        else if (requestedStatus.includes("done") || requestedStatus.includes("completed"))
            optionId = "98236657";
        else
            throw new Error(`Unknown status: ${args.status}`);
        const mutation = `
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                updateProjectV2ItemFieldValue(
                    input: {
                        projectId: $projectId
                        itemId: $itemId
                        fieldId: $fieldId
                        value: { 
                            singleSelectOptionId: $optionId 
                        }
                    }
                ) {
                    projectV2Item {
                        id
                    }
                }
            }
        `;
        const result = await graphqlWithAuth(mutation, { projectId, itemId: args.itemId, fieldId, optionId });
        return { content: [{ type: "text", text: `Status updated successfully for item ${result.updateProjectV2ItemFieldValue.projectV2Item.id}` }] };
    }
    throw new Error(`Unknown project tool: ${name}`);
}
