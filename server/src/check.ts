import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";

async function check() {
    const token = getGitHubToken();
    const config = loadConfig();
    const result: any = await handleProjectTool("get_project_items", {}, token, config.defaultProjectId);
    const items = JSON.parse(result.content[0].text);
    console.log(`Total items on board: ${items.length}`);
    for (const item of items) {
        if (item.content) {
            console.log(item.content.title, " - ", item.content.url);
        }
    }
}
check().catch(console.error);
