import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";
import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";

async function createTask() {
    const token = getGitHubToken();
    const config = loadConfig();
    const octokit = new Octokit({ auth: token });
    const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });

    console.log("Creating Issue 'Plan Iteration 2' on RimSynapse/Core...");
    const issueRes = await octokit.issues.create({
        owner: "RimSynapse",
        repo: "Core",
        title: "[Roadmap Idea] Plan Iteration 2",
        body: "Create a sprint plan for Iteration 2 (starting July 30th)."
    });
    console.log(`Created Issue: ${issueRes.data.html_url} (Node ID: ${issueRes.data.node_id})`);

    console.log("Adding Issue to Project Board...");
    const addRes: any = await handleProjectTool("add_project_item", { contentId: issueRes.data.node_id }, token, config.defaultProjectId);
    const text = addRes.content[0].text;
    console.log(text);
    
    // Extract Item ID from the text (e.g., "Added item PVTI_xxxxxxx to project.")
    const itemIdMatch = text.match(/Added item (PVTI_[a-zA-Z0-9]+) to project/);
    if (!itemIdMatch) {
        console.error("Could not extract Item ID!");
        return;
    }
    const itemId = itemIdMatch[1];
    
    console.log("Setting Status to 'Planned'...");
    await handleProjectTool("update_project_item_status", { itemId, status: "Planned" }, token, config.defaultProjectId);
    
    console.log("Setting Iteration to 'Iteration 1'...");
    await handleProjectTool("update_project_item_iteration", { itemId, iterationName: "Iteration 1" }, token, config.defaultProjectId);

    // Also let's set the Team to "Core" just to be neat
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

createTask().catch(console.error);
