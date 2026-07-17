import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

const workspaceRoot = "d:\\github\\rimsynapse";

function checkGitStatus() {
    const dirs = fs.readdirSync(workspaceRoot);
    
    for (const dir of dirs) {
        const fullPath = path.join(workspaceRoot, dir);
        if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, ".git"))) {
            try {
                const status = execSync("git status --short", { cwd: fullPath }).toString().trim();
                const branch = execSync("git branch --show-current", { cwd: fullPath }).toString().trim();
                const lastCommit = execSync("git log -1 --oneline", { cwd: fullPath }).toString().trim();
                console.log(`Repository: ${dir} | Branch: ${branch} | Changes: ${status ? "Yes" : "No"}`);
                console.log(`  Last Commit: ${lastCommit}`);
            } catch (err) {
                console.error(`Error checking ${dir}:`, err);
            }
        }
    }
}

checkGitStatus();
