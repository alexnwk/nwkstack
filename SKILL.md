---
name: nwkstack
version: 1.0.0
description: |
  NWKStack: quantitative trading strategy toolkit for Claude Code. Eleven specialized
  cognitive modes covering the full strategy lifecycle — from thesis validation to live
  deployment. Use the specific skill for your current phase: /alpha-thesis, /system-design,
  /strategy-review, /backtest-qa, /risk-audit, /paper-to-poc, /regime-analysis,
  /deploy, /performance-retro, /strategy-doc, /data-connect.
allowed-tools:
  - Read
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

## Preamble (run first)

```bash
mkdir -p ~/.nwkstack/sessions
touch ~/.nwkstack/sessions/"$PPID"
_SESSIONS=$(find ~/.nwkstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.nwkstack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH | SESSIONS: $_SESSIONS"
```

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the strategy/project, the current branch (use the `_BRANCH` value printed by the preamble), and the current task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English. No raw variable names or internal jargon. Use concrete examples. Say what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]`
4. **Options:** Lettered options: `A) ... B) ... C) ...`

Assume the user hasn't looked at this window in 20 minutes. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.

# NWKStack

NWKStack provides eleven specialized Claude Code skills for quantitative trading strategy research, validation, and deployment.

## Available Skills

Use the right skill for your current phase. Each skill invokes a different cognitive mode.

| Skill | When to Use |
|-------|------------|
| `/paper-to-poc` | You have an academic paper and want to evaluate it and build a prototype |
| `/alpha-thesis` | You have a strategy idea and want it pressure-tested by a skeptical PM |
| `/system-design` | Your thesis passed — now design the full technical architecture |
| `/strategy-review` | Your implementation is done — adversarial review before backtesting |
| `/backtest-qa` | Audit backtest implementation and validate results with walk-forward |
| `/risk-audit` | Standalone risk assessment: drawdowns, factor exposure, capacity |
| `/regime-analysis` | Classify current market regime and align portfolio accordingly |
| `/deploy` | Deploy to live trading with full pre-deployment checklist |
| `/performance-retro` | Weekly live performance review and CONTINUE/REDUCE/SUSPEND decision |
| `/strategy-doc` | Update strategy documentation to match current implementation |
| `/data-connect` | Audit data connections, validate quality, document lineage |

## The Canonical Workflow

```
/paper-to-poc → /alpha-thesis → /system-design → [implement] →
/strategy-review → /backtest-qa → /risk-audit → /deploy →
/performance-retro (weekly)
```

Run skills in order. Do not skip steps. Each step is a gate that protects you from deploying a strategy that will fail.

## Strategy Documentation

Every strategy lives at `strategies/[name]/` with: README.md, THESIS.md, IMPLEMENTATION.md, RISK.md, DEPLOYMENT.md, DATA.md, CHANGELOG.md.

Use `/strategy-doc` to keep documentation current.

## If you're not sure which skill to use

Describe what you're working on and I'll tell you which skill is appropriate for this moment in the workflow.
