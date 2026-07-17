import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";

async function review() {
    const token = getGitHubToken();
    const config = loadConfig();
    
    console.log("Fetching project items...");
    const result: any = await handleProjectTool("get_project_items", {}, token, config.defaultProjectId);
    
    const itemsText = result.content[0].text;
    const items = JSON.parse(itemsText);
    
    let closedItems = [];
    
    for (const item of items) {
        if (!item.content) continue; // Not an issue/PR
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
        await handleProjectTool("update_project_item_status", {
            itemId: item.id,
            status: "Done"
        }, token, config.defaultProjectId);
    }
    console.log("Cleanup complete!");
}

review().catch(console.error);
