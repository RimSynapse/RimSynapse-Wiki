import { getGitHubToken, loadConfig } from "./config";
import { graphql } from "@octokit/graphql";

async function queryFields() {
    const token = getGitHubToken();
    const config = loadConfig();
    const graphqlWithAuth = graphql.defaults({
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

    const result: any = await graphqlWithAuth(query, { projectId: config.defaultProjectId });
    console.log(JSON.stringify(result.node.fields.nodes, null, 2));
}

queryFields().catch(console.error);
