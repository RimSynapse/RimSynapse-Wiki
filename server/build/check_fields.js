"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const graphql_1 = require("@octokit/graphql");
async function queryFields() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const graphqlWithAuth = graphql_1.graphql.defaults({
        headers: { authorization: `token ${token}` }
    });
    const query = `
        query($projectId: ID!) {
            node(id: $projectId) {
                ... on ProjectV2 {
                    fields(first: 20) {
                        nodes {
                            ... on ProjectV2Field { id name dataType }
                            ... on ProjectV2IterationField { id name dataType configuration { iterations { id title startDate duration } } }
                            ... on ProjectV2SingleSelectField { id name dataType options { id name } }
                        }
                    }
                }
            }
        }
    `;
    const result = await graphqlWithAuth(query, { projectId: config.defaultProjectId });
    console.log(JSON.stringify(result.node.fields.nodes, null, 2));
}
queryFields().catch(console.error);
