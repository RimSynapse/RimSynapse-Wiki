# Gemma 2 2B Fine-Tuning Guide for RimWorld AI Storyteller (RimSynapse MCP)

This guide provides a comprehensive walkthrough for training and fine-tuning **Gemma 2 2B** (specifically `gemma-2-2b-it`) to act as a highly efficient, lightweight, and local AI Storyteller and command coordinator for RimSynapse.

---

## 1. Why Gemma 2 2B?
* **Sub-2GB Quantization footprint**: Fits comfortably in VRAM (or even runs purely on CPU) during heavy gameplay.
* **Blistering Inference Speed**: 60+ tokens/second on consumer-grade GPUs (RTX 3060/4060).
* **Logical Consistency**: High performance on structured JSON output and context parsing, rivaling larger 7B/8B models.

---

## 2. Telemetry and Dataset Collection
To train the model, we need to collect input-output pairs from actual game ticks. The mod can write this data to a local `training_data.jsonl` file.

### Data Format (ShareGPT / Alpaca JSONL)
Each line represents a training sample in instruction format:

```json
{
  "instruction": "You are the AI Storyteller Coordinator. Evaluate the colony metrics and choose the pacing adjustments or request diagnostic/debug tools.",
  "input": "Colony General Metrics:\n- Wealth: 120000 | Silver: 1500 | Food: 320.5 points\n- Season: 67% growable\n- Population: 5 colonists (Local Density: 80)\n- Livestock: 12 tamed animals\n- Combat: 4 violent (3 armed) | Downed: 1 downed | Avg Mood: 72%\n\nRecent Events:\n- HostileRaid(Empire) (Success)\n- PawnJoin(Wanderer) (Success)",
  "output": "{\n  \"PacingMultiplier\": 1.25,\n  \"CategoryMultipliers\": {\n    \"ThreatBig\": 1.1,\n    \"ThreatSmall\": 1.0,\n    \"Misc\": 1.0,\n    \"DiseaseHuman\": 0.9,\n    \"FactionArrival\": 1.2\n  }\n}"
}
```

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

```python
from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

max_seq_length = 2048 # Keep aligned with our 2048 token budget
dtype = None # Auto-detection (float16 for Tesla/Ampere/Ada)
load_in_4bit = True # Use 4bit quantization to save training VRAM

# 1. Load Gemma 2 2B Instruct model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/gemma-2-2b-it-bnb-4bit",
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
model.save_pretrained_merged("gemma-2-2b-rimworld-lora", tokenizer, save_method = "lora")
```

---

## 5. Exporting to GGUF
To load the model into your `Local-AI-Wrapper` or LM Studio:
1. Merge the LoRA weights to float16:
   ```python
   model.save_pretrained_merged("gemma-2-2b-rimworld-f16", tokenizer, save_method = "merged_16bit")
   ```
2. Quantize the model using `llama.cpp`:
   ```bash
   python convert_hf_to_gguf.py gemma-2-2b-rimworld-f16/ --outtype f16 --outfile gemma-2-2b-rimworld.gguf
   # Run 5-bit quantization
   ./llama-quantize gemma-2-2b-rimworld.gguf gemma-2-2b-rimworld-Q5_K_M.gguf Q5_K_M
   ```

---

## 6. Model Integration
Add the compiled `.gguf` file to the `models/` directory managed by the `Local-AI-Wrapper`. The model-swapping tool will auto-detect the new storyteller model and boot it when RimWorld launches!
