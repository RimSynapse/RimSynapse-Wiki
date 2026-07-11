# RimSynapse Core API Breakdown

RimSynapse-Core is the backbone of the RimSynapse mod family. It abstracts away all HTTP communication, asynchronous queueing, context embedding, and hardware monitoring, providing companion mods with a clean, heavily optimized C# API.

## 1. Mod Registration (`SynapseCore.cs`)
Before using the LLM engine, companion mods must register during startup.

- **`SynapseCore.Register(string modId, string displayName, string systemPrompt = null)`**
  Registers your mod and returns a `SynapseModHandle`. This handle must be passed to all subsequent API calls. You can define a default System Prompt here.
- **`SynapseCore.IsModLoaded(string modId)`**
  Safely checks if another companion mod (like `RimSynapsePsychology`) is loaded, allowing for cross-mod integrations without strict assembly dependencies.

## 2. LLM Dispatch (`SynapseClient.cs`)
All communication with LM Studio/Ollama runs through `SynapseClient`. Requests are queued by priority, dynamically scored, and processed asynchronously on a background thread. Callbacks are guaranteed to execute on the main thread.

- **`ChatAsync(SynapseModHandle mod, List<ChatMessage> messages, ChatOptions options, Action<ChatResult> callback)`**
  The standard pipeline for sending OpenAI-formatted messages to the LLM. 
- **`PromptAsync(SynapseModHandle mod, string systemPrompt, string userMessage, Action<ChatResult> callback, ChatOptions options = null)`**
  A convenience wrapper for simple queries. `ChatOptions` can include `requestName` and `targetName` to populate the Queue Monitor.
- **`ChatFromJsonAsync`** / **`ChatFromXmlAsync`**
  Convenience wrappers that automatically parse JSON or XML into message structures.

### Global Status Getters
- **`SynapseClient.IsOnline`**: Returns true if the LLM backend is actively responding.
- **`SynapseClient.ActiveModelName`**: The name of the currently loaded model.
- **`SynapseClient.TotalQueueDepth`**: The number of pending requests across all mods.
- **`SynapseClient.ThrottleLevel`**: The current dynamic game-speed throttle.
- **`SynapseClient.Gpu`**: Exposes real-time VRAM/GPU stats populated by the NVIDIA integration tool.

## 3. The Opportunistic Task Engine (`SynapseClient.cs`)
Rather than freezing the game or hoarding CPU cycles, non-critical generations (like AI backstories or relationship memories) should be registered as Opportunistic Tasks.

- **`RegisterOpportunisticTask(SynapseModHandle mod, string taskId, Action callback, OpportunisticTaskConfig config)`**
  Registers a low-priority background function. The Core engine will automatically trigger the `callback` when the main LLM request queue is empty, respecting the defined `CooldownTicks`, `Priority`, and `Weight` limits.

## 4. Context Embedding (`SynapseCoreContext.cs`)
Mods can leverage the Core's dynamic context engine to inject colony state into their prompts without writing custom scrapers.

- **`GetContextText(string eventType, Pawn sourcePawn = null, Pawn targetPawn = null)`**
  Assembles a rich text string containing colony wealth, food reserves, and the specific pawns' health/mood statuses.
- **`ResolvePrompt(string eventType, string modId)`**
  Reads from `SynapsePromptDef` XMLs to resolve event-specific system prompts.

## 5. Event Tracking (`SynapseCoreWorldComponent.cs`)
Core maintains a rolling, serializable backlog of major colony events.

- **`EnqueuePastEvent(PastEvent pastEvent)`**
  Pushes a new event to the backlog. Core automatically snapshots the colony's wealth, nutrition, and every colonist's mood/health at the exact tick the event occurred.
- **`GetRecentEvents(int count)`**
  Retrieves the most recent events, perfect for providing the LLM with chronological context of what just happened before a chat or mental break.
