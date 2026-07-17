import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import { graphql } from "@octokit/graphql";

export const testingTools = [
    {
        name: "create_testing_plan_issues",
        description: "Parse a local testing plan Markdown file, add it as a comment to the issue, and set the project item status to 'Testing'",
        inputSchema: {
            type: "object",
            properties: {
                repo: { type: "string", description: "The repository containing the issue" },
                issueNumber: { type: "number", description: "The number of the issue/ticket to comment on" },
                planFilePath: { type: "string", description: "Absolute local path to the testing plan MD file" }
            },
            required: ["repo", "issueNumber", "planFilePath"]
        }
    }
];

export async function handleTestingTool(
    name: string,
    args: any,
    octokit: Octokit,
    org: string,
    token?: string,
    defaultProjectId?: string
) {
    if (name === "create_testing_plan_issues") {
        if (!fs.existsSync(args.planFilePath)) {
            throw new Error(`Testing plan file not found: ${args.planFilePath}`);
        }
        
        const content = fs.readFileSync(args.planFilePath, "utf8");
        const commentBody = `### Testing Plan\n\n${content}`;
        
        // 1. Post comment on the issue
        const commentRes = await octokit.rest.issues.createComment({
            owner: org,
            repo: args.repo,
            issue_number: args.issueNumber,
            body: commentBody
        });
        
        let projectUpdateStatus = "No project item updated (token or defaultProjectId missing)";
        
        if (token && defaultProjectId) {
            const graphqlWithAuth = graphql.defaults({
                headers: {
                    authorization: `token ${token}`
                }
            });
            
            // 2. Fetch the issue's node ID
            const { data: issue } = await octokit.rest.issues.get({
                owner: org,
                repo: args.repo,
                issue_number: args.issueNumber
            });
            const issueNodeId = issue.node_id;
            
            // 3. Query the issue's projectItems
            const query = `
                query($issueId: ID!) {
                    node(id: $issueId) {
                        ... on Issue {
                            projectItems(first: 10) {
                                nodes {
                                    id
                                    project {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;
            const result: any = await graphqlWithAuth(query, { issueId: issueNodeId });
            const projectItems = result.node?.projectItems?.nodes || [];
            
            let projectItem = projectItems.find((item: any) => item.project?.id === defaultProjectId);
            let itemId = projectItem?.id;
            
            // If the item is not on the project board, add it first
            if (!itemId) {
                const addMutation = `
                    mutation($projectId: ID!, $contentId: ID!) {
                        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                            item {
                                id
                            }
                        }
                    }
                `;
                const addResult: any = await graphqlWithAuth(addMutation, { 
                    projectId: defaultProjectId, 
                    contentId: issueNodeId 
                });
                itemId = addResult.addProjectV2ItemById.item.id;
            }
            
            // 4. Update its status on the project board to "Testing" (ddca9270)
            const fieldId = "PVTSSF_lADOEfI01s4BdlhxzhYGB9g";
            const optionId = "ddca9270"; // Testing status
            
            const statusMutation = `
                mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                    updateProjectV2ItemFieldValue(
                        input: {
                            projectId: $projectId
                            itemId: $itemId
                            fieldId: $fieldId
                            value: { singleSelectOptionId: $optionId }
                        }
                    ) {
                        projectV2Item {
                            id
                        }
                    }
                }
            `;
            await graphqlWithAuth(statusMutation, { 
                projectId: defaultProjectId, 
                itemId, 
                fieldId, 
                optionId 
            });
            
            projectUpdateStatus = `Project item ${itemId} status set to Testing`;
        }
        
        return { 
            content: [{ 
                type: "text", 
                text: `Comment added to issue #${args.issueNumber} (${commentRes.data.html_url}). ${projectUpdateStatus}.` 
            }] 
        };
    }
    
    throw new Error(`Unknown testing tool: ${name}`);
}
