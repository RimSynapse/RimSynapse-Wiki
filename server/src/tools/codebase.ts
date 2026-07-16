import { Octokit } from "@octokit/rest";

export const codebaseTools = [
    {
        name: "get_file_content",
        description: "Get the content of a file from a repository",
        inputSchema: {
            type: "object",
            properties: {
                repo: { type: "string" },
                path: { type: "string" }
            },
            required: ["repo", "path"]
        }
    },
    {
        name: "create_or_update_file",
        description: "Create or update a file in a repository",
        inputSchema: {
            type: "object",
            properties: {
                repo: { type: "string" },
                path: { type: "string" },
                content: { type: "string" },
                message: { type: "string" }
            },
            required: ["repo", "path", "content", "message"]
        }
    }
];

export async function handleCodebaseTool(name: string, args: any, octokit: Octokit, org: string) {
    if (name === "get_file_content") {
        const { data } = await octokit.rest.repos.getContent({
            owner: org,
            repo: args.repo,
            path: args.path
        });
        
        if (Array.isArray(data) || !('content' in data)) {
            throw new Error("Path is a directory or content missing");
        }
        
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return { content: [{ type: "text", text: content }] };
    }
    
    if (name === "create_or_update_file") {
        // Try to get file first to get its sha
        let sha: string | undefined = undefined;
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner: org,
                repo: args.repo,
                path: args.path
            });
            if (!Array.isArray(data) && 'sha' in data) {
                sha = data.sha;
            }
        } catch (e) {
            // File might not exist, which is fine for creation
        }
        
        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
            owner: org,
            repo: args.repo,
            path: args.path,
            message: args.message,
            content: Buffer.from(args.content).toString('base64'),
            sha
        });
        
        return { content: [{ type: "text", text: `File updated successfully. Commit: ${data.commit.sha}` }] };
    }
    
    throw new Error(`Unknown codebase tool: ${name}`);
}
