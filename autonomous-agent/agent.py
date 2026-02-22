#!/usr/bin/env python3
"""
Autonomous Agent - ReAct loop s Groq API
Použití: py -3.12 agent.py -p "task description"
"""

import argparse
import json
import os
import sys
import subprocess
from pathlib import Path


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def load_config() -> dict:
    config_path = Path(__file__).parent / "config.json"
    if config_path.exists():
        with open(config_path, encoding="utf-8") as f:
            cfg = json.load(f)
    else:
        cfg = {}
    cfg["api_key"] = os.environ.get("GROQ_API_KEY", cfg.get("api_key", ""))
    return cfg


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

def tool_bash(command: str, safe_mode: bool = True) -> str:
    """Spustí shell příkaz a vrátí výstup."""
    DANGEROUS = ["rm -rf", "rmdir /s", "format ", "del /f", "DROP TABLE", ":(){"]
    if safe_mode:
        for danger in DANGEROUS:
            if danger.lower() in command.lower():
                return f"[BLOCKED] Nebezpečný příkaz: {danger}"
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=30,
            encoding="utf-8", errors="replace"
        )
        output = result.stdout.strip()
        if result.returncode != 0 and result.stderr:
            output += f"\n[stderr] {result.stderr.strip()}"
        return output[:2000] if output else "(žádný výstup)"
    except subprocess.TimeoutExpired:
        return "[TIMEOUT] Příkaz trval příliš dlouho (>30s)"
    except Exception as e:
        return f"[ERROR] {e}"


def tool_file_read(path: str) -> str:
    """Přečte obsah souboru."""
    try:
        p = Path(path)
        if not p.exists():
            return f"[ERROR] Soubor neexistuje: {path}"
        content = p.read_text(encoding="utf-8", errors="replace")
        return content[:3000] if len(content) > 3000 else content
    except Exception as e:
        return f"[ERROR] {e}"


def tool_file_write(path: str, content: str) -> str:
    """Zapíše nebo přepíše soubor."""
    try:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return f"[OK] Soubor uložen: {path} ({len(content)} znaků)"
    except Exception as e:
        return f"[ERROR] {e}"


def tool_web_search(query: str) -> str:
    """DuckDuckGo search - bez API klíče."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
        if not results:
            return "Žádné výsledky."
        lines = []
        for r in results:
            lines.append(f"• {r['title']}\n  {r['body'][:200]}\n  URL: {r['href']}")
        return "\n\n".join(lines)
    except Exception as e:
        return f"[ERROR] Web search selhal: {e}"


TOOLS = {
    "bash": tool_bash,
    "file_read": tool_file_read,
    "file_write": tool_file_write,
    "web_search": tool_web_search,
}

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": "Spustí shell příkaz a vrátí stdout/stderr výstup.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell příkaz k spuštění"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "file_read",
            "description": "Přečte obsah souboru.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Cesta k souboru"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "file_write",
            "description": "Zapíše nebo přepíše soubor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Cesta k souboru"},
                    "content": {"type": "string", "description": "Obsah souboru"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Hledá informace na webu přes DuckDuckGo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Vyhledávací dotaz"}
                },
                "required": ["query"]
            }
        }
    },
]


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Jsi autonomní AI agent. Dostaneš task a musíš ho splnit krok po kroku pomocí nástrojů.

Pravidla:
1. Nejdřív napiš krátký plán (max 3-5 kroků) ve formátu: [PLAN] krok1, krok2, krok3
2. Pak prováděj kroky pomocí tool calls
3. Každý krok oznám: [STEP X/N] co děláš
4. Po tool callu okomentuj výsledek
5. Na konci napiš [DONE] shrnutí

Buď stručný a efektivní. Nepoužívej více kroků než nutné."""


# ---------------------------------------------------------------------------
# Agent loop
# ---------------------------------------------------------------------------

def emit(line: str) -> None:
    """Vypíše řádek a okamžitě flushuje (pro streaming do AgentHubu)."""
    print(line, flush=True)


def run_agent(task: str, config: dict) -> None:
    from groq import Groq

    api_key = config.get("api_key", "")
    if not api_key:
        emit("[ERROR] Chybí GROQ_API_KEY. Nastav environment variable nebo config.json.")
        sys.exit(1)

    client = Groq(api_key=api_key)
    model = config.get("model", "llama-3.3-70b-versatile")
    max_steps = int(config.get("max_steps", 10))
    safe_mode = bool(config.get("safe_mode", True))

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": task},
    ]

    emit(f"[INFO] Model: {model} | Max kroků: {max_steps}")
    emit(f"[TASK] {task}")

    for _step in range(max_steps):
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=TOOLS_SCHEMA,
            tool_choice="auto",
            max_tokens=1024,
        )

        msg = response.choices[0].message

        if msg.content:
            for line in msg.content.strip().split("\n"):
                if line.strip():
                    emit(line)

        if msg.content and "[DONE]" in msg.content:
            break

        if not msg.tool_calls:
            break

        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in msg.tool_calls
            ],
        })

        for tc in msg.tool_calls:
            fn_name = tc.function.name
            try:
                fn_args = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                fn_args = {}

            args_preview = ", ".join(
                f"{k}={repr(v)[:50]}" for k, v in fn_args.items()
            )
            emit(f"[TOOL] {fn_name}({args_preview})")

            if fn_name == "bash":
                result = tool_bash(fn_args.get("command", ""), safe_mode)
            elif fn_name in TOOLS:
                result = TOOLS[fn_name](**fn_args)
            else:
                result = f"[ERROR] Neznámý nástroj: {fn_name}"

            emit(f"[RESULT] {result[:300]}")

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })
    else:
        emit("[INFO] Dosažen maximální počet kroků.")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Autonomous Agent")
    parser.add_argument("-p", "--prompt", required=True, help="Task pro agenta")
    args = parser.parse_args()

    config = load_config()
    run_agent(args.prompt, config)


if __name__ == "__main__":
    main()
