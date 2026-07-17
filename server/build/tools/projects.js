"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectTools = void 0;
exports.handleProjectTool = handleProjectTool;
const graphql_1 = require("@octokit/graphql");
exports.projectTools = [
    {
        name: "add_project_item",
        description: "Add an issue or pull request to the RimSynapse Roadmap project.",
        inputSchema: {
            type: "object",
            properties: {
                contentId: { type: "string", description: "The node ID of the issue or PR to add." },
                projectId: { type: "string", description: "Optional project node ID. Uses default if not provided." }
            },
            required: ["contentId"]
        }
    },
    {
        name: "get_project_items",
        description: "Get all items currently on the RimSynapse Roadmap project.",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string", description: "Optional project node ID. Uses default if not provided." }
            }
        }
    },
    {
        name: "update_project_item_status",
        description: "Update the status of a project item (e.g. 'Todo', 'In progress', 'Done').",
        inputSchema: {
            type: "object",
            properties: {
                itemId: { type: "string", description: "The node ID of the project item." },
                status: { type: "string", description: "The new status name (e.g. 'Todo', 'In progress', 'Done')." },
                projectId: { type: "string", description: "Optional project node ID. Uses default if not provided." }
            },
            required: ["itemId", "status"]
        }
    },
    {
        name: "cleanup_project_board",
        description: "Scans the project board for any items that are marked as CLOSED on GitHub, and automatically moves their project status to 'Done'.",
        inputSchema: {
            type: "object",
            properties: {
                projectId: { type: "string", description: "Optional project node ID. Uses default if not provided." }
            }
        }
    },
    {
        name: "update_project_item_iteration",
        description: "Assigns a project item to a specific sprint/iteration.",
        inputSchema: {
            type: "object",
            properties: {
                itemId: { type: "string", description: "The node ID of the project item." },
                iterationName: { type: "string", description: "The name of the iteration (e.g. 'Iteration 1', 'Iteration 2')." },
                projectId: { type: "string", description: "Optional project node ID." }
            },
            required: ["itemId", "iterationName"]
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
                        items(first: 100) {
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
        // Status Options: "Backlog" -> f75ad846, "In progress" -> 47fc9ee4, "Done" -> 98236657, "Planned" -> ce548ea0
        const fieldId = "PVTSSF_lADOEfI01s4BdlhxzhYGB9g";
        let optionId = "";
        const requestedStatus = args.status.toLowerCase();
        if (requestedStatus.includes("todo") || requestedStatus.includes("backlog"))
            optionId = "f75ad846";
        else if (requestedStatus.includes("progress"))
            optionId = "47fc9ee4";
        else if (requestedStatus.includes("done") || requestedStatus.includes("completed"))
            optionId = "98236657";
        else if (requestedStatus.includes("plan"))
            optionId = "ce548ea0";
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
    if (name === "cleanup_project_board") {
        const projectId = args.projectId || defaultProjectId;
        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        items(first: 100) {
                            nodes {
                                id
                                content {
                                    ... on Issue {
                                        title
                                        state
                                    }
                                    ... on PullRequest {
                                        title
                                        state
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        const result = await graphqlWithAuth(query, { projectId });
        const items = result.node.items.nodes;
        let cleaned = 0;
        const fieldId = "PVTSSF_lADOEfI01s4BdlhxzhYGB9g";
        const optionId = "98236657"; // "Done" option ID
        const mutation = `
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                updateProjectV2ItemFieldValue(
                    input: {
                        projectId: $projectId
                        itemId: $itemId
                        fieldId: $fieldId
                        value: { singleSelectOptionId: $optionId }
                    }
                ) { projectV2Item { id } }
            }
        `;
        for (const item of items) {
            if (item.content && item.content.state === "CLOSED") {
                await graphqlWithAuth(mutation, { projectId, itemId: item.id, fieldId, optionId });
                cleaned++;
            }
        }
        return { content: [{ type: "text", text: `Cleanup complete. Moved ${cleaned} closed items to 'Done'.` }] };
    }
    if (name === "update_project_item_iteration") {
        const projectId = args.projectId || defaultProjectId;
        const fieldId = "PVTIF_lADOEfI01s4BdlhxzhYGCEQ"; // Iteration Field ID
        let iterationId = "";
        const iterName = args.iterationName.toLowerCase();
        if (iterName.includes("1"))
            iterationId = "381c7c80";
        else if (iterName.includes("2"))
            iterationId = "54cf5c95";
        else if (iterName.includes("3"))
            iterationId = "d2c335bc";
        else
            throw new Error(`Unknown iteration: ${args.iterationName}`);
        const mutation = `
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $iterationId: String!) {
                updateProjectV2ItemFieldValue(
                    input: {
                        projectId: $projectId
                        itemId: $itemId
                        fieldId: $fieldId
                        value: { iterationId: $iterationId }
                    }
                ) { projectV2Item { id } }
            }
        `;
        const result = await graphqlWithAuth(mutation, { projectId, itemId: args.itemId, fieldId, iterationId });
        return { content: [{ type: "text", text: `Iteration updated for item ${result.updateProjectV2ItemFieldValue.projectV2Item.id}` }] };
    }
    throw new Error(`Unknown project tool: ${name}`);
}
