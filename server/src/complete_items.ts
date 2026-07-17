import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";
import { graphql } from "@octokit/graphql";

async function completeItems() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({
        headers: { authorization: `token ${token}` }
    });

    console.log("Fetching project items to complete...");
    const result: any = await handleProjectTool("get_project_items", {}, token, config.defaultProjectId);
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
            await handleProjectTool("update_project_item_status", { itemId: item.id, status: "Done" }, token, config.defaultProjectId);
        }
    }
    
    console.log("Sprint Complete!");
}

completeItems().catch(console.error);
