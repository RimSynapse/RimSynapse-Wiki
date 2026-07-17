import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";

const STATUS_FIELD_ID = "PVTSSF_lADOEfI01s4BdlhxzhYGB9g";
const TESTING_OPTION_ID = "ddca9270"; // Option ID for "Testing" status

interface ProjectItem {
    itemId: string;
    repo: string;
    number: number;
    title: string;
}

async function runCleanup() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });
    const octokit = new Octokit({ auth: token });
    const org = config.organization;
    
    console.log("1. Fetching all project items...");
    const projectItemsQuery = `
        query($projectId: ID!) {
            node(id: $projectId) {
                ... on ProjectV2 {
                    items(first: 100) {
                        nodes {
                            id
                            content {
                                ... on Issue {
                                    number
                                    title
                                    repository {
                                        name
                                    }
                                }
                                ... on PullRequest {
                                    number
                                    title
                                    repository {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;
    const res: any = await graphqlWithAuth(projectItemsQuery, { projectId: config.defaultProjectId });
    const rawItems = res.node?.items?.nodes || [];
    
    const itemsMap = new Map<string, string>(); // Key: "repo/number", Value: itemId
    const projectItemsList: ProjectItem[] = [];
    
    for (const item of rawItems) {
        if (!item.content) continue;
        const repo = item.content.repository?.name;
        const number = item.content.number;
        if (repo && number) {
            itemsMap.set(`${repo}/${number}`, item.id);
            projectItemsList.push({
                itemId: item.id,
                repo,
                number,
                title: item.content.title
            });
        }
    }
    
    console.log(`Mapped ${itemsMap.size} project board items.`);
    
    // Helper to update project status of an item to Testing
    const setStatusToTesting = async (itemId: string, info: string) => {
        console.log(`  Updating status to Testing for project item ${itemId} (${info})...`);
        const statusMutation = `
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                updateProjectV2ItemFieldValue(
                    input: {
                        projectId: $projectId
                        itemId: $itemId
                        fieldId: $fieldId
                        value: { singleSelectOptionId: $optionId }
                    }
                ) { projectV2Item { id } }
            }
        `;
        await graphqlWithAuth(statusMutation, {
            projectId: config.defaultProjectId,
            itemId,
            fieldId: STATUS_FIELD_ID,
            optionId: TESTING_OPTION_ID
        });
    };
    
    // Helper to update labels and add comments
    const updateIssue = async (repo: string, number: number, labels: string[], comment?: string) => {
        console.log(`  Updating ${repo} #${number}: Labels -> [${labels.join(", ")}]`);
        if (labels.length > 0) {
            await octokit.rest.issues.addLabels({
                owner: org,
                repo,
                issue_number: number,
                labels
            });
        }
        if (comment) {
            console.log(`  Adding comment to ${repo} #${number}...`);
            await octokit.rest.issues.createComment({
                owner: org,
                repo,
                issue_number: number,
                body: comment
            });
        }
    };
    
    // Helper to close issue as duplicate
    const closeAsDuplicate = async (repo: string, number: number, targetNumber: number) => {
        console.log(`  Closing ${repo} #${number} as duplicate of #${targetNumber}...`);
        await octokit.rest.issues.createComment({
            owner: org,
            repo,
            issue_number: number,
            body: `Closed as duplicate of #${targetNumber}.`
        });
        await octokit.rest.issues.addLabels({
            owner: org,
            repo,
            issue_number: number,
            labels: ["duplicate"]
        });
        await octokit.rest.issues.update({
            owner: org,
            repo,
            issue_number: number,
            state: "closed"
        });
    };

    // --- EXECUTE CLEANUP & CATEGORIZATION ---

    console.log("\n2. Processing Core Mod...");
    // Rename Core #4, add feature label, post comment, status -> Testing
    const core4ItemId = itemsMap.get("Core/4");
    if (core4ItemId) {
        await octokit.rest.issues.update({
            owner: org,
            repo: "Core",
            issue_number: 4,
            title: "Feature: RimSynapse-Core Systems"
        });
        const coreTestPlan = `### Testing Plan: RimSynapse - Core

## Mod Settings and API Connections
*   [ ] **API Connections:** Verify that API keys (Gemini, OpenAI, ElevenLabs, or local LLMs) connect and test calls return success.
*   [ ] **Routing Selectors:** Test selecting different providers for Text, Images, and Audio.
*   [ ] **Sliders:** Adjust settings sliders, particularly the **Short Term Memory Length** slider (default 24 hours, slides up to 72 hours).

## Storyteller Chat
*   [ ] **Storyteller Window:** Open the direct Storyteller Chat window, submit a message, and check for a contextual response.
*   [ ] **Audio Playback:** Confirm that text-to-speech audio streams and plays back successfully upon storyteller replies.`;
        
        await updateIssue("Core", 4, ["feature"], coreTestPlan);
        await setStatusToTesting(core4ItemId, "Core #4");
    }

    console.log("\n3. Processing Local-AI-Wrapper Mod...");
    // Close duplicates
    await closeAsDuplicate("Local-AI-Wrapper", 1, 10);
    await closeAsDuplicate("Local-AI-Wrapper", 8, 10);
    
    // Close test plans #2 and #9
    console.log("  Closing obsolete independent test plan issues in Local-AI-Wrapper...");
    for (const num of [2, 9]) {
        await octokit.rest.issues.createComment({
            owner: org,
            repo: "Local-AI-Wrapper",
            issue_number: num,
            body: `Obsolete independent test plan issue. Testing plans are now integrated directly on the main feature ticket.`
        });
        await octokit.rest.issues.update({
            owner: org,
            repo: "Local-AI-Wrapper",
            issue_number: num,
            state: "closed"
        });
    }

    // Update Local-AI-Wrapper #10 to Testing with labels
    const wrapper10ItemId = itemsMap.get("Local-AI-Wrapper/10");
    if (wrapper10ItemId) {
        await updateIssue("Local-AI-Wrapper", 10, ["feature", "good first issue"]);
        await setStatusToTesting(wrapper10ItemId, "Local-AI-Wrapper #10");
    }

    console.log("\n4. Processing Conversations Mod...");
    // Close duplicate Conversations #18
    await closeAsDuplicate("Conversations", 18, 10);
    
    // Close obsolete independent test plan Conversations #2
    console.log("  Closing obsolete independent test plan issue Conversations #2...");
    await octokit.rest.issues.createComment({
        owner: org,
        repo: "Conversations",
        issue_number: 2,
        body: `Obsolete independent test plan. Test plans are now attached directly to feature tickets.`
    });
    await octokit.rest.issues.update({
        owner: org,
        repo: "Conversations",
        issue_number: 2,
        state: "closed"
    });
    
    // Conversations features to move to Testing
    const convFeatures = [
        {
            num: 4,
            comment: `### Testing Plan Section: Pawn-to-Pawn Dialogues & Short-Term Memory

*   [ ] **Dialogue Interception:** Verify that natural social interactions between colonists trigger single-sentence visual bubbles (\`MoteMaker.ThrowText\`) instead of vanilla log lines.
*   [ ] **Social Composure:**
    *   Test that introverts or pawns with low opinions frequently choose silence (ellipses \`...\` bubbles).
    *   Test that a recipient with a high Doctor skill (Medicine level >= 8) remains silent when targeted by a pawn on an insulting spree.
    *   Test that a recipient with high trust (> 20) with the speaker remains silent when targeted by an insulting spree.
    *   Verify that the target remaining silent during an insulting spree triggers a positive \`RapportBuilt\` memory for the instigator after they calm down.
*   [ ] **Earshot Range and Rooms:**
    *   Test earshot range at 8 cells base distance.
    *   Place active generators or order mining/cutting jobs nearby and verify the range shrinks by 1 cell per source of noise.
    *   Verify that conversations inside a closed room do not propagate to bystanders outside the room.
*   [ ] **Short-Term Memory:**
    *   Initiate a conversation, wait, and verify the pawns retain their conversation thread.
    *   Verify that threads expire and prune once they exceed the tick count configured on the Core settings slider (e.g. 24 hours vs 72 hours).`
        },
        {
            num: 10,
            comment: `### Testing Plan Section: UI and Gizmos

*   [ ] **Gizmo:** Select a colonist and verify the **Chat History** button appears on their inspect card.
*   [ ] **History App Window:** Open the history window and check the dual-pane layout:
    *   Left side showing recent contact list with portraits.
    *   Right side displaying messaging bubbles (right-aligned for self, left-aligned for recipient) and relative timestamps.
    *   Test the **Clear** button to purge the selected thread.`
        },
        {
            num: 5,
            comment: `### Testing Plan Section: Royalty DLC Integration

*   [ ] \`get_royal_demands\`: Returns title details (Royalty DLC).`
        },
        {
            num: 6,
            comment: `### Testing Plan Section: Ideology DLC Integration

*   [ ] \`get_faith_precepts\` and \`apply_conversion_attempt\`: Returns certainty and offsets it (Ideology DLC).`
        },
        {
            num: 7,
            comment: `### Testing Plan Section: Biotech DLC Integration

*   [ ] \`get_xenotype_identity\` and \`get_mechanitor_status\`: Returns genes and mechs info (Biotech DLC).`
        },
        {
            num: 8,
            comment: `### Testing Plan Section: Anomaly DLC Integration

*   [ ] \`get_void_melancholy\` and \`attempt_mental_soothe\`: Calms void panic (Anomaly DLC).`
        },
        {
            num: 9,
            comment: `### Testing Plan Section: Odyssey Integration

*   [ ] \`get_orbital_hazards\`: Exposes spatial coordinates (SOS2).`
        }
    ];

    for (const f of convFeatures) {
        const itemId = itemsMap.get(`Conversations/${f.num}`);
        if (itemId) {
            await updateIssue("Conversations", f.num, ["feature"], f.comment);
            await setStatusToTesting(itemId, `Conversations #${f.num}`);
        }
    }

    console.log("\n5. Processing Psychology Mod...");
    // Close obsolete independent test plan Psychology #16
    console.log("  Closing obsolete independent test plan issue Psychology #16...");
    await octokit.rest.issues.createComment({
        owner: org,
        repo: "Psychology",
        issue_number: 16,
        body: `Obsolete independent test plan. Test plans are now attached directly to feature tickets.`
    });
    await octokit.rest.issues.update({
        owner: org,
        repo: "Psychology",
        issue_number: 16,
        state: "closed"
    });

    const psychFeatures = [
        {
            num: 25,
            comment: `### Testing Plan Section: Trait Evaluation

*   [ ] **Trait Evaluation:** Run the game for 24 hours and verify that the LLM evaluation runs and dynamically adjusts pawn traits based on recent events.`
        },
        {
            num: 24,
            comment: `### Testing Plan Section: Trust and Familiarity (Social Network Visualization)

*   [ ] **Trust and Familiarity:** Open the Social Network tab to check custom Trust (-100 to 100) and Familiarity (0 to 100) stats. Verify that opinion math is weighted 50% vanilla opinion and 50% custom Trust.`
        },
        {
            num: 23,
            comment: `### Testing Plan Section: Trust and Familiarity (Familiarity Milestones)

*   [ ] **Trust and Familiarity:** Open the Social Network tab to check custom Trust (-100 to 100) and Familiarity (0 to 100) stats. Verify that opinion math is weighted 50% vanilla opinion and 50% custom Trust.`
        },
        {
            num: 18,
            comment: `### Testing Plan Section: PTSD Trauma Snaps

*   [ ] **PTSD Trauma Snaps:** Trigger a trauma snapping break (e.g. with high negative memories) and verify that the pawn fires at doors/walls before cowering, and snaps out if they hit a living creature.`
        },
        {
            num: 17,
            comment: `### Testing Plan Section: Therapy Sessions

*   [ ] **Therapy Sessions:** Right-click another colonist to initiate couples/trauma therapy. Test both manual dialogue input and automated background resolutions.`
        },
        {
            num: 22,
            comment: `### Testing Plan Section: Marriage and Funeral Speeches

*   [ ] **Marriage and Funeral Speeches:** Wait for a wedding or funeral and verify the pawn recites vows or eulogies pulling from shared memories.`
        }
    ];

    for (const f of psychFeatures) {
        const itemId = itemsMap.get(`Psychology/${f.num}`);
        if (itemId) {
            await updateIssue("Psychology", f.num, ["feature"], f.comment);
            await setStatusToTesting(itemId, `Psychology #${f.num}`);
        }
    }
    
    // Move remaining Psychology open issues to Testing and label them feature (since mod is in dev testing phase)
    for (const num of [19, 20, 21, 26]) {
        const itemId = itemsMap.get(`Psychology/${num}`);
        if (itemId) {
            await updateIssue("Psychology", num, ["feature"]);
            await setStatusToTesting(itemId, `Psychology #${num}`);
        }
    }

    console.log("\n6. Labeling all remaining open project board items...");
    // Go through all project items and apply feature/task labels based on their titles and repos
    for (const item of projectItemsList) {
        // Skip ones we already processed or closed
        if (item.repo === "Core" && item.number === 4) continue;
        if (item.repo === "Local-AI-Wrapper" && [1, 2, 8, 9, 10].includes(item.number)) continue;
        if (item.repo === "Conversations" && [2, 4, 5, 6, 7, 8, 9, 10, 18].includes(item.number)) continue;
        if (item.repo === "Psychology" && [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26].includes(item.number)) continue;
        
        const isTask = item.title.toLowerCase().includes("mcp tool:") || item.title.toLowerCase().includes("mcp shift:");
        const label = isTask ? "task" : "feature";
        
        await updateIssue(item.repo, item.number, [label]);
    }
    
    console.log("\n--- SCRUM MASTER CLEANUP AND CATEGORIZATION COMPLETE ---");
}

runCleanup().catch(console.error);
