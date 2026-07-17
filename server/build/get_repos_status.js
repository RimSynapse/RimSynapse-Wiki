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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const workspaceRoot = "d:\\github\\rimsynapse";
function checkGitStatus() {
    const dirs = fs.readdirSync(workspaceRoot);
    for (const dir of dirs) {
        const fullPath = path.join(workspaceRoot, dir);
        if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, ".git"))) {
            try {
                const status = (0, child_process_1.execSync)("git status --short", { cwd: fullPath }).toString().trim();
                const branch = (0, child_process_1.execSync)("git branch --show-current", { cwd: fullPath }).toString().trim();
                const lastCommit = (0, child_process_1.execSync)("git log -1 --oneline", { cwd: fullPath }).toString().trim();
                console.log(`Repository: ${dir} | Branch: ${branch} | Changes: ${status ? "Yes" : "No"}`);
                console.log(`  Last Commit: ${lastCommit}`);
            }
            catch (err) {
                console.error(`Error checking ${dir}:`, err);
            }
        }
    }
}
checkGitStatus();
