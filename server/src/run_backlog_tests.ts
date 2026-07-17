import * as fs from "fs";
import * as path from "path";
import { handleTestingTool } from "./tools/testing";

const LOG_FILE = "d:\\github\\rimsynapse\\Core\\backlog_test_results.log";

function logResult(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + "\n", "utf8");
}

async function runTests() {
    if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
    }
    
    logResult("=================================================");
    logResult("Starting RimSynapse Modularity backlogs tests...");
    logResult("=================================================\n");

    const testCases = [
        {
            name: "MOD-01: Base Mod Independence (No DLCs)",
            dlcToEnable: [],
            dlcToDisable: ["royalty", "ideology", "biotech", "anomaly", "odyssey"]
        },
        {
            name: "MOD-02: Royalty DLC Modularity",
            dlcToEnable: ["royalty"],
            dlcToDisable: ["ideology", "biotech", "anomaly", "odyssey"]
        },
        {
            name: "MOD-03: Ideology DLC Modularity",
            dlcToEnable: ["ideology"],
            dlcToDisable: ["royalty", "biotech", "anomaly", "odyssey"]
        },
        {
            name: "MOD-04: Biotech DLC Modularity",
            dlcToEnable: ["biotech"],
            dlcToDisable: ["royalty", "ideology", "anomaly", "odyssey"]
        },
        {
            name: "MOD-05: Anomaly DLC Modularity",
            dlcToEnable: ["anomaly"],
            dlcToDisable: ["royalty", "ideology", "biotech", "odyssey"]
        }
    ];

    for (const tc of testCases) {
        logResult(`Running ${tc.name}...`);
        
        // 1. Configure mod list
        try {
            await handleTestingTool("configure_active_mods", {
                enableDlc: tc.dlcToEnable,
                disableDlc: tc.dlcToDisable
            }, null as any, "RimSynapse");
            logResult("-> Mod list configured successfully.");
        } catch (err: any) {
            logResult(`-> [ERROR] Failed to configure mods: ${err.message}`);
            continue;
        }

        // 2. Kill game if running
        try {
            const { execSync } = require("child_process");
            execSync('taskkill /f /im RimWorldWin64.exe', { stdio: 'ignore' });
            logResult("-> Killed active game process.");
        } catch (e) {}

        // 3. Restart game
        try {
            await handleTestingTool("restart_game", { quicktest: true }, null as any, "RimSynapse");
            logResult("-> Relaunched game. Waiting 15 seconds for startup logs...");
        } catch (err: any) {
            logResult(`-> [ERROR] Failed to relaunch game: ${err.message}`);
            continue;
        }

        // 4. Wait for game startup
        await new Promise(resolve => setTimeout(resolve, 15000));

        // 5. Inspect Player.log
        const logPath = "C:\\Users\\sealt\\AppData\\LocalLow\\Ludeon Studios\\RimWorld by Ludeon Studios\\Player.log";
        if (fs.existsSync(logPath)) {
            const logContent = fs.readFileSync(logPath, "utf8");
            
            // Check for errors
            const lines = logContent.split("\n");
            const errors = lines.filter(l => 
                (l.includes("[Error]") || l.includes("Exception:") || l.includes("error:")) && 
                !l.includes("ErrorCheckPatches") && 
                !l.includes("Error check all defs")
            );

            if (errors.length > 0) {
                logResult(`-> [FAILED] Detected ${errors.length} startup errors/exceptions:`);
                errors.slice(0, 5).forEach(e => logResult(`   * ${e.trim()}`));
            } else {
                logResult("-> [PASSED] Mod loaded cleanly with zero startup errors.");
            }
        } else {
            logResult("-> [WARNING] Player.log not found. Could not verify errors.");
        }
        
        logResult("");
    }

    logResult("================================================");
    logResult("Backlog testing completed.");
    logResult("================================================");
}

runTests().catch(console.error);
