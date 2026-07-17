"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wiki_1 = require("./tools/wiki");
async function test() {
    console.log("=== Testing Wiki Listing ===");
    let result = await (0, wiki_1.handleWikiTool)("query_wiki_database", {});
    console.log(result.content[0].text);
    console.log("\n=== Testing Wiki Search ===");
    result = await (0, wiki_1.handleWikiTool)("query_wiki_database", { searchQuery: "LLM" });
    console.log(result.content[0].text);
    console.log("\n=== Testing Wiki Read ===");
    result = await (0, wiki_1.handleWikiTool)("query_wiki_database", { documentName: "Introduction.md" });
    console.log(result.content[0].text);
}
test().catch(console.error);
