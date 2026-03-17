# NWKStack

**NWKStack turns Claude Code into a quantitative trading research and deployment system.**

A general-purpose AI assistant blurs cognitive modes into mediocrity. When you're pressure-testing an investment thesis, you need maximally skeptical PM thinking. When you're designing the system, you need rigorous engineering. When you're reviewing for production, you need someone looking for every possible failure mode. The same brain cannot do all three simultaneously.

NWKStack gives you eleven specialized cognitive modes as slash commands — each one the right brain for its moment in the trading strategy lifecycle.

---

## The Problem

A trading strategy that looks good on paper and dies in live trading is not a strategy. It's expensive research.

The graveyard of failed strategies is full of systems that passed every backtest. They failed because:
- The backtest used data that wouldn't have been available at trade time (look-ahead bias)
- The strategy only worked in the 2009-2021 bull/low-vol regime (regime dependency)
- Transaction costs at any realistic scale destroyed the edge (cost blindness)
- The "alpha" was just momentum with extra steps (factor crowding)
- The data was survivorship-biased to begin with (survivorship bias)

NWKStack forces you through a systematic workflow designed to catch all of this before you commit live capital.

---

## The Skills

| Skill | Cognitive Mode | The Question It Answers |
|-------|---------------|------------------------|
| `/alpha-thesis` | Portfolio manager / skeptic | Is there a real, durable, capturable edge here? |
| `/system-design` | Quant systems architect | How do we actually build this, and where does it break? |
| `/strategy-review` | Adversarial quant validator | Where does this strategy fail in ways the backtest cannot see? |
| `/backtest-qa` | Backtest integrity auditor | Do these backtest results accurately represent what would have happened? |
| `/risk-audit` | Risk manager | Under what conditions does this strategy cause serious harm? |
| `/paper-to-poc` | Research engineer | What does this paper actually claim, and is it credible? |
| `/regime-analysis` | Market structure analyst | What market regime are we in, and which strategies should run? |
| `/deploy` | Live trading release engineer | Is this strategy ready for live capital? |
| `/performance-retro` | Risk/performance analyst | What actually happened, why, and what do we change? |
| `/strategy-doc` | Quant technical writer | Does the documentation accurately reflect what this strategy is? |
| `/data-connect` | Data infrastructure engineer | Are our data connections live, valid, and consistent? |

---

## The Workflow: One Strategy, End to End

```
You:    I read a paper on cross-sectional momentum with earnings
        surprise as a secondary sort. Replication looks feasible.

You:    /paper-to-poc [paper.pdf]

Claude: Core hypothesis: stocks with positive earnings surprises in
        the top momentum decile outperform by 8.4% annually...
        Credibility assessment: SHORT SAMPLE (8 years), NO OOS TEST,
        COSTS NOT REPORTED. Expected replication: 40-60% Sharpe haircut.
        Generated: backtest scaffold with walk-forward split.

You:    /alpha-thesis

Claude: "Momentum + earnings surprise" is not an edge — it's an
        overcrowded factor combo. The real question: does the earnings
        surprise signal add information *after* controlling for PEAD?
        And if so, in what liquidity tier? VERDICT: PIVOT. Here's the
        stronger version of the hypothesis...

You:    /system-design

Claude: [Signal pipeline diagram, data dependencies, execution model,
        rebalance frequency, portfolio construction, risk controls,
        state machine: RESEARCHING → BACKTESTING → PAPER_TRADING → LIVE]

You:    [implements the system]

You:    /strategy-review

Claude: [FATAL-001] Look-ahead bias: earnings date alignment uses
        report_date, not announce_date — looking 1 day into the future
        on 23% of observations.
        [HIGH-001] Transaction costs: ignoring market impact on the
        small-cap tail. The Sharpe looks good because 80% of returns
        came from the 2009-2021 momentum regime.

You:    [fixes the issues]

You:    /backtest-qa

Claude: Walk-forward validation: In-sample Sharpe: 1.42.
        Out-of-sample (held-out 20%): 0.71. Sharpe decay: 50%.
        Cost sensitivity: at 10bps, Sharpe: 0.91. At 20bps: 0.64.
        Health score: 74/100. PROCEED WITH CAUTION — list of open risks.

You:    /risk-audit

Claude: Max drawdown: -23.4% (March 2020). Recovery: 8 months.
        Factor exposure: 0.72 correlation with HML. Not orthogonal.
        Capacity estimate: $12M before 25bps impact.
        Regime dependency: 80% of returns in trending regimes.
        RISK SCORECARD: YELLOW — 2 limits borderline.

You:    /deploy

Claude: Pre-deployment checklist: all FATAL/HIGH findings resolved ✓
        backtest-qa score 74/100 — BELOW 80 THRESHOLD. BLOCKED.
        Recommendation: re-run backtest-qa after addressing open risks.

You:    [addresses open risks, backtest-qa score: 82/100]

You:    /deploy

Claude: All checks passed. Position sizing proposal: $500K (5% of portfolio).
        Monitoring configured: circuit breaker at -8%, signal staleness 24h.
        Deployment record written. PR created. LIVE.

[3 weeks later]

You:    /performance-retro

Claude: Week 3 live: +0.4%. Expected: +0.6%. Tracking error: -0.2%.
        Cause: small-cap fills averaging 14bps worse than modeled.
        Signal health: normal. Recommendation: CONTINUE — REDUCE small-cap tail.
```

---

## Who This Is For

Anyone using Claude Code to research, build, and run trading systems:
- Quant researchers replicating academic papers
- Portfolio managers building systematic strategies
- Developers building algorithmic trading infrastructure
- Risk managers reviewing existing strategies

NWKStack is not a trading system. It is a methodology and a set of cognitive tools for building and validating trading systems. You bring the data, the broker, and the capital. NWKStack brings the rigor.

---

## Install

```bash
# Install to Claude Code's skills directory
git clone https://github.com/yourusername/nwkstack.git ~/.claude/skills/nwkstack
cd ~/.claude/skills/nwkstack
./setup
```

**Requirements:**
- [Bun](https://bun.sh/) (≥1.0.0): `curl -fsSL https://bun.sh/install | bash`
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

**Verify install:**
```
/alpha-thesis
```

---

## The Canonical Workflow

Always run skills in this order. Do not skip steps.

```
/paper-to-poc → /alpha-thesis → /system-design → [implement] →
/strategy-review → /backtest-qa → /risk-audit → /deploy →
/performance-retro (weekly)
```

At the end, you have either:
- A deployed paper trading strategy with documented risk limits and monitoring, or
- A clear, evidence-based reason why the strategy was killed before wasting live capital

That outcome — confident deployment or evidence-based rejection — is the product.

---

## Strategy Documentation

Every strategy gets a directory at `strategies/[name]/` with:

```
strategies/my-strategy/
├── README.md         # What it is, current status, quick start
├── THESIS.md         # Investment thesis and alpha source
├── IMPLEMENTATION.md # Signal, universe, portfolio construction, execution
├── RISK.md           # Risk profile, limits, circuit breakers
├── DEPLOYMENT.md     # Deployment history and live performance
├── DATA.md           # Data sources, lineage, quality issues
└── CHANGELOG.md      # Strategy changes over time
```

Use `/strategy-doc` to keep these current. An undocumented strategy is a strategy you cannot safely delegate.

---

## Development

See [CLAUDE.md](CLAUDE.md) for the development guide.

```bash
bun test             # run static skill validation (free, <5s)
bun run gen:skill-docs  # regenerate SKILL.md files from templates
bun run skill:check  # health dashboard
```

---

*NWKStack — v1.0.0 — 2026-03-17*
