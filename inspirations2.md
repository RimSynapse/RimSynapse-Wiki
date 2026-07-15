# Inspirations: Game MCP Architecture for RimSynapse Wiki

This document outlines the refactoring guidelines for **RimSynapse Wiki** using the Model Context Protocol (MCP).

---

## 1. What Stays the Same
- **Wiki Search UI**: The in-game search interface, categorizations, and markdown text views.
- **Local Encyclopedia Index**: The dictionary of guides, tips, and items database remains in C#.

---

## 2. What Changes (The MCP Shift)
- **Mod Lore Access**: Allow the storyteller or dialogue LLM to query tutorials or item wiki descriptions dynamically.
- **Intelligent Referencing**: When writing a dialogue response or pacing commentary, the LLM can lookup wiki details to explain game rules or lore terms.

---

## 3. Proposed MCP Tools for Wiki
- `query_wiki_database`: Searches the encyclopedia for a term (e.g. *"Plasteel"*, *"Psychic Droner"*) and returns its summary, utility, and base statistics.

---

## 4. LLM Narrative Workflow
1. The Storyteller decides to spawn a mechanoid siege.
2. It queries `query_wiki_database("Centipede")` to double check the threat profile of the mechanoids it is about to spawn.
3. The LLM comments on the warning: *"Centipedes are lumbering tanks; their heavy blaster will rip through your wooden barricades easily. Prepare yourselves."*
