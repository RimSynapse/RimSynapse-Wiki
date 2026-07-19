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
exports.rimworldDevTools = void 0;
exports.handleRimworldDevTool = handleRimworldDevTool;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const config_1 = require("../config");
exports.rimworldDevTools = [
    {
        name: "deploy_rimworld_mods",
        description: "Compiles C# assemblies and packages clean mod files into the target RimWorld Mods directory.",
        inputSchema: {
            type: "object",
            properties: {
                mods: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of mod directory names to build and deploy (e.g. ['Core', 'Psychology']). If omitted, all 9 mods are built and deployed."
                },
                buildType: {
                    type: "string",
                    enum: ["Release", "Debug"],
                    description: "The build configuration to use (default: Release)."
                },
                targetModsDir: {
                    type: "string",
                    description: "Optional custom path to the RimWorld Mods folder. Overrides the configured path."
                }
            }
        }
    },
    {
        name: "launch_rimworld",
        description: "Closes existing RimWorld instances and launches a new one with developer, quicktest, or custom save data folder parameters.",
        inputSchema: {
            type: "object",
            properties: {
                savedatafolder: {
                    type: "string",
                    description: "Optional custom path for -savedatafolder. Overrides the configured path."
                },
                quicktest: {
                    type: "boolean",
                    description: "Whether to launch with -quicktest to jump straight into a generated map (default: false)."
                },
                developer: {
                    type: "boolean",
                    description: "Whether to force developer mode enabled (default: true)."
                },
                killExisting: {
                    type: "boolean",
                    description: "Whether to close currently running RimWorld processes (default: true)."
                },
                verbose: {
                    type: "boolean",
                    description: "Whether to output verbose log files (default: false)."
                },
                nosound: {
                    type: "boolean",
                    description: "Whether to mute the game audio by launching with -nosound (default: true)."
                }
            }
        }
    },
    {
        name: "read_rimworld_log",
        description: "Reads the runtime log entries (Player.log) of RimWorld. Useful for checking errors and general status.",
        inputSchema: {
            type: "object",
            properties: {
                savedatafolder: {
                    type: "string",
                    description: "Optional path to the custom savedatafolder if checking a dev instance."
                },
                lines: {
                    type: "number",
                    description: "Number of lines from the end of the log to return (default: 100)."
                }
            }
        }
    }
];
const modsMap = [
    { name: "RimSynapseConversations", dirName: "Conversations", src: "d:\\github\\rimsynapse\\Conversations", hasCsharp: true },
    { name: "RimSynapseCore", dirName: "Core", src: "d:\\github\\rimsynapse\\Core", hasCsharp: true },
    { name: "RimSynapseFactions", dirName: "Factions", src: "d:\\github\\rimsynapse\\Factions", hasCsharp: true },
    { name: "RimSynapseNVIDIATool", dirName: "NVIDIA-Tool", src: "d:\\github\\rimsynapse\\NVIDIA-Tool", hasCsharp: true },
    { name: "RimSynapsePsychology", dirName: "Psychology", src: "d:\\github\\rimsynapse\\Psychology", hasCsharp: true },
    { name: "RimSynapseRegionsAndTerritories", dirName: "Regions-and-Territories", src: "d:\\github\\rimsynapse\\Regions-and-Territories", hasCsharp: true },
    { name: "RimSynapseWorldNews", dirName: "WorldNews", src: "d:\\github\\rimsynapse\\WorldNews", hasCsharp: true },
    { name: "RimSynapseAuraAlgorithm", dirName: "AuraAlgorithm", src: "d:\\github\\rimsynapse\\AuraAlgorithm", hasCsharp: false },
    { name: "RimSynapseLLMTrainer", dirName: "LLM-Trainer", src: "d:\\github\\rimsynapse\\LLM-Trainer", hasCsharp: true }
];
const foldersWhitelist = [
    "About",
    "Assemblies",
    "Defs",
    "Textures",
    "Patches",
    "Languages",
    "Sounds",
    "Common",
    "1.0",
    "1.1",
    "1.2",
    "1.3",
    "1.4",
    "1.5",
    "1.6"
];
const filesWhitelist = [
    "LICENSE",
    "README.md",
    "LoadFolders.xml",
    "steam_description.txt"
];
function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    const files = fs.readdirSync(source);
    for (const file of files) {
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);
        if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursiveSync(curSource, curTarget);
        }
        else {
            fs.copyFileSync(curSource, curTarget);
        }
    }
}
async function handleRimworldDevTool(name, args) {
    const config = (0, config_1.loadConfig)();
    if (name === "deploy_rimworld_mods") {
        const selectedMods = args.mods;
        const buildType = args.buildType || "Release";
        const targetModsDir = args.targetModsDir || config.rimworldModsDir || "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Mods";
        let logs = `Deploying mods to: ${targetModsDir}\nBuild configuration: ${buildType}\n`;
        const targetMods = selectedMods
            ? modsMap.filter(m => selectedMods.includes(m.dirName))
            : modsMap;
        for (const mod of targetMods) {
            logs += `\nProcessing ${mod.dirName}...\n`;
            // 1. Compile C# project if applicable
            if (mod.hasCsharp) {
                const sourceDir = path.join(mod.src, "Source");
                if (fs.existsSync(sourceDir)) {
                    logs += `  Compiling C# assembly...\n`;
                    try {
                        (0, child_process_1.execSync)(`dotnet build -c ${buildType}`, { cwd: sourceDir, stdio: "pipe" });
                        logs += `  Compilation successful.\n`;
                    }
                    catch (err) {
                        logs += `  Compilation FAILED: ${err.message}\n${err.stderr?.toString() || ""}\n`;
                        continue;
                    }
                }
            }
            // 2. Package mod files
            const destPath = path.join(targetModsDir, mod.name);
            logs += `  Packaging release files to ${destPath}...\n`;
            try {
                if (fs.existsSync(destPath)) {
                    const stats = fs.lstatSync(destPath);
                    if (stats.isSymbolicLink()) {
                        (0, child_process_1.execSync)(`cmd.exe /c rmdir "${destPath}"`, { stdio: "ignore" });
                    }
                    else {
                        fs.rmSync(destPath, { recursive: true, force: true });
                    }
                }
                fs.mkdirSync(destPath, { recursive: true });
                // Copy whitelist folders
                for (const folder of foldersWhitelist) {
                    const srcFolder = path.join(mod.src, folder);
                    const destFolder = path.join(destPath, folder);
                    if (fs.existsSync(srcFolder) && fs.lstatSync(srcFolder).isDirectory()) {
                        copyFolderRecursiveSync(srcFolder, destFolder);
                    }
                }
                // Copy whitelist files
                for (const file of filesWhitelist) {
                    const srcFile = path.join(mod.src, file);
                    const destFile = path.join(destPath, file);
                    if (fs.existsSync(srcFile) && fs.lstatSync(srcFile).isFile()) {
                        fs.copyFileSync(srcFile, destFile);
                    }
                }
                logs += `  Deployment successful.\n`;
            }
            catch (err) {
                logs += `  Deployment FAILED: ${err.message}\n`;
            }
        }
        return { content: [{ type: "text", text: logs }] };
    }
    if (name === "launch_rimworld") {
        const savedata = args.savedatafolder || config.savedatafolder || "D:\\RimWorldDevData";
        const quicktest = args.quicktest === true;
        const developer = args.developer !== false;
        const killExisting = args.killExisting !== false;
        const verbose = args.verbose === true;
        const nosound = args.nosound !== false;
        const pidFilePath = path.join(__dirname, "..", "..", "dev_instance_pid.txt");
        let logs = `Launching RimWorld directly...\n`;
        if (killExisting) {
            logs += "Closing existing developer RimWorld instances...\n";
            // 1. Try to close the specifically tracked PID first
            if (fs.existsSync(pidFilePath)) {
                try {
                    const oldPid = fs.readFileSync(pidFilePath, "utf8").trim();
                    logs += `Closing tracked developer instance with PID ${oldPid}...\n`;
                    (0, child_process_1.execSync)(`taskkill /f /pid ${oldPid}`, { stdio: "ignore" });
                    fs.unlinkSync(pidFilePath);
                }
                catch (e) {
                    // Ignore if already dead
                }
            }
            // 2. Backup safety check: scan all RimWorld processes and terminate ONLY those containing '-savedatafolder'.
            try {
                (0, child_process_1.execSync)("powershell -Command \"Get-CimInstance Win32_Process -Filter \\\"Name = 'RimWorldWin64.exe'\\\" | Where-Object { $_.CommandLine -like '*savedatafolder*' } | Foreach-Object { Stop-Process -Id $_.ProcessId -Force }\"", { stdio: "ignore" });
                logs += "Targeted developer instances cleanup completed safely.\n";
            }
            catch (e) {
                // Ignore if none found
            }
        }
        // 1. Write the Prefs.xml file to mute audio and enable devMode under the custom savedatafolder
        const configDir = path.join(savedata, "Config");
        try {
            fs.mkdirSync(configDir, { recursive: true });
            const prefsPath = path.join(configDir, "Prefs.xml");
            const volumeVal = nosound ? "0" : "1";
            const devModeVal = developer ? "True" : "False";
            const prefsXml = `<?xml version="1.0" encoding="utf-8"?>
<PrefsData>
  <volumeMaster>${volumeVal}</volumeMaster>
  <volumeGame>${volumeVal}</volumeGame>
  <volumeMusic>0</volumeMusic>
  <volumeAmbient>${volumeVal}</volumeAmbient>
  <volumeUI>${volumeVal}</volumeUI>
  <devMode>${devModeVal}</devMode>
  <runInBackground>True</runInBackground>
</PrefsData>`;
            fs.writeFileSync(prefsPath, prefsXml, "utf8");
            logs += `Pre-configured Prefs.xml in ${configDir} (Muted: ${nosound})\n`;
        }
        catch (prefsErr) {
            logs += `Warning: Failed to pre-configure Prefs.xml: ${prefsErr.message}\n`;
        }
        // 2. Resolve RimWorld executable path
        let rimworldExe = config.rimworldPath;
        if (!rimworldExe) {
            rimworldExe = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\RimWorldWin64.exe";
        }
        if (!fs.existsSync(rimworldExe)) {
            throw new Error(`RimWorld executable not found at: ${rimworldExe}`);
        }
        // 3. Prevent Steam Relaunch (Write steam_appid.txt in game directory if missing)
        const gameDir = path.dirname(rimworldExe);
        const appidPath = path.join(gameDir, "steam_appid.txt");
        if (!fs.existsSync(appidPath)) {
            try {
                fs.writeFileSync(appidPath, "294100", "utf8");
                logs += `Created steam_appid.txt bypass config.\n`;
            }
            catch (e) { }
        }
        const params = [
            `-savedatafolder=${savedata}`,
            "-developer"
        ];
        if (quicktest) {
            params.push("-quicktest");
            logs += "Quicktest mode enabled.\n";
        }
        if (verbose) {
            params.push("-verbose");
            logs += "Verbose logging enabled.\n";
        }
        if (nosound) {
            params.push("-nosound");
            logs += "Sound disabled (nosound flag active).\n";
        }
        try {
            logs += `Spawning isolated game process: ${rimworldExe}\n`;
            const child = (0, child_process_1.spawn)(rimworldExe, params, {
                detached: true,
                stdio: "ignore",
                env: {
                    ...process.env,
                    SteamAppId: "294100",
                    SteamAppID: "294100"
                }
            });
            child.unref();
            if (child.pid) {
                fs.writeFileSync(pidFilePath, child.pid.toString(), "utf8");
                logs += `RimWorld process successfully spawned in background. Tracked PID: ${child.pid}\n`;
            }
            else {
                logs += "RimWorld process successfully spawned in background (unable to resolve PID dynamically).\n";
            }
            // Trigger background virtual desktop mover to second desktop dynamically
            const moverScript = `
                Start-Sleep -Seconds 2
                $reg = Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VirtualDesktops" -ErrorAction Ignore
                if ($reg -and $reg.VirtualDesktopIDs -and $reg.VirtualDesktopIDs.Length -ge 32) {
                    $ids = $reg.VirtualDesktopIDs
                    $secondGuidBytes = New-Object byte[] 16
                    [Array]::Copy($ids, 16, $secondGuidBytes, 0, 16)
                    $secondGuid = New-Object Guid (,$secondGuidBytes)
                    
                    Add-Type -TypeDefinition @"
                    using System;
                    using System.Runtime.InteropServices;
                    [ComImport]
                    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
                    [Guid("a5cd92ff-29be-454c-8f04-d84f185f60f7")]
                    public interface IVirtualDesktopManager {
                        void MoveWindowToDesktop(IntPtr topLevelWindow, ref Guid desktopId);
                    }
                    public class DesktopManager {
                        public static void MoveWindow(IntPtr hwnd, Guid desktopId) {
                            Type t = Type.GetTypeFromCLSID(new Guid("aa509086-5ca9-4c25-8f95-589d3c07b48a"));
                            IVirtualDesktopManager m = (IVirtualDesktopManager)Activator.CreateInstance(t);
                            m.MoveWindowToDesktop(hwnd, ref desktopId);
                        }
                    }
"@
                    for ($i = 0; $i -lt 30; $i++) {
                        $proc = Get-Process -Name "RimWorldWin64" -ErrorAction Ignore
                        if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
                            [DesktopManager]::MoveWindow($proc.MainWindowHandle, $secondGuid)
                            break
                        }
                        Start-Sleep -Milliseconds 500
                    }
                }
            `;
            const mover = (0, child_process_1.spawn)("powershell", ["-NoProfile", "-Command", moverScript], {
                detached: true,
                stdio: "ignore"
            });
            mover.unref();
            logs += "Virtual desktop migration script spawned in background.";
        }
        catch (err) {
            logs += `Launch failed: ${err.message}`;
            return { isError: true, content: [{ type: "text", text: logs }] };
        }
        return { content: [{ type: "text", text: logs }] };
    }
    if (name === "read_rimworld_log") {
        const savedata = args.savedatafolder || config.savedatafolder || "D:\\RimWorldDevData";
        const linesToGet = args.lines || 100;
        let logPath = "";
        const candidates = [
            path.join(savedata, "Logs", "Player.log"),
            path.join(savedata, "Player.log"),
            path.join(process.env.USERPROFILE || "", "AppData", "LocalLow", "Ludeon Studios", "RimWorld by Ludeon Studios", "Player.log")
        ];
        for (const c of candidates) {
            if (fs.existsSync(c)) {
                logPath = c;
                break;
            }
        }
        if (!logPath) {
            throw new Error(`RimWorld Player.log file not found at any of the candidate paths.`);
        }
        try {
            const rawContent = fs.readFileSync(logPath, "utf8");
            const lines = rawContent.split(/\r?\n/);
            const sliceStart = Math.max(0, lines.length - linesToGet);
            const sliced = lines.slice(sliceStart).join("\n");
            return {
                content: [{
                        type: "text",
                        text: `Read log file from: ${logPath}\nShowing last ${linesToGet} lines:\n\n${sliced}`
                    }]
            };
        }
        catch (e) {
            throw new Error(`Failed to read Player.log: ${e.message}`);
        }
    }
    throw new Error(`Unknown RimWorld Dev tool: ${name}`);
}
