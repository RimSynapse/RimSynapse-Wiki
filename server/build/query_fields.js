"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const graphql_1 = require("@octokit/graphql");
async function queryFields() {
    const token = (0, config_1.getGitHubToken)();
    const config = (0, config_1.loadConfig)();
    const graphqlWithAuth = graphql_1.graphql.defaults({ headers: { authorization: `token ${token}` } });
    const query = `
      query {
        node(id: "${config.defaultProjectId}") {
          ... on ProjectV2 {
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;
    const res = await graphqlWithAuth(query);
    console.log(JSON.stringify(res, null, 2));
}
queryFields().catch(console.error);
