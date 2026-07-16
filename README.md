# Repo-MCP

Welcome to the **Repo-MCP** repository for the **RimSynapse** ecosystem.

This repository serves as the central hub for our organizational scripting and **Model Context Protocol (MCP)** configurations. It enables local AI agents to dynamically interact with all RimSynapse repositories, seamlessly syncing GitHub Issues, Projects, and codebase changes.

## Directory Structure

*   `mcp-config/` - Contains configurations for our local GitHub MCP server. Agents use these settings to interface with GitHub APIs dynamically without needing hardcoded scripts.
*   `scripts/` - Legacy and auxiliary PowerShell scripts for organization management.
    *   `sync_wikis.ps1`: Script to push localized `/Learning` folder Markdown files from all repositories to their respective GitHub Wikis.
*   `artwork/` - Assorted organizational artwork and assets.

## Setting up MCP

*Note: More detailed instructions for spinning up the MCP server will be provided as the configuration is finalized.*

---
*For updates, please review the [Changelog](Changelog.md).*
