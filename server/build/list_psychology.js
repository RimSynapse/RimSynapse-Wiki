"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
async function fetchPsychologyItems() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    console.log("Fetching project items...");
    const result = await (0, projects_1.handleProjectTool)("get_project_items", {}, token, config.defaultProjectId);
    const items = JSON.parse(result.content[0].text);
    console.log("\n=== Psychology Items ===");
    for (const item of items) {
        if (!item.content)
            continue;
        let isPsychology = false;
        if (item.content.url && item.content.url.includes("/Psychology/")) {
            isPsychology = true;
        }
        const teamField = item.fieldValues?.nodes?.find((f) => f.projectField?.name === "Team" || f.field?.name === "Team");
        if (teamField && teamField.name === "Psychology") {
            isPsychology = true;
        }
        if (isPsychology) {
            const statusField = item.fieldValues?.nodes?.find((f) => f.projectField?.name === "Status" || f.field?.name === "Status");
            const iterationField = item.fieldValues?.nodes?.find((f) => f.projectField?.name === "Iteration" || f.field?.name === "Iteration");
            const status = statusField ? statusField.name : "No Status";
            const iterName = iterationField && iterationField.title ? iterationField.title : "Unassigned";
            console.log(`- ${item.content.title}`);
            if (item.content.url)
                console.log(`  URL: ${item.content.url}`);
            console.log(`  Status: ${status} | Iteration: ${iterName}\n`);
        }
    }
}
fetchPsychologyItems().catch(console.error);
