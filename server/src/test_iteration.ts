import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";

async function testIteration() {
    const token = getGitHubToken();
    const config = loadConfig();
    
    // We'll use the query_wiki_database item we just finished.
    const itemId = "PVTI_lADOEfI01s4BdlhxzgzGp4U";
    
    console.log("Setting Iteration to Iteration 1...");
    let result: any = await handleProjectTool("update_project_item_iteration", {
        itemId,
        iterationName: "Iteration 1"
    }, token, config.defaultProjectId);
    console.log(result.content[0].text);
}

testIteration().catch(console.error);
