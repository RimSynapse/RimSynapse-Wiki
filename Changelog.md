# RimSynapse Changelog

## [v0.4.0] - The World Events and News Update
This update introduces the `RimSynapse-WorldNews` module to broadcast global events and formally deprecates the `RimSynapse-StoryTeller` module, integrating its core functionality directly into the Core engine for better stability and cohesiveness.

### Features
- **RimSynapse-WorldNews Introduction**: A new module that generates dynamic, asymmetric in-game newspapers based on your colony's events and the broader world state.
- **World Event Ledger**: Tracks major historical and narrative occurrences as they happen.
- **Storyteller Integration**: The Aura Algorithm and standard storytelling event interception have been successfully migrated from the deprecated `StoryTeller` module into `RimSynapse-Core`.
- **Faction Lore Integration**: Faction generation and history mechanics have been migrated from `StoryTeller` into the `RimSynapse-Factions` module.

### API & Endpoint Changes
- **`[DEPRECATED]`** `RimSynapse-StoryTeller` is officially obsolete. Please unsubscribe from the standalone module.

---

## [v0.3.0] - The Mind and Memory Update
This update introduces deep psychological mechanics to `RimSynapse-Psychology`, allowing colonists' memories to shape their personalities, mental breakdowns, and therapeutic interactions.

### Features
- **PTSD & Trauma Breaks**: A new mental state `Synapse_TraumaTrigger` causes pawns with severe negative memories to blindly fire their weapon at surrounding doors, walls, or loud noises before cowering in fear. Hitting a living creature snaps them out of it.
- **Dynamic Personality Traits**: The 24-hour psychological evaluation now tracks profound life events. Pawns can dynamically gain or lose RimWorld `TraitDef`s (such as gaining `Bloodlust` or losing `Kind`) based on LLM analysis of their rolling short-term memory.
- **Player-Driven Therapy**: Players can now right-click pawns to initiate a `Therapy Session`. This opens a new UI window where you can act as a "Guiding Hand" and manually type out the initiating pawn's dialogue, or let the LLM resolve the conversation in the background based on their Intelligence, Social skill, and Ideology.
- **Opportunistic Euphoria**: Pawns who maintain an extremely high mood (>90%) for a sustained 24 in-game hours will now automatically generate a positive core memory.
- **Forced Psychological Reviews**: Added a "Force Psych Review" button to the pawn's Psychology tab, allowing players to demand an immediate LLM clinical evaluation of the pawn's mental state.

---

## [v0.2.1] - The Social Dynamics Update
This major update introduces the foundation of RimSynapse-Psychology, drastically changing how pawns interact and remember events.

### Features
- **Trust & Familiarity System**: Replaced vanilla's rigid opinion system with dynamic Trust (-100 to 100) and Familiarity (0 to 100) values.
- **Vanilla Opinion Balancing**: `OpinionOf` is now scaled down by 50% natively, with the custom Trust metric contributing the remaining 50% weight.
- **Ritual Remarks**: Hooked into RimWorld's `MarriageCeremonyUtility` and `RitualOutcomeEffectWorker_Funeral`. Colonists now pull from their LLM relationship memories to deliver Vows and Eulogies during these events.
- **UI Expansion**: Added the **Social Network** tab to the `Dialog_PawnPsychology` window to visualize the Trust/Familiarity metrics and the LLM relationship memories.

### API & Endpoint Changes
- **`[DEPRECATED]`** `SynapseClient.RegisterOpportunisticTask(SynapseModHandle mod, string taskId, Action callback, int cooldownTicks)` is now obsolete.
- **`[ADDED]`** `SynapseClient.RegisterOpportunisticTask(SynapseModHandle mod, string taskId, Action callback, OpportunisticTaskConfig config)` is the new standard API for scheduling background tasks, allowing mods to specify Priority, Weight, and Cooldown via a configuration object.

---

## [v0.2] - Core Engine Overhaul
This update focused on preventing the LLM queue from starving low-priority tasks and ensuring game stability during saves.

### Features
- **Dynamic Scoring**: Implemented a new dynamic scoring algorithm for the LLM priority queue (`Score = (Priority * 100,000) + CappedAgeInTicks - TokenPenalty`). This ensures older, lower-priority tasks (like background lore generation) eventually bubble up and don't starve.
- **Queue Save Linking**: The LLM Request Queue is now serialized. If a player exits and saves the game while LLM queries are queued, those queries will be saved and resume processing upon loading the save.
- **Silent Kill Hook**: Added a hook to silently kill background responses when exiting a game to the main menu, preventing phantom sound notifications from firing.

### API & Endpoint Changes
- **`[CHANGED]`** Internal queue processing now uses dynamic weight scoring instead of strict FIFO within tiers.
- **`[ADDED]`** Added `.AllTraits` serialization fix in `SynapsePsychologyOpportunistic` to properly interface with RimWorld 1.4 trait sets.

---

## [v0.1] - Initial Release
The foundational release of RimSynapse, bringing LLM integration directly into RimWorld.

### Features
- **Asynchronous LLM Dispatch**: Introduced the background thread queue to prevent RimWorld from freezing during HTTP calls to local LM Studio or Ollama instances.
- **Context Embedding Engine**: Built the initial system to snapshot colony wealth, nutrition, and colonist moods for LLM prompts.
- **AI Backstories**: Implemented the first version of dynamic Adulthood backstories for colony-born pawns and AI Faction Leader lore generation.

### API Endpoints
- **`[INITIAL]`** `SynapseCore.Register(modId, displayName, systemPrompt)`
- **`[INITIAL]`** `SynapseClient.ChatAsync(...)` and formatting wrappers.
- **`[INITIAL]`** `SynapseCoreContext.GetContextText(...)`
