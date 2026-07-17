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
exports.testingTools = void 0;
exports.handleTestingTool = handleTestingTool;
const fs = __importStar(require("fs"));
const graphql_1 = require("@octokit/graphql");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
exports.testingTools = [
    {
        name: "create_testing_plan_issues",
        description: "Parse a local testing plan Markdown file, add it as a comment to the issue, and set the project item status to 'Testing'",
        inputSchema: {
            type: "object",
            properties: {
                repo: { type: "string", description: "The repository containing the issue" },
                issueNumber: { type: "number", description: "The number of the issue/ticket to comment on" },
                planFilePath: { type: "string", description: "Absolute local path to the testing plan MD file" }
            },
            required: ["repo", "issueNumber", "planFilePath"]
        }
    },
    {
        name: "restart_game",
        description: "Brings down the running RimWorld process and relaunches it with quicktest developer mode (-quicktest) enabled to bypass the main menu and load a test colony immediately.",
        inputSchema: {
            type: "object",
            properties: {
                quicktest: { type: "boolean", description: "If true, restarts with -quicktest enabled. Defaults to true." }
            }
        }
    },
    {
        name: "configure_active_mods",
        description: "Configures active mods and DLCs in RimWorld's ModsConfig.xml. Resolves file path dynamically.",
        inputSchema: {
            type: "object",
            properties: {
                activeMods: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of mod IDs to set as active. Overwrites current list."
                },
                enableDlc: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of DLC names to enable (royalty, ideology, biotech, anomaly, odyssey)."
                },
                disableDlc: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of DLC names to disable."
                }
            }
        }
    }
];
async function handleTestingTool(name, args, octokit, org, token, defaultProjectId) {
    if (name === "create_testing_plan_issues") {
        if (!fs.existsSync(args.planFilePath)) {
            throw new Error(`Testing plan file not found: ${args.planFilePath}`);
        }
        const content = fs.readFileSync(args.planFilePath, "utf8");
        const commentBody = `### Testing Plan\n\n${content}`;
        // 1. Post comment on the issue
        const commentRes = await octokit.rest.issues.createComment({
            owner: org,
            repo: args.repo,
            issue_number: args.issueNumber,
            body: commentBody
        });
        let projectUpdateStatus = "No project item updated (token or defaultProjectId missing)";
        if (token && defaultProjectId) {
            const graphqlWithAuth = graphql_1.graphql.defaults({
                headers: {
                    authorization: `token ${token}`
                }
            });
            // 2. Fetch the issue's node ID
            const { data: issue } = await octokit.rest.issues.get({
                owner: org,
                repo: args.repo,
                issue_number: args.issueNumber
            });
            const issueNodeId = issue.node_id;
            // 3. Query the issue's projectItems
            const query = `
                query($issueId: ID!) {
                    node(id: $issueId) {
                        ... on Issue {
                            projectItems(first: 10) {
                                nodes {
                                    id
                                    project {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const result = await graphqlWithAuth(query, { issueId: issueNodeId });
            const projectItems = result.node?.projectItems?.nodes || [];
            let projectItem = projectItems.find((item) => item.project?.id === defaultProjectId);
            let itemId = projectItem?.id;
            // If the item is not on the project board, add it first
            if (!itemId) {
                const addMutation = `
                    mutation($projectId: ID!, $contentId: ID!) {
                        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                            item {
                                id
                            }
                        }
                    }
                `;
                const addResult = await graphqlWithAuth(addMutation, {
                    projectId: defaultProjectId,
                    contentId: issueNodeId
                });
                itemId = addResult.addProjectV2ItemById.item.id;
            }
            // 4. Update its status on the project board to "Testing" (ddca9270)
            const fieldId = "PVTSSF_lADOEfI01s4BdlhxzhYGB9g";
            const optionId = "ddca9270"; // Testing status
            const statusMutation = `
                mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                    updateProjectV2ItemFieldValue(
                        input: {
                            projectId: $projectId
                            itemId: $itemId
                            fieldId: $fieldId
                            value: { singleSelectOptionId: $optionId }
                        }
                    ) {
                        projectV2Item {
                            id
                        }
                    }
                }
            `;
            await graphqlWithAuth(statusMutation, {
                projectId: defaultProjectId,
                itemId,
                fieldId,
                optionId
            });
            projectUpdateStatus = `Project item ${itemId} status set to Testing`;
        }
        return {
            content: [{
                    type: "text",
                    text: `Comment added to issue #${args.issueNumber} (${commentRes.data.html_url}). ${projectUpdateStatus}.`
                }]
        };
    }
    if (name === "restart_game") {
        const quicktest = args.quicktest !== false;
        // 1. Try to kill the RimWorld process
        let killMsg = "RimWorld process not running or failed to kill.";
        try {
            (0, child_process_1.execSync)('taskkill /f /im RimWorldWin64.exe', { stdio: 'ignore' });
            killMsg = "RimWorld process killed successfully.";
        }
        catch (e) {
            // Process might not be running
        }
        // 2. Resolve RimWorld executable path from GamePath.props
        let rimworldPath = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld";
        const propsPath = "d:\\github\\rimsynapse\\Core\\Source\\GamePath.props";
        if (fs.existsSync(propsPath)) {
            const content = fs.readFileSync(propsPath, "utf-8");
            const match = content.match(/<RimWorldPath>(.*?)<\/RimWorldPath>/);
            if (match) {
                rimworldPath = match[1].trim();
            }
        }
        const rimworldExe = path.join(rimworldPath, "RimWorldWin64.exe");
        if (!fs.existsSync(rimworldExe)) {
            throw new Error(`RimWorld executable not found at: ${rimworldExe}`);
        }
        // 3. Spawn the game process via cmd.exe start
        const argsStr = quicktest ? "-quicktest" : "";
        try {
            (0, child_process_1.execSync)(`cmd.exe /c start "" "${rimworldExe}" ${argsStr}`, { stdio: 'ignore' });
        }
        catch (err) {
            throw new Error(`Failed to launch RimWorld: ${err.message}`);
        }
        return {
            content: [{
                    type: "text",
                    text: `${killMsg} Relaunched RimWorld at ${rimworldExe} with args: "${argsStr}".`
                }]
        };
    }
    if (name === "configure_active_mods") {
        const configPath = "C:\\Users\\sealt\\AppData\\LocalLow\\Ludeon Studios\\RimWorld by Ludeon Studios\\Config\\ModsConfig.xml";
        if (!fs.existsSync(configPath)) {
            throw new Error(`ModsConfig.xml not found at: ${configPath}`);
        }
        let content = fs.readFileSync(configPath, "utf8");
        // Map of DLC keywords to their mod IDs
        const dlcMap = {
            royalty: "ludeon.rimworld.royalty",
            ideology: "ludeon.rimworld.ideology",
            biotech: "ludeon.rimworld.biotech",
            anomaly: "ludeon.rimworld.anomaly",
            odyssey: "ludeon.rimworld.odyssey"
        };
        // Extract current active mods list
        let activeList = [];
        const match = content.match(/<activeMods>([\s\S]*?)<\/activeMods>/);
        if (match) {
            const listMatches = match[1].matchAll(/<li>(.*?)<\/li>/g);
            for (const lm of listMatches) {
                activeList.push(lm[1].trim());
            }
        }
        if (args.activeMods && Array.isArray(args.activeMods)) {
            activeList = args.activeMods;
        }
        else {
            // Apply enableDlc
            if (args.enableDlc && Array.isArray(args.enableDlc)) {
                for (const d of args.enableDlc) {
                    const key = d.toLowerCase();
                    if (dlcMap[key] && !activeList.includes(dlcMap[key])) {
                        activeList.push(dlcMap[key]);
                    }
                }
            }
            // Apply disableDlc
            if (args.disableDlc && Array.isArray(args.disableDlc)) {
                for (const d of args.disableDlc) {
                    const key = d.toLowerCase();
                    if (dlcMap[key]) {
                        activeList = activeList.filter(m => m !== dlcMap[key]);
                    }
                }
            }
        }
        // Standardize list (keep duplicates out)
        activeList = Array.from(new Set(activeList.map(m => m.trim())));
        // Sort active mods list to respect official RimWorld load order:
        // 1. Harmony
        // 2. Core (ludeon.rimworld)
        // 3. Official DLCs (ludeon.rimworld.royalty, ludeon.rimworld.ideology, etc.)
        // 4. Other mods (e.g. rimsynapse.core, rimsynapse.nvidiatool)
        const officialOrder = [
            "brrainz.harmony",
            "ludeon.rimworld",
            "ludeon.rimworld.royalty",
            "ludeon.rimworld.ideology",
            "ludeon.rimworld.biotech",
            "ludeon.rimworld.anomaly",
            "ludeon.rimworld.odyssey"
        ];
        activeList.sort((a, b) => {
            const idxA = officialOrder.indexOf(a.toLowerCase());
            const idxB = officialOrder.indexOf(b.toLowerCase());
            if (idxA !== -1 && idxB !== -1) {
                return idxA - idxB;
            }
            if (idxA !== -1)
                return -1;
            if (idxB !== -1)
                return 1;
            return a.localeCompare(b);
        });
        // Format activeMods XML block
        const newActiveXml = `<activeMods>\n` + activeList.map(m => `        <li>${m}</li>`).join("\n") + `\n    </activeMods>`;
        if (content.includes("<activeMods>")) {
            content = content.replace(/<activeMods>[\s\S]*?<\/activeMods>/, newActiveXml);
        }
        else {
            content = content.replace("<ModsConfigData>", `<ModsConfigData>\n    ${newActiveXml}`);
        }
        fs.writeFileSync(configPath, content, "utf8");
        return {
            content: [{
                    type: "text",
                    text: `Successfully configured ModsConfig.xml. Active mods: ${JSON.stringify(activeList)}.`
                }]
        };
    }
    throw new Error(`Unknown testing tool: ${name}`);
}
