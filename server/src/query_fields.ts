import { getGitHubToken, loadConfig } from "./config";
import { graphql } from "@octokit/graphql";

async function queryFields() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });
    
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
