"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
async function check() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const result = await (0, projects_1.handleProjectTool)("get_project_items", {}, token, config.defaultProjectId);
    const items = JSON.parse(result.content[0].text);
    console.log(`Total items on board: ${items.length}`);
    for (const item of items) {
        if (item.content) {
            console.log(item.content.title, " - ", item.content.url);
        }
    }
}
check().catch(console.error);
