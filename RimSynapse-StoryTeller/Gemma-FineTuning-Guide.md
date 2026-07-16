# Gemma 4 Fine-Tuning Guide for RimWorld AI Storyteller (RimSynapse MCP)

This guide provides a comprehensive walkthrough for training and fine-tuning **Gemma 4** models (specifically `gemma-4-E2B-it` or `gemma-4-E4B-it`) to act as a highly efficient, lightweight, and local AI Storyteller and command coordinator for RimSynapse.

---

## 1. Why Gemma 4 (E2B / E4B)?
* **Per-Layer Embeddings (PLE)**: Google DeepMind's "effective parameters" architecture allows Gemma 4 to achieve high-level reasoning with a very low active parameter footprint (E2B has 2.3B active; E4B has 4.5B active).
* **VRAM efficiency**: E2B runs in under 3 GB VRAM (when quantized to 4-bit/5-bit GGUF). E4B runs in under 5 GB VRAM.
* **128K Context Window**: Natively supports vast context histories, letting you feed detailed colonist profiles and long event backlogs without truncation.
* **Thinking Mode**: Support for reasoning traces before generating structured JSON output.

### Choosing Between E2B and E4B:
* **Gemma 4 E2B** (2.3B active parameters): Best for low-resource hardware, maximum inference speeds (60+ tokens/sec), and basic storyteller pacing.
* **Gemma 4 E4B** (4.5B active parameters): Recommended if you have at least 6GB+ free VRAM. The higher active parameter count doubles its logical reasoning capabilities, drastically reducing JSON syntax errors and enabling rich character dialogue in the **RimSynapse-Chat** module.

---

## 2. Telemetry and Dataset Collection
To train the model, you do not need to manually compile dataset files. We have built an in-game telemetry curator directly into the mod settings:

### Enabling the Dataset Curator:
1. Open RimWorld Mod Settings and navigate to **RimSynapse - Core**.
2. Locate the **Advanced** section and tick the checkbox labeled **"Enable Storyteller Fine-Tuning Curation"**.
3. **Optional (Dev/Fast-Generation)**: Check the nested box **"Enable Storyteller Fast-Telemetry Mode (Dev)"**.
   * *What it does*: Normally, pacing checks happen every 6 in-game hours, and event checks are relatively rare. Fast-Telemetry Mode forces a pacing check every **1,000 ticks** and a random event selection check every **2,000 ticks**.
   * *Auto-Pause Integration*: If your LLM has high latency (takes several seconds to respond), the mod will **automatically pause the game** while a storyteller query is in flight. It instantly restores your speed (such as Speed 4) as soon as the response arrives. This ensures your telemetry metrics are completely in-sync with the resulting decisions.
   * *How to use*: Toggle on **Developer Mode** in RimWorld settings, set the game speed to **Speed 4 (Ultra Speed)**, and let the game run. The mod will generate ~1 pacing log and ~0.5 event logs every single minute of real-time!
4. Play the game normally or run in fast mode. Every successful prompt/response cycle executed during gameplay will automatically be formatted into the proper Alpaca training schema and appended to:
   * **Path**: `%USERPROFILE%\AppData\LocalLow\Ludeon Studios\RimWorld by Ludeon Studios\RimSynapse\training_data.jsonl`

### Data Format (ShareGPT / Alpaca JSONL)
Each line represents a training sample in instruction format:

```json
{
  "instruction": "You are the AI Storyteller Coordinator. Evaluate the colony metrics and choose the pacing adjustments or request diagnostic/debug tools.",
  "input": "Colony General Metrics:\n- Wealth: 120000 | Silver: 1500 | Food: 320.5 points\n- Season: 67% growable\n- Population: 5 colonists (Local Density: 80)\n- Livestock: 12 tamed animals\n- Combat: 4 violent (3 armed) | Downed: 1 downed | Avg Mood: 72%\n\nRecent Events:\n- HostileRaid(Empire) (Success)\n- PawnJoin(Wanderer) (Success)",
  "output": "{\n  \"PacingMultiplier\": 1.25,\n  \"CategoryMultipliers\": {\n    \"ThreatBig\": 1.1,\n    \"ThreatSmall\": 1.0,\n    \"Misc\": 1.0,\n    \"DiseaseHuman\": 0.9,\n    \"FactionArrival\": 1.2\n  }\n}"
}
```

### Automated Synthetic Data Generation (Developer Mod)
If you want to rapidly generate thousands of structured training logs without waiting for natural gameplay, you can load the optional developer utility mod: **RimSynapse - LLM Trainer** (`LLM-Trainer`).

1. Enable the **RimSynapse - LLM Trainer** mod in your load order.
2. In-game, open RimWorld's **Debug Action Menu** (ensure Developer Mode is active).
3. Select **"Open LLM Training Panel"** under the RimSynapse category.
4. Set your target runs and choose one of the available simulation categories:
   * **Psychology**: Spawns a temporary colonist and sequentially fabricates 10 distinct physical/mental/social state matrices (wounds, traits, social events) in a loop, running the consolidation logic to output 10 unique data points per pawn.
   * **Dialogue/Chat**: Automates mock player chats and evaluates colonist replies in character.
   * **Storyteller Pacing**: Generates pacing and category evaluations in a tight accelerated loop.
   * **Factions**: Fabricates mock geopolitical events (border disputes, relation changes) to output lore logs.
   * **Path**: `%USERPROFILE%\AppData\LocalLow\Ludeon Studios\RimWorld by Ludeon Studios\RimSynapse\debug_training_data.jsonl`
6. **Crowd-Curation Git Upload**:
   * Once you have generated logs, click **"Upload to GitHub"** in the training suite panel.
   * *What it does*: The mod copies the dataset from LocalLow into the mod's `CurationData/` directory with a timestamped filename (e.g. `debug_training_data_20260715_213000.jsonl`), creates a new git branch `data-curation-<timestamp>` automatically, commits it, and pushes it to your configured remote origin.
   * *Pre-requisites*: Requires the local machine to have `git` installed on the system PATH, and git write credentials (SSH key or credentials helper) configured for the remote repository.

---

## 3. Integrating Debug MCP / Game Tools
To make the model even more effective, we can include the **Debug / Action Tools** (e.g. `spawn_incident`, `force_weather`, `trigger_mental_break`) in the training data. This teaches the model when it is appropriate to execute active debug interventions.

### Training Examples for Debug Tool Calls
If the storyteller wants to intervene directly rather than just setting multipliers:

```json
{
  "instruction": "You are the AI Storyteller. Review colony state. If critical intervention is needed, choose a tool to invoke.",
  "input": "Colony General Metrics:\n- Wealth: 45000 | Silver: 100 | Food: 12.0 points (Critical Starvation!)\n- Season: 10% growable (Winter)\n- Population: 3 colonists\n- Combat: 1 violent (0 armed) | Downed: 2 downed | Avg Mood: 18% (Extremely low mood!)\n\nRecent Events:\n- CropBlight (Failure)\n- HeatWave (Failure)",
  "output": "{\n  \"RequestTools\": [\"execute_game_tool\"],\n  \"Arguments\": {\n    \"tool_name\": \"spawn_incident\",\n    \"arguments_json\": \"{\\\"incidentDefName\\\": \\\"TraderCaravanArrival\\\", \\\"force\\\": true}\"\n  }\n}"
}
```

---

## 4. Local QLoRA Fine-Tuning Script (Unsloth)
Use the following Python script with **Unsloth** to fine-tune the model. Unsloth requires a local Linux environment (or Windows WSL2) with a CUDA-enabled GPU.

> [!NOTE]
> **Context Scaling**: Gemma 2 natively supports an **8192 (8K)** context window. The `max_seq_length` parameter in the script is fully adjustable. 
> * For budget GPUs during training, keep it at `2048` or `4096` to save VRAM.
> * If you have a high-end card (e.g. 16GB+ VRAM), set it to `8192` to train on the model's full native context window.
> * At *inference time* (in llama.cpp, LM Studio, etc.), you can load the compiled GGUF with any context length you need (2K, 4K, 8K, or higher via RoPE scaling). It is not capped by the training sequence limit.

```python
from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# Fully adjustable context window (2048, 4096, 8192, etc.). Set higher if you have more training VRAM.
max_seq_length = 8192 
dtype = None # Auto-detection (float16 for Tesla/Ampere/Ada)
load_in_4bit = True # Use 4bit quantization to save training VRAM

# 1. Load Gemma 4 E2B Instruct model (or "unsloth/gemma-4-e4b-it-bnb-4bit" for E4B)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/gemma-4-e2b-it-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. Add LoRA Adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# 3. Format dataset helper
prompt_format = """Below is an instruction that describes a storyteller task, paired with an input providing live RimWorld colony metrics. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

def format_prompts(batch):
    instructions = batch["instruction"]
    inputs       = batch["input"]
    outputs      = batch["output"]
    texts = []
    for instr, inp, out in zip(instructions, inputs, outputs):
        text = prompt_format.format(instr, inp, out) + tokenizer.eos_token
        texts.append(text)
    return { "text" : texts }

# Load your collected telemetry dataset
dataset = load_dataset("json", data_files="training_data.jsonl", split="train")
dataset = dataset.map(format_prompts, batched = True)

# 4. SFT Trainer configuration
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, # Can speed up training for short sequences
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 100, # Adjust based on dataset size
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        output_dir = "outputs",
    ),
)

# 5. Execute Training
trainer_stats = trainer.train()

# 6. Save LoRA adapters
model.save_pretrained_merged("gemma-4-e2b-rimworld-lora", tokenizer, save_method = "lora")
```

---

## 5. Exporting to GGUF
To load the model into your `Local-AI-Wrapper` or LM Studio:
1. Merge the LoRA weights to float16:
   ```python
   model.save_pretrained_merged("gemma-4-e2b-rimworld-f16", tokenizer, save_method = "merged_16bit")
   ```
2. Quantize the model using `llama.cpp`:
   ```bash
   python convert_hf_to_gguf.py gemma-4-e2b-rimworld-f16/ --outtype f16 --outfile gemma-4-e2b-rimworld.gguf
   # Run 5-bit quantization
   ./llama-quantize gemma-4-e2b-rimworld.gguf gemma-4-e2b-rimworld-Q5_K_M.gguf Q5_K_M
   ```

---

## 6. Model Integration
Add the compiled `.gguf` file to the `models/` directory managed by the `Local-AI-Wrapper`. The model-swapping tool will auto-detect the new storyteller model and boot it when RimWorld launches!
