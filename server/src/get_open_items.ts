import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";

async function getOpenItems() {
    const token = getGitHubToken();
    const config = loadConfig();
    
    console.log("Fetching project items...");
    const result: any = await handleProjectTool("get_project_items", {}, token, config.defaultProjectId);
    
    const itemsText = result.content[0].text;
    const items = JSON.parse(itemsText);
    
    let openItems = [];
    
    for (const item of items) {
        if (!item.content) continue; // Not an issue/PR
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
