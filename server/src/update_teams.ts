import { getGitHubToken, loadConfig } from "./config";
import { graphql } from "@octokit/graphql";

async function updateTeams() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });
    
    const mutation = `
      mutation {
        updateProjectV2SingleSelectField(input: {
          projectId: "${config.defaultProjectId}",
          fieldId: "PVTSSF_lADOEfI01s4BdlhxzhYGCEM",
          options: [
            { name: "RimSynapse-Core", description: "", color: BLUE },
            { name: "RimSynapse-Chat", description: "", color: GREEN },
            { name: "RimSynapse-Factions", description: "", color: RED },
            { name: "RimSynapse-Psychology", description: "", color: YELLOW },
            { name: "Local-AI-Wrapper", description: "", color: PURPLE },
            { name: "RimSynapse-NVIDIA-Tool", description: "", color: ORANGE },
            { name: "RimSynapse-WorldNews", description: "", color: PINK },
            { name: "AuraAlgorithm", description: "", color: GRAY }
          ]
        }) {
          projectV2Field {
            ... on ProjectV2SingleSelectField {
              options {
                id
                name
              }
            }
          }
        }
      }
    `;
    const res = await graphqlWithAuth(mutation);
    console.log(JSON.stringify(res, null, 2));
}

updateTeams().catch(console.error);
