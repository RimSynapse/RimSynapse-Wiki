# RimSynapse Wiki

Welcome to the official documentation and changelog repository for the **RimSynapse** ecosystem. RimSynapse is a suite of mods that connect RimWorld to Large Language Models (LLMs) to generate dynamic, intelligent, and rich narratives.

## Active Modules

- **[RimSynapse - Core](RimSynapse-Core)**: The foundational engine that handles background API requests, priority queues, opportunistic task scheduling, and core event interception.
- **[RimSynapse - Factions](RimSynapse-Factions)**: Expands world interactions by generating deep faction histories, ideologies, and dynamic diplomacy via the LLM.
- **[RimSynapse - Psychology](RimSynapse-Psychology)**: Brings colonists to life by giving them evolving memories, complex interpersonal trust, therapeutic sessions, and trauma responses.
- **[RimSynapse - WorldNews](RimSynapse-WorldNews)**: Generates dynamic in-game newspapers that report on the events of your colony and the world at large.
- **[RimSynapse - Chat](RimSynapse-Chat)**: A UI framework that allows for direct interaction, questioning, and chatting with colonists and faction leaders.
- **[RimSynapse - NVIDIA Tool](RimSynapse-NVIDIA-Tool)**: A hardware integration tool that allows RimSynapse to monitor local VRAM usage and GPU load for local model generation.

## Setup Guides

- **[Cloud LLM Setup Guide](RimSynapse-Core/cloud-llms.md)**: Steps to acquire API keys and configure OpenAI, Google Gemini, Anthropic Claude, and ElevenLabs.
- **[Local TTS Setup Guide](RimSynapse-Core/local-tts-voicebox.md)**: Configuration and installation details for Voicebox local Text-to-Speech integration.

## Deprecated Modules

- **[RimSynapse - StoryTeller](RimSynapse-StoryTeller)**: *[DEPRECATED]* The initial storytelling logic (Aura Algorithm, event interception, and faction lore generation) has been migrated directly into `RimSynapse - Core` and `RimSynapse - Factions`.

---
*For updates, please review the [Changelog](Changelog.md).*
