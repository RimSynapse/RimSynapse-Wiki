"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
async function review() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    console.log("Fetching project items...");
    const result = await (0, projects_1.handleProjectTool)("get_project_items", {}, token, config.defaultProjectId);
    const itemsText = result.content[0].text;
    const items = JSON.parse(itemsText);
    let closedItems = [];
    for (const item of items) {
        if (!item.content)
            continue; // Not an issue/PR
        if (item.content.state === "CLOSED") {
            closedItems.push({
                id: item.id,
                title: item.content.title,
                url: item.content.url
            });
        }
    }
    console.log("\n--- REVIEW REPORT ---");
    console.log(`Found ${closedItems.length} closed issues still on the project board. Updating them to 'Done'...`);
    for (const item of closedItems) {
        console.log(`- Updating: ${item.title} (${item.url})`);
        await (0, projects_1.handleProjectTool)("update_project_item_status", {
            itemId: item.id,
            status: "Done"
        }, token, config.defaultProjectId);
    }
    console.log("Cleanup complete!");
}
review().catch(console.error);
