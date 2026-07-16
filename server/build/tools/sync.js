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
exports.syncTools = void 0;
exports.handleSyncTool = handleSyncTool;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
exports.syncTools = [
    {
        name: "sync_repo_wiki",
        description: "Syncs a local Learning folder to its GitHub Wiki repository",
        inputSchema: {
            type: "object",
            properties: {
                repoName: { type: "string", description: "Name of the repository (e.g. Core)" },
                localRepoPath: { type: "string", description: "Absolute path to the local repository clone" }
            },
            required: ["repoName", "localRepoPath"]
        }
    }
];
async function handleSyncTool(name, args, org, token) {
    if (name === "sync_repo_wiki") {
        const { repoName, localRepoPath } = args;
        const learningPath = path.join(localRepoPath, "Learning");
        if (!fs.existsSync(learningPath)) {
            throw new Error(`Learning folder not found at ${learningPath}`);
        }
        const tempWikiPath = path.join(localRepoPath, ".wiki_temp");
        try {
            // Clean up any old temp dir
            if (fs.existsSync(tempWikiPath)) {
                fs.rmSync(tempWikiPath, { recursive: true, force: true });
            }
            // Clone the wiki repo using the token for auth
            const wikiUrl = `https://oauth2:${token}@github.com/${org}/${repoName}.wiki.git`;
            (0, child_process_1.execSync)(`git clone ${wikiUrl} "${tempWikiPath}"`, { stdio: 'inherit' });
            // Copy contents from Learning to wiki
            // We use fs.cpSync for cross-platform recursive copy
            const files = fs.readdirSync(learningPath);
            for (const file of files) {
                const src = path.join(learningPath, file);
                const dest = path.join(tempWikiPath, file);
                fs.cpSync(src, dest, { recursive: true, force: true });
            }
            // Commit and push
            (0, child_process_1.execSync)(`git add .`, { cwd: tempWikiPath, stdio: 'inherit' });
            // Check if there are changes
            try {
                (0, child_process_1.execSync)(`git commit -m "Automated wiki sync from Learning folder"`, { cwd: tempWikiPath, stdio: 'pipe' });
                (0, child_process_1.execSync)(`git push origin HEAD`, { cwd: tempWikiPath, stdio: 'inherit' });
                return { content: [{ type: "text", text: `Wiki for ${repoName} synced successfully.` }] };
            }
            catch (commitErr) {
                if (commitErr.stdout && commitErr.stdout.toString().includes("nothing to commit")) {
                    return { content: [{ type: "text", text: `Wiki for ${repoName} is already up to date.` }] };
                }
                throw commitErr;
            }
        }
        finally {
            // Cleanup
            if (fs.existsSync(tempWikiPath)) {
                fs.rmSync(tempWikiPath, { recursive: true, force: true });
            }
        }
    }
    throw new Error(`Unknown sync tool: ${name}`);
}
