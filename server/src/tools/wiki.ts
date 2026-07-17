import * as fs from "fs";
import * as path from "path";

// Resolves to the Wiki workspace (assuming they are siblings)
const WIKI_DIR = path.resolve(__dirname, "../../../../Wiki");

export const wikiTools = [
    {
        name: "query_wiki_database",
        description: "Query the RimSynapse Wiki database. Used for accessing Mod Lore and Intelligent Referencing.",
        inputSchema: {
            type: "object",
            properties: {
                documentName: { 
                    type: "string", 
                    description: "The specific document to read (e.g. 'Introduction.md'). If omitted, this tool will return a list of all available documents." 
                },
                searchQuery: {
                    type: "string",
                    description: "Optional keyword to search across the wiki database. Returns excerpts of matching files."
                }
            }
        }
    }
];

export async function handleWikiTool(name: string, args: any) {
    if (name === "query_wiki_database") {
        if (!fs.existsSync(WIKI_DIR)) {
            return { content: [{ type: "text", text: `Wiki directory not found at ${WIKI_DIR}` }] };
        }

        const files = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith(".md"));

        if (args.documentName) {
            const safeName = path.basename(args.documentName);
            const docPath = path.join(WIKI_DIR, safeName);
            if (!fs.existsSync(docPath)) {
                return { content: [{ type: "text", text: `Document '${safeName}' not found.` }] };
            }
            const content = fs.readFileSync(docPath, "utf-8");
            return { content: [{ type: "text", text: content }] };
        }

        if (args.searchQuery) {
            const query = args.searchQuery.toLowerCase();
            const results = [];
            for (const file of files) {
                const docPath = path.join(WIKI_DIR, file);
                const content = fs.readFileSync(docPath, "utf-8");
                if (content.toLowerCase().includes(query)) {
                    // Extract snippet
                    const lines = content.split('\n');
                    const matchIndex = lines.findIndex(l => l.toLowerCase().includes(query));
                    const snippet = lines.slice(Math.max(0, matchIndex - 1), matchIndex + 2).join('\n');
                    results.push(`--- ${file} ---\n${snippet.trim()}`);
                }
            }
            if (results.length === 0) {
                return { content: [{ type: "text", text: `No matches found for '${query}'.` }] };
            }
            return { content: [{ type: "text", text: results.join('\n\n') }] };
        }

        // Default: List files
        return { 
            content: [{ 
                type: "text", 
                text: `Available Lore Documents:\n${files.map(f => `- ${f}`).join('\n')}\n\nCall this tool again with 'documentName' to read a specific file, or 'searchQuery' to search contents.`
            }] 
        };
    }
    
    throw new Error(`Unknown wiki tool: ${name}`);
}
