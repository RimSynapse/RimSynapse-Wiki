import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { getGitHubToken, loadConfig } from "./config";

async function dumpDetailed() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });
    
    console.log("Querying project items with field values...");
    const query = `
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
                                    url
                                    state
                                    labels(first: 10) {
                                        nodes {
                                            name
                                        }
                                    }
                                    repository {
                                        name
                                    }
                                }
                                ... on PullRequest {
                                    number
                                    title
                                    url
                                    state
                                    labels(first: 10) {
                                        nodes {
                                            name
                                        }
                                    }
                                    repository {
                                        name
                                    }
                                }
                            }
                            fieldValues(first: 15) {
                                nodes {
                                    ... on ProjectV2ItemFieldSingleSelectValue {
                                        name
                                        field {
                                            ... on ProjectV2FieldCommon {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;
    
    const res: any = await graphqlWithAuth(query, { projectId: config.defaultProjectId });
    const items = res.node?.items?.nodes || [];
    
    console.log(`\nFound ${items.length} items on the project board.`);
    
    for (const item of items) {
        const content = item.content || {};
        const fieldVals = item.fieldValues?.nodes || [];
        
        const statusField = fieldVals.find((fv: any) => fv.field?.name === "Status");
        const teamField = fieldVals.find((fv: any) => fv.field?.name === "Team");
        
        const repo = content.repository?.name || "Unknown";
        const number = content.number || null;
        const title = content.title || "Untitled";
        const state = content.state || "UNKNOWN";
        const status = statusField ? statusField.name : "None";
        const team = teamField ? teamField.name : "None";
        const labels = content.labels?.nodes?.map((l: any) => l.name) || [];
        
        console.log(`ITEM: [${repo} #${number}] Title: "${title}" | Status: ${status} | Team: ${team} | State: ${state} | Labels: [${labels.join(", ")}]`);
    }
}

dumpDetailed().catch(console.error);
