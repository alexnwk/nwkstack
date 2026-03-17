# NWKStack Development

## Commands

```bash
bun install          # install dependencies
bun test             # run free tests (static skill validation, <5s)
bun run test:evals   # run paid evals: LLM judge + E2E (~$4/run)
bun run test:e2e     # run E2E tests only (~$3.85/run)
bun run build        # gen docs (alias for gen:skill-docs)
bun run gen:skill-docs  # regenerate SKILL.md files from templates
bun run skill:check  # health dashboard for all skills
bun run dev:skill    # watch mode: auto-regen + validate on change
bun run eval:list    # list all eval runs from ~/.nwkstack-dev/evals/
bun run eval:compare # compare two eval runs (auto-picks most recent)
bun run eval:summary # aggregate stats across all eval runs
```

`test:evals` requires `ANTHROPIC_API_KEY`.

## Project Structure

```
nwkstack/
├── alpha-thesis/        # /alpha-thesis skill
├── system-design/       # /system-design skill
├── strategy-review/     # /strategy-review skill
├── backtest-qa/         # /backtest-qa skill
├── risk-audit/          # /risk-audit skill
├── paper-to-poc/        # /paper-to-poc skill
├── regime-analysis/     # /regime-analysis skill
├── deploy/              # /deploy skill
├── performance-retro/   # /performance-retro skill
├── strategy-doc/        # /strategy-doc skill
├── data-connect/        # /data-connect skill
├── strategies/          # Per-strategy documentation
│   └── [strategy-name]/
│       ├── README.md, THESIS.md, IMPLEMENTATION.md
│       ├── RISK.md, DEPLOYMENT.md, DATA.md, CHANGELOG.md
├── scripts/             # Build + DX tooling
├── test/                # Skill validation tests
│   ├── helpers/
│   ├── fixtures/
│   └── skill-validation.test.ts
├── .context/
│   └── retros/          # Performance retro JSON snapshots
├── bin/                 # CLI utilities
├── setup                # One-time setup: generate docs + symlink skills
├── NWKSTACK.md          # Transformation specification
├── README.md            # User-facing documentation
├── CLAUDE.md            # This file
└── package.json
```

## Available Skills

| Skill | Cognitive Mode | Purpose |
|-------|---------------|---------|
| `/alpha-thesis` | Portfolio manager / skeptic | Is this edge real? |
| `/system-design` | Quant systems architect | How do we build this? |
| `/strategy-review` | Adversarial quant validator | Where does this blow up? |
| `/backtest-qa` | Backtest integrity auditor | Are the numbers real? |
| `/risk-audit` | Risk manager | What are we actually risking? |
| `/paper-to-poc` | Research engineer | Paper → implementation spec |
| `/regime-analysis` | Market structure analyst | What regime are we in? |
| `/deploy` | Live trading release engineer | Is it production-safe? |
| `/performance-retro` | Risk/performance analyst | What happened and why? |
| `/strategy-doc` | Quant technical writer | Is the documentation accurate? |
| `/data-connect` | Data infrastructure engineer | Are our feeds live and clean? |

## SKILL.md Workflow

SKILL.md files are **generated** from `.tmpl` templates. To update docs:

1. Edit the `.tmpl` file in the skill directory (e.g., `alpha-thesis/SKILL.md.tmpl`)
2. Run `bun run gen:skill-docs`
3. Commit both the `.tmpl` and generated `.md` files

## Writing SKILL Templates

SKILL.md.tmpl files are **prompt templates read by Claude**, not bash scripts.

Rules:
- **Use natural language for logic and state.** Don't use shell variables to pass
  state between code blocks. Instead, tell Claude what to remember and reference
  it in prose.
- **Don't hardcode branch names.** Detect `main`/`master`/etc dynamically.
  Use `{{BASE_BRANCH_DETECT}}` for PR-targeting skills.
- **Keep bash blocks self-contained.** Each code block should work independently.
- **Express conditionals as English.** Write numbered decision steps, not nested bash.

## No Browser Tools

**Never use `mcp__claude-in-chrome__*` tools.** NWKStack has no browser component.

## Strategy Documentation Standard

When working on any strategy, always check for a `strategies/[name]/` directory and keep it current. The canonical documentation set per strategy:

- `README.md` — what, who, what it trades, current status
- `THESIS.md` — investment thesis, alpha source, why it works
- `IMPLEMENTATION.md` — technical implementation
- `RISK.md` — risk profile, limits, circuit breakers
- `DEPLOYMENT.md` — deployment history and live status
- `DATA.md` — data sources, lineage, quality issues
- `CHANGELOG.md` — strategy changes over time

## Quant-Specific Coding Conventions

When writing or reviewing backtest code:

- **Always use expanding-window or rolling statistics** in signal code, never full-sample
- **Always sort by date ascending** before any rolling computation
- **Always validate that backtest universe is point-in-time** before running
- **Never use `.ffill()` across earnings dates** without explicit justification
- **Never use `.bfill()` or `.interpolate()`** in return or signal series — both introduce look-ahead
- **Always use `.shift(1)`** (positive shift) to access "yesterday's" data; `.shift(-1)` is look-ahead
- **Document date alignment explicitly**: signal_date, trade_date, and settlement_date are different
- **Include units in variable names**: `ret_daily`, `vol_annual`, `sharpe_monthly`

## Performance Retro Snapshots

Performance retro JSON snapshots are saved to `.context/retros/[strategy-name]/[date].json`.
Do not delete these files — they are used for trend analysis in `/performance-retro compare`.

## Vendored Symlink Awareness

When developing nwkstack, `.claude/skills/nwkstack` may be a symlink back to this
working directory (gitignored). This means skill changes are **live immediately** —
great for rapid iteration, risky during big refactors.

**Check once per session:** Run `ls -la .claude/skills/nwkstack` to see if it's a
symlink or a real copy.

## CHANGELOG Style

CHANGELOG.md is **for users**, not contributors. Write it like product release notes:
- Lead with what the user can now **do** that they couldn't before
- Use plain language: "You can now..." not "Refactored the..."
- Every entry should make someone think "oh nice, I want to try that"

## Deploying to the Active Skill

After making changes:

1. Push your branch
2. Fetch and reset in the skill directory:
   `cd ~/.claude/skills/nwkstack && git fetch origin && git reset --hard origin/main`
3. Rebuild: `bun run gen:skill-docs`
