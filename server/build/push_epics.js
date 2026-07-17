"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const projects_1 = require("./tools/projects");
const rest_1 = require("@octokit/rest");
async function createIssues() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const octokit = new rest_1.Octokit({ auth: token });
    const epics = [
        {
            title: "[Epic] Global Commerce & Taxation (Empire / VOE Replacement)",
            body: "Expand the Factions economic simulation to allow dynamic trading, taxation, and specialized outposts, serving as a highly optimized, native replacement for *Empire Refactored* and *Vanilla Outposts Expanded*.\n\n**Acceptance Criteria:**\n- [ ] **Outpost Spawning & Territory**: Outposts establish a small 1-tile territory spacing.\n- [ ] **Outpost Connection Multiplier**: Outposts apply a 3x multiplier to a single resource. If their territory connects to a territory with a City, this multiplier scales up to a maximum of 6x based on the number of connected cities.\n- [ ] **Tithes & Taxation**: The surplus generated during the Staggered Daily Tick is automatically routed to the faction's capital.\n- [ ] **Governors & Specialists**: Assigning a pawn to govern a settlement calculates their relevant skills and injects a direct multiplier into `TickSettlementProduction()`.\n- [ ] **Trade Routes**: Settlements with high raw resource production dispatch trade caravans."
        },
        {
            title: "[Epic] Event Hooks & Settlement Crises (Vanilla Events Replacement)",
            body: "Replace disconnected text-box events with dynamic incidents that physically impact the `SettlementStoryTracker`, triggering geopolitical LLM reactions.\n\n**Acceptance Criteria:**\n- [ ] **Vanilla IncidentWorker Hooks**: Patch into RimWorld's `IncidentWorker` to target specific AI `SettlementStoryTrackers`.\n- [ ] **Dynamic Ticking Crises (e.g., Blight)**: Disasters scale dynamically over time. For example, a Blight reduces crop yield by 3% per day (max 15% at 5 days), then slowly recovers by 1% per day (15 days), explicitly updating the tracker status to `blight (recovering)`.\n- [ ] **Equipment Maintenance (Upkeep)**: High-tech factions require constant consumption of manufactured goods.\n- [ ] **LLM Geopolitical Reactions**: Ensure the `SynapseFactionEvaluator` exposes these ticking crises to the LLM so they can broadcast desperate pleas or use starvation as a Casus Belli."
        },
        {
            title: "[Epic] Ideology & Diplomacy Hooks",
            body: "Ensure the LLM understands complex Ideological frameworks and uses them to justify diplomacy and war, without bloating the prompt context window.\n\n**Acceptance Criteria:**\n- [ ] **Context-Efficient Ideology Injection**: Extract `Faction.ideos.PrimaryIdeo.memes` and inject a highly condensed summary of the faction's core tenets into the LLM prompt.\n- [ ] **Ideological Casus Belli**: The LLM must explicitly use these ideological memes as justifications for evaluating other factions and declaring war.\n- [ ] **Vassalage System**: Weaker factions swear fealty to stronger empires for protection.\n- [ ] **Rumor & Knowledge Tracking**: Extend the knowledge propagation system so that settlements only react to events if the rumor physically reaches them."
        },
        {
            title: "[Epic] Dynamic Visit Settlements (Combat/Generation Hooks)",
            body: "Ensure that when a player physically enters an AI settlement map, the physical game objects perfectly match our backend simulation.\n\n**Acceptance Criteria:**\n- [ ] **Map Generation Hooks**: Patch the map generator to query the `SettlementStoryTracker` prior to generating physical objects.\n- [ ] **Dynamic Defenses & Loot**: If the tracker is in **Underpopulated Scarcity**, replace walls with ruined variants, reduce defenders, and limit loot. If **Overpopulated Spacer Boom**, spawn heavy turrets, advanced components, and fully armored defenders.\n- [ ] **Settlement Expansion/Abandonment**: Settlements dynamically expand into new tiles or collapse into abandoned ruins based on their population capacity."
        }
    ];
    for (const epic of epics) {
        console.log(`Creating Issue '${epic.title}'...`);
        const issueRes = await octokit.issues.create({
            owner: "RimSynapse",
            repo: "Factions",
            title: epic.title,
            body: epic.body
        });
        console.log(`Created Issue: ${issueRes.data.html_url} (Node ID: ${issueRes.data.node_id})`);
        console.log("Adding Issue to Project Board...");
        try {
            const addRes = await (0, projects_1.handleProjectTool)("add_project_item", { contentId: issueRes.data.node_id }, token, config.defaultProjectId);
            console.log(addRes.content[0].text);
        }
        catch (err) {
            console.error("Failed to add to project board:", err);
        }
    }
}
createIssues().catch(console.error);
