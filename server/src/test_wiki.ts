import { handleWikiTool } from "./tools/wiki";

async function test() {
    console.log("=== Testing Wiki Listing ===");
    let result = await handleWikiTool("query_wiki_database", {});
    console.log(result.content[0].text);

    console.log("\n=== Testing Wiki Search ===");
    result = await handleWikiTool("query_wiki_database", { searchQuery: "LLM" });
    console.log(result.content[0].text);

    console.log("\n=== Testing Wiki Read ===");
    result = await handleWikiTool("query_wiki_database", { documentName: "Introduction.md" });
    console.log(result.content[0].text);
}

test().catch(console.error);
