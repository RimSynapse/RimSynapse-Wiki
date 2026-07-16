"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("@octokit/graphql");
const config_1 = require("./config");
const token = (0, config_1.getGitHubToken)();
const graphqlWithAuth = graphql_1.graphql.defaults({ headers: { authorization: `token ${token}` } });
async function check() {
    const query = `
    query {
      node(id: "PVT_kwDOEfI01s4Bdlhx") {
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
check().catch(console.error);
