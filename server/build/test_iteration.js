"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
async function testIteration() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    // We'll use the query_wiki_database item we just finished.
    const itemId = "PVTI_lADOEfI01s4BdlhxzgzGp4U";
    console.log("Setting Iteration to Iteration 1...");
    let result = await (0, projects_1.handleProjectTool)("update_project_item_iteration", {
        itemId,
        iterationName: "Iteration 1"
    }, token, config.defaultProjectId);
    console.log(result.content[0].text);
}
testIteration().catch(console.error);
