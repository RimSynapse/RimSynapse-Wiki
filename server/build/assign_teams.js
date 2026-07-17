"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const graphql_1 = require("@octokit/graphql");
const projects_1 = require("./tools/projects");
async function assignTeams() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const graphqlWithAuth = graphql_1.graphql.defaults({ headers: { authorization: `token ${token}` } });
    // Team mapping based on repo names
    const teamMapping = {
        "Core": "9282166a",
        "Conversations": "8a5d08e5",
        "Factions": "478d0b17",
        "AuraAlgorithm": "2a044e89",
        "LLM-Trainer": "9991bc94",
        "RimSynapse-NVIDIA-Tool": "7fb9b254",
        "RimSynapse-Psychology": "9f4284f8",
        "RimSynapse-WorldNews": "fbeb1893",
        // Additional aliases for consistency based on standard github org names we used
        "RimSynapse-Chat": "8a5d08e5",
        "RimSynapse-Core": "9282166a",
        "RimSynapse-Factions": "478d0b17",
        "NVIDIA-Tool": "7fb9b254",
        "Psychology": "9f4284f8",
        "WorldNews": "fbeb1893"
    };
    console.log("Fetching project items...");
    const result = await (0, projects_1.handleProjectTool)("get_project_items", {}, token, config.defaultProjectId);
    const itemsText = result.content[0].text;
    const items = JSON.parse(itemsText);
    let assigned = 0;
    let skipped = 0;
    const projectId = config.defaultProjectId;
    const fieldId = "PVTSSF_lADOEfI01s4BdlhxzhYGCEM"; // Team field ID
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
        if (!item.content || !item.content.url)
            continue;
        // URL format: https://github.com/RimSynapse/RimSynapse-Psychology/issues/25
        const parts = item.content.url.split("/");
        if (parts.length >= 5) {
            const repo = parts[4];
            const optionId = teamMapping[repo];
            if (optionId) {
                console.log(`Assigning ${item.content.title} (${repo}) to Team ID ${optionId}`);
                await graphqlWithAuth(mutation, { projectId, itemId: item.id, fieldId, optionId });
                assigned++;
            }
            else {
                console.log(`Skipping ${item.content.title} - No mapping for repo ${repo}`);
                skipped++;
            }
        }
    }
    console.log(`\nTeam Assignment Complete. Assigned: ${assigned}, Skipped: ${skipped}`);
}
assignTeams().catch(console.error);
