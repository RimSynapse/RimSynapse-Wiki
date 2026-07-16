import { graphql } from "@octokit/graphql";
import { getGitHubToken } from "./config";

const token = getGitHubToken();
const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${token}` } });

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
