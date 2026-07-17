import { getGitHubToken, loadConfig } from "./config";
import { handleProjectTool } from "./tools/projects";
import * as fs from "fs";
import * as path from "path";

async function dump() {
    const token = getGitHubToken();
    const config = loadConfig();
    const result: any = await handleProjectTool("get_project_items", {}, token, config.defaultProjectId);
    const itemsText = result.content[0].text;
    fs.writeFileSync(path.join(__dirname, "..", "dump.json"), itemsText);
    console.log("Dumped to dump.json");
}

dump().catch(console.error);
