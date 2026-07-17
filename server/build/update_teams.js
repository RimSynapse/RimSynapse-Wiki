"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const graphql_1 = require("@octokit/graphql");
async function updateTeams() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const graphqlWithAuth = graphql_1.graphql.defaults({ headers: { authorization: `token ${token}` } });
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
