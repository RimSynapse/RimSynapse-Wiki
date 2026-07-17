"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
const graphql_1 = require("@octokit/graphql");
async function completeItems() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const graphqlWithAuth = graphql_1.graphql.defaults({
        headers: { authorization: `token ${token}` }
    });
    console.log("Fetching project items to complete...");
    const result = await (0, projects_1.handleProjectTool)("get_project_items", {}, token, config.defaultProjectId);
    const itemsText = result.content[0].text;
    const items = JSON.parse(itemsText);
    const targets = [
        "[Roadmap Idea] MCP Tool: query_wiki_database",
        "[Roadmap Idea] MCP Shift: Mod Lore Access",
        "[Roadmap Idea] MCP Shift: Intelligent Referencing"
    ];
    for (const item of items) {
        if (item.content && item.content.title && targets.includes(item.content.title)) {
            console.log(`Completing: ${item.content.title} (ID: ${item.id})`);
            await (0, projects_1.handleProjectTool)("update_project_item_status", { itemId: item.id, status: "Done" }, token, config.defaultProjectId);
        }
    }
    console.log("Sprint Complete!");
}
completeItems().catch(console.error);
