"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.wikiTools = void 0;
exports.handleWikiTool = handleWikiTool;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Resolves to the Wiki workspace (assuming they are siblings)
const WIKI_DIR = path.resolve(__dirname, "../../../../Wiki");
exports.wikiTools = [
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
async function handleWikiTool(name, args) {
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
