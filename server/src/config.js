import * as fs from "fs";
import * as path from "path";
export function loadConfig() {
    const configPath = path.join(__dirname, "..", "..", "..", "mcp-config", "config.json");
    if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(content);
    }
    // Fallback defaults
    return {
        defaultProjectId: "PVT_kwDOEfI01s4Bdlhx",
        organization: "RimSynapse"
    };
}
export function getGitHubToken() {
    const tokenFilePath = path.join(__dirname, "..", "..", "..", "github_token.txt");
    let githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken && fs.existsSync(tokenFilePath)) {
        const fileContent = fs.readFileSync(tokenFilePath, "utf-8");
        const tokenLine = fileContent.split("\n").find(line => line.startsWith("TOKEN="));
        if (tokenLine) {
            githubToken = tokenLine.split("=")[1].trim();
        }
    }
    if (!githubToken) {
        throw new Error("No GitHub token found. Please set GITHUB_TOKEN or ensure github_token.txt exists with TOKEN=...");
    }
    return githubToken;
}
