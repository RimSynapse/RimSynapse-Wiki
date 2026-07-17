import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";
import { graphql } from "@octokit/graphql";

async function finishTask() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });

    const itemId = "PVTI_lADOEfI01s4BdlhxzgzHOHw";
    
    console.log("Setting Status to 'Planned'...");
    await handleProjectTool("update_project_item_status", { itemId, status: "Planned" }, token, config.defaultProjectId);
    
    console.log("Setting Iteration to 'Iteration 1'...");
    await handleProjectTool("update_project_item_iteration", { itemId, iterationName: "Iteration 1" }, token, config.defaultProjectId);

    const teamMutation = `
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
    await graphqlWithAuth(teamMutation, {
        projectId: config.defaultProjectId,
        itemId: itemId,
        fieldId: "PVTSSF_lADOEfI01s4BdlhxzhYGCEM",
        optionId: "9282166a" // Core team ID
    });

    console.log("Task successfully added to Iteration 1!");
}

finishTask().catch(console.error);
