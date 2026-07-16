import * as fs from "fs";
import * as path from "path";

export interface MCPConfig {
    defaultProjectId: string;
    organization: string;
}

export function loadConfig(): MCPConfig {
    const configPath = path.join(__dirname, "..", "..", "..", "mcp-config", "config.json");
    if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(content) as MCPConfig;
    }
    
    // Fallback defaults
    return {
        defaultProjectId: "PVT_kwDOEfI01s4Bdlhx",
        organization: "RimSynapse"
    };
}

export function getGitHubToken(): string {
    const tokenFilePath = path.join(__dirname, "..", "..", "..", "github_token.txt");
    let githubToken: string | undefined;

    if (fs.existsSync(tokenFilePath)) {
        const fileContent = fs.readFileSync(tokenFilePath, "utf-8");
        const tokenLine = fileContent.split("\n").find(line => line.startsWith("TOKEN="));
        if (tokenLine) {
            githubToken = tokenLine.split("=")[1].trim();
        }
    }

    if (!githubToken) {
        githubToken = process.env.GITHUB_TOKEN;
    }

    if (!githubToken) {
        throw new Error("No GitHub token found. Please set GITHUB_TOKEN or ensure github_token.txt exists with TOKEN=...");
    }
    
    return githubToken;
}
