"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
async function getOpenItems() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    console.log("Fetching project items...");
    const result = await (0, projects_1.handleProjectTool)("get_project_items", {}, token, config.defaultProjectId);
    const itemsText = result.content[0].text;
    const items = JSON.parse(itemsText);
    let openItems = [];
    for (const item of items) {
        if (!item.content)
            continue; // Not an issue/PR
        if (item.content.state === "OPEN") {
            openItems.push({
                id: item.id,
                title: item.content.title,
                url: item.content.url
            });
        }
    }
    console.log("\n--- OPEN ISSUES ---");
    for (const item of openItems) {
        console.log(`- ${item.title} (${item.url})`);
    }
}
getOpenItems().catch(console.error);
