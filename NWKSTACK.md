# NWKSTACK: Transformation Document

**From Gstack (software development toolkit) → NWKStack (quantitative trading system toolkit)**

This document is the complete specification for the transformation. It is written for the engineering team executing the work, not for end users. Read it top to bottom before touching a single file.

---

## Why This Transformation Exists

Gstack's core insight is correct and worth preserving: a general-purpose assistant blurs cognitive modes into mediocrity. The unlock is explicit gears — tell the agent what kind of brain to use right now.

In software development, those gears are: founder taste, engineering rigor, paranoid review, release execution.

In quantitative trading, the gears are different: **alpha generation** (is this edge real?), **system architecture** (how do we capture it reliably?), **adversarial validation** (where does this blow up?), **risk governance** (how much can we lose?), and **live deployment** (is it production-safe?). Each requires a radically different posture. Conflating them produces strategies that look good on paper and die in live trading.

NWKStack gives those gears to anyone building trading systems with Claude Code.

---

## What We Are Building On

The following Gstack infrastructure is **sound and carries over directly**:

- The skill system (Markdown prompt files with YAML frontmatter, registered as slash commands)
- The template pipeline (`SKILL.md.tmpl` → `SKILL.md` via `bun run gen:skill-docs`)
- The session tracking and preamble pattern
- The test tiers (static validation, E2E, LLM-as-judge)
- The `retro` snapshot pattern (JSON persistence for trend tracking)
- The `ship` / release hygiene concept (adapted for strategy deployment)

---

## What Gets Removed

No partial deletions. Remove these completely:

| Component | Reason |
|-----------|---------|
| `browse/` | Browser automation has no role in quant workflows |
| `qa/` | UI QA is irrelevant; replaced by `backtest-qa` |
| `qa-only/` | Replaced by `backtest-report` |
| `qa-design-review/` | Design concerns are not our domain |
| `plan-design-review/` | Same |
| `design-consultation/` | Same |
| `setup-browser-cookies/` | Browser session management not needed |
| `BROWSER.md` | Browser documentation not needed |

Update `README.md`, `CLAUDE.md`, and `setup` accordingly. Remove all symlinks pointing to deleted skills.

---

## Skill Transformation Map

| Old Gstack Skill | New NWKStack Skill | Cognitive Mode |
|------------------|--------------------|----------------|
| `/plan-ceo-review` | `/alpha-thesis` | Portfolio manager / skeptic |
| `/plan-eng-review` | `/system-design` | Quant systems architect |
| `/review` | `/strategy-review` | Adversarial quant validator |
| `/ship` | `/deploy` | Live trading release engineer |
| `/qa` + `/qa-only` | `/backtest-qa` | Backtest integrity auditor |
| `/retro` | `/performance-retro` | Risk/performance analyst |
| `/document-release` | `/strategy-doc` | Quant technical writer |
| *(new)* | `/paper-to-poc` | Research engineer |
| *(new)* | `/risk-audit` | Risk manager |
| *(new)* | `/regime-analysis` | Market structure analyst |
| *(new)* | `/data-connect` | Data infrastructure engineer |

---

## The Workflow: One Strategy, End to End

This is the canonical NWKStack workflow. Every skill's design should make sense within this flow.

```
You:   [enter plan mode, describe the opportunity]
       I read a paper on cross-sectional momentum with earnings
       surprise as a secondary sort. Replication looks feasible.

You:   /alpha-thesis

Claude: "Momentum + earnings" is not an edge — it's an overcrowded factor
        combo. The real question: does the earnings surprise signal add
        information *after* controlling for the post-earnings drift (PEAD)?
        And if so, in what liquidity tier? Let's separate the alpha source
        from the implementation vehicle. Here's what we need to validate...

You:   /system-design

Claude: [Signal pipeline diagram, data dependencies, execution model,
        rebalance frequency, position construction, risk constraints,
        latency requirements, failure modes]

You:   [exit plan mode, implement the system]

You:   /strategy-review

Claude: Look-ahead bias: the earnings date alignment uses report_date, not
        announce_date — you're looking one day into the future on 23% of
        observations. Transaction costs: you're ignoring market impact on
        the small-cap tail. The Sharpe looks good because the strategy
        implicitly times the 2020-2021 momentum regime.

You:   (fix the issues)

You:   /backtest-qa

Claude: Running walk-forward validation...
        In-sample Sharpe: 1.42. Out-of-sample (held-out 20%): 0.71.
        Sharpe decay suggests moderate overfitting. Identified 3 data
        quality events (survivorship gaps 2008-2009). Transaction cost
        sensitivity: at 5bps, Sharpe drops to 0.61. At 10bps: 0.38.

You:   /risk-audit

Claude: Max drawdown: -23.4% (March 2020). Recovery: 8 months.
        Tail risk: 99th percentile monthly loss: -8.2%.
        Factor exposure: 0.72 correlation with HML. Not orthogonal.
        Capacity estimate: $12M before 25bps slippage impact.
        Regime dependency: 80% of returns came from trending regimes.

You:   /deploy

Claude: [Validates paper-to-live checklist, confirms data feeds are live,
        runs position sizing checks, creates monitoring hooks, creates PR]

You:   /performance-retro

Claude: Week 3 live: +0.4%. Expected: +0.6%. Tracking error source:
        small-cap fills averaging 12bps worse than assumed. Signal
        decay faster than backtest suggests in current low-vol regime.
        Recommend: widen universe filter to mid-cap to improve fill quality.
```

---

## Skill Specifications

Each section below is the complete brief for one skill. The implementing engineer writes the SKILL.md.tmpl from this spec.

---

### `/alpha-thesis`

**Replaces:** `/plan-ceo-review`
**Cognitive mode:** Experienced portfolio manager who has seen a thousand strategies fail in the exact way you're proposing

**Core question the skill asks:** Is there a real, durable, capturable edge here — or are we pattern-matching noise and calling it alpha?

**What this skill does:**

1. Reads the conversation context: the strategy idea, the paper being replicated, or the existing system being modified.
2. Identifies what the *stated* edge is.
3. Pressure-tests whether the edge is real using the following framework:
   - **Source of alpha:** Who is on the other side of this trade, and why are they wrong? If you cannot name a structural reason why this works (risk premium, behavioral bias, market microstructure, information asymmetry), it is not an edge — it is data mining.
   - **Durability:** Is this edge arbitrageable? If published, when does it decay? What would cause it to stop working?
   - **Orthogonality:** Is this actually a new edge, or is it a lever of momentum, value, or carry you're already exposed to? Run the mental factor decomposition.
   - **Capacity:** Does this work at the scale you intend to trade it? A 50bps Sharpe micro-cap strategy that breaks at $2M is not a trading system — it is a toy.
   - **Implementability:** What does execution actually look like? Data requirements, rebalance frequency, turnover, realistic transaction costs.

4. Returns one of three verdicts with full reasoning:
   - **PURSUE:** Edge is credible. Here is the cleanest version of the hypothesis to test.
   - **PIVOT:** The stated strategy is weak but there is a better version inside it. Here is what that version is.
   - **KILL:** The edge is not real, is already arbed away, or is not capturable at this scale. Here is why.

**What this skill does NOT do:** It does not implement anything. It does not suggest code. It does not write backtests. This is pure intellectual pressure-testing of the investment thesis.

**Three modes (follow Gstack's three-mode pattern):**

- **STRESS TEST** (default): Maximally skeptical. Find every reason this fails. Earn the right to proceed.
- **BUILD BEST CASE**: Given this idea, what is the strongest possible version of the hypothesis? Used when the user wants to explore scope, not challenge it.
- **FEASIBILITY FOCUS**: Strip the idea to its minimum viable test. What is the smallest, fastest experiment that would confirm or deny the core hypothesis?

---

### `/system-design`

**Replaces:** `/plan-eng-review`
**Cognitive mode:** Senior quant systems architect — someone who has built both the research infrastructure and the live trading stack

**Core question:** How do we actually build this, and where does it break?

**What this skill does:**

After `/alpha-thesis` confirms the thesis is worth pursuing, `/system-design` builds the technical spine.

It must produce, in order:

1. **Data pipeline diagram** — what data is required, at what frequency, from which sources, with what latency. Include the data availability timeline (do we have historical data going back far enough? Is there survivorship bias in the historical dataset?).

2. **Signal construction spec** — exact mathematical definition of the signal, including all intermediate calculations. Ambiguity here is where look-ahead bias hides.

3. **Universe definition** — what securities are eligible, and what are the inclusion/exclusion rules. Flag survivorship bias risk explicitly if the universe is constructed at backtest time rather than point-in-time.

4. **Portfolio construction rules** — weighting scheme (equal weight, volatility-scaled, optimized), position limits, sector/factor constraints, gross/net exposure limits.

5. **Rebalance mechanics** — frequency, triggers (calendar vs. signal threshold), handling of corporate actions, how positions are closed when securities leave the universe.

6. **Execution model** — market orders vs. limit orders, VWAP participation, handling of illiquid names, estimated slippage model, borrow costs if short.

7. **Risk controls** — stop-loss rules, drawdown circuit breakers, position size caps, correlation limits, emergency liquidation protocol.

8. **State machine for the full lifecycle** — RESEARCHING → BACKTESTING → PAPER_TRADING → LIVE → SUSPENDED → RETIRED. What triggers each transition? What are the exit criteria from PAPER_TRADING before going LIVE?

9. **Failure mode inventory** — data feed down, stale prices, broker API timeout, corporate action missed, signal NaN on rebalance day. What does the system do in each case?

10. **Test matrix** — what tests would prove this implementation is correct? Include edge cases: zero-volume days, halted securities, negative prices (commodity roll), duplicate ticks.

Diagrams must be in Mermaid or ASCII. Force the diagram — it surfaces hidden assumptions.

---

### `/strategy-review`

**Replaces:** `/review` (paranoid staff engineer)
**Cognitive mode:** Adversarial quant — someone whose job is to find the thing that will blow up in live trading

**Core question:** Where does this strategy fail in ways the backtest cannot see?

This is the most important skill in the stack. The whole point is to find what passes backtesting and still dies in production.

**The adversarial checklist — the skill must work through every item:**

**Look-ahead bias (the silent killer)**
- Is any signal variable computed using data that would not have been available at the time of the trade decision?
- Are dates aligned correctly — trade date vs. announce date vs. report date vs. effective date?
- Does the universe filter use point-in-time membership data, or data as-of-today?
- Do any joins or merges introduce future information via key misalignment?
- Are financial statement fields from the actual filing date, or retroactively restated values?

**Survivorship bias**
- Was the backtest universe restricted to securities that exist today?
- Does the historical dataset include delisted, bankrupt, and acquired companies?
- If screening on fundamentals, does the screen use point-in-time fundamentals or today's fundamentals applied retroactively?

**Overfitting and data mining**
- How many parameters does this model have? How many independent data points are in the training window?
- Was the model specification chosen after seeing the backtest results? (If yes: overfitting by construction.)
- Are there implicit parameters? (Lookback window, rebalance frequency, universe filter thresholds all count.)
- Does the strategy work on a held-out period the researcher has not seen?
- Has this strategy been tested on multiple markets/regions, or only the one where it was discovered?

**Transaction cost blindness**
- Does the backtest model realistic bid-ask spreads (not just midpoint)?
- Is market impact modeled? (A strategy that trades 15% of average daily volume is not price-taking.)
- Does turnover account for borrow costs on short positions?
- Are there hidden rebalance costs from corporate actions, index reconstitution?

**Regime dependency (the strategy that worked until it didn't)**
- What fraction of returns were generated in which market regime? (Trending, mean-reverting, high-vol, low-vol, crisis)
- Does the strategy survive 2008-2009? 2020 March? 2022 rates shock? These are not optional stress tests.
- What is the correlation of strategy returns to the broad market in drawdown periods? (Strategies that hedge in calm markets and blow up in crises are not hedges.)

**Factor crowding**
- What is the correlation of this strategy's returns to known factors (momentum, value, quality, low-vol, carry)?
- Is there a known crowding risk in this factor (e.g., factor momentum is serially correlated with crowding/unwind events)?

**Capacity and execution**
- At what AUM does slippage erode the Sharpe to below 0.5?
- Can positions actually be entered and exited in the required timeframe given typical liquidity?
- What happens to the strategy if 10 other managers are running the same model?

**Model risk**
- Does the strategy depend on a model (ML, regression, etc.) whose parameters will drift over time?
- What is the retraining protocol? Can it create a structural break if the model is retrained mid-live?

The skill delivers findings with severity ratings: **FATAL** (invalidates the strategy), **HIGH** (must fix before live), **MEDIUM** (fix before scaling), **LOW** (monitor in production).

---

### `/backtest-qa`

**Replaces:** `/qa` and `/qa-only`
**Cognitive mode:** Backtest integrity auditor — independent verification that the numbers are real

**Core question:** Do these backtest results accurately represent what would have happened?

This skill verifies the implementation, not the hypothesis. `/strategy-review` finds structural flaws in the design. `/backtest-qa` finds implementation bugs.

**What this skill does:**

1. **Code audit** — reads the backtest code looking for:
   - DataFrame operations that silently introduce look-ahead (`.shift()` direction, `.rolling()` with `min_periods`, `groupby().transform()` that leaks future group statistics)
   - Index misalignments in time-series joins
   - NaN handling that biases results (dropping NaN rows vs. forward-filling has a return impact)
   - Vectorized operations that imply simultaneous knowledge (computing z-scores across the entire panel vs. expanding-window z-scores)

2. **Walk-forward validation** — runs the strategy on:
   - In-sample period (what was used to develop the strategy)
   - Out-of-sample hold-out (must be a contiguous period, not random dates)
   - Multiple expanding windows
   - Compares Sharpe, drawdown, and turnover across periods. A 40%+ decay in Sharpe from in-sample to out-of-sample is a red flag.

3. **Transaction cost sensitivity analysis** — sweeps cost assumptions:
   - 0bps, 2bps, 5bps, 10bps, 20bps, 50bps
   - Reports the breakeven cost at which the strategy becomes unprofitable
   - Reports the cost at which Sharpe drops below 0.5 (the practical threshold for most institutional mandates)

4. **Data quality checks**:
   - Missing data frequency by date and security
   - Price gaps (suspicious jumps that may indicate data errors)
   - Volume zeros (untradeable days that the backtest may have traded through)
   - Survivorship bias check: how many securities in the universe were delisted during the test period? Did the strategy hold any through the delisting event?

5. **Health score (0-100)** — composite of walk-forward decay, cost sensitivity, data quality, and implementation flag count. Below 60: not ready. 60-79: proceed with caution, list open risks. 80+: proceed.

**Report-only mode:** `/backtest-qa --report` produces the full analysis without modifying any code. Default mode fixes implementation bugs it finds (wrong shift direction, etc.) with atomic commits.

---

### `/risk-audit`

**New skill — no Gstack equivalent**
**Cognitive mode:** Risk manager — someone responsible for not blowing up

**Core question:** Under what conditions does this strategy cause serious harm, and are those conditions acceptable?

This skill is run after `/backtest-qa` confirms the implementation is clean. It performs a standalone risk assessment.

**What this skill does:**

1. **Return distribution analysis**
   - Annualized return, volatility, Sharpe, Sortino, Calmar
   - Monthly return histogram — is this normal? Fat-tailed? Left-skewed?
   - Maximum drawdown, drawdown duration, recovery time
   - Rolling 12-month Sharpe to show stability of the edge over time

2. **Tail risk**
   - 95th and 99th percentile monthly loss (historical VaR)
   - Expected shortfall (CVaR) — what is the average loss conditional on being in the tail?
   - Compare to stated risk tolerance. If the 99th percentile monthly loss exceeds the stated limit, flag it.

3. **Drawdown stress test**
   - Replay the strategy through labeled crisis periods: 2000-2002 (dot-com), 2008-2009 (GFC), 2011 (European sovereign), 2015-2016 (China devaluation), 2018 Q4, 2020 March, 2022 (rates shock)
   - For each period: max drawdown, duration, whether the strategy's drawdown was correlated with the broader market drawdown

4. **Factor exposure**
   - Regress strategy returns against Fama-French factors (Mkt-RF, SMB, HML, RMW, CMA) and momentum (UMD)
   - Report R-squared and factor betas
   - Flag if more than 40% of return variance is explained by a single factor (the strategy is a factor bet, not an alpha source)
   - Report alpha (intercept) with statistical significance

5. **Correlation analysis**
   - Correlation of strategy returns to: SPX, AGG, gold, VIX changes, credit spreads
   - Correlation during market stress periods specifically (conditional correlation matters more than unconditional)

6. **Capacity estimate**
   - Model market impact using a square-root model: `impact_bps = k * sigma * sqrt(participation_rate)`
   - Report the AUM at which expected slippage equals 25bps, 50bps, and 100bps per trade
   - Report the AUM at which Sharpe decays to 0.5

7. **Position sizing recommendation**
   - Given the drawdown profile and the user's stated risk tolerance, recommend position sizing using Kelly criterion (full, half, quarter)
   - Report expected annual return and max expected drawdown at each sizing level

**Output:** A risk scorecard with pass/fail flags against stated risk limits, and a one-paragraph risk summary suitable for inclusion in a strategy memo.

---

### `/paper-to-poc`

**New skill — no Gstack equivalent**
**Cognitive mode:** Research engineer who has replicated dozens of academic papers and knows where they all cheat

**Core question:** What does this paper actually claim, is the claim credible, and what is the minimal code to test it?

**What this skill does:**

1. **Paper ingestion** — reads the paper (PDF path or pasted abstract + methodology section). Extracts:
   - The core hypothesis in one sentence
   - The signal construction (exact formula if stated)
   - The universe definition
   - The sample period
   - The reported Sharpe / return / t-stat
   - Transaction cost assumptions
   - Data sources used

2. **Credibility assessment** — flags common academic paper problems:
   - Survivorship bias in the sample (S&P 500 constituents as-of-today vs. point-in-time)
   - Short sample periods (< 10 years, < 2 business cycles)
   - Transaction costs not reported or suspiciously low
   - No out-of-sample test or the OOS period is only 2 years
   - t-statistics adjusted for multiple comparisons (Harvey, Liu, Zhu critique)
   - Publication bias: papers only get published when strategies work — the reported Sharpe is the top of the distribution
   - "Kitchen sink" models with many factors that survived a selection process

3. **Replication spec** — translates the paper's methodology into an unambiguous implementation spec:
   - Data requirements (exact fields, frequency, sources)
   - Signal formula in Python/pandas pseudocode
   - Universe construction logic
   - Portfolio construction steps
   - Benchmark for comparison

4. **Proof of concept scaffolding** — generates the minimal Python/pandas skeleton:
   - Data loading placeholder (parameterized by source)
   - Signal computation
   - Universe filter
   - Portfolio construction
   - Performance reporting (returns, Sharpe, drawdown)
   - Walk-forward split

5. **Deviation log** — where the POC deviates from the paper (e.g., "paper uses Bloomberg earnings data; POC uses Compustat as proxy"), and what impact each deviation likely has on results.

6. **Expected replication range** — given the paper's reported Sharpe and the identified credibility issues, what Sharpe should we expect in a clean replication? (Academic papers reliably overstate by 30-60% due to data mining and publication bias. State this explicitly.)

---

### `/regime-analysis`

**New skill — no Gstack equivalent**
**Cognitive mode:** Market structure analyst / macro strategist

**Core question:** What market regime are we in, and which strategies should be running right now?

This is both a research tool and a live trading tool. It can be run against historical data to classify regimes retrospectively, or against current market data to inform portfolio decisions.

**What this skill does:**

1. **Regime classification** — classifies the current (or historical) period into regimes using multiple independent frameworks:
   - **Trend/mean-reversion regime:** Is the market trending (autocorrelated daily returns) or mean-reverting (negative autocorrelation)? Use Hurst exponent.
   - **Volatility regime:** Current realized vol vs. 12-month rolling average. Low/normal/elevated/crisis.
   - **Liquidity regime:** Bid-ask spreads, volume, market depth (where data is available). Tight/normal/wide/crisis.
   - **Risk-on/risk-off:** Credit spreads, EM/DM ratio, commodity/bond ratio, small/large cap spread.
   - **Rates regime:** Rising/falling/flat rates; inverted/normal yield curve.

2. **Strategy regime mapping** — given a set of strategies (or a portfolio), maps each to its preferred regime and reports the current alignment:
   - Which strategies should be overweighted right now?
   - Which should be underweighted or paused?
   - What is the aggregate regime exposure of the portfolio?

3. **Regime transition warning** — identifies early signals that the current regime may be ending:
   - Breakdowns in correlations that define the regime
   - Increasing dispersion of regime indicators
   - Historical precedents for the current configuration

4. **Historical regime overlay** — takes a strategy's return series and overlays regime classification. Shows how the strategy performed in each regime historically. This is distinct from `/risk-audit`'s crisis stress test — this uses continuous regime classification rather than labeled events.

---

### `/deploy`

**Replaces:** `/ship`
**Cognitive mode:** Live trading release engineer — someone who has watched a bad deployment lose real money

**Core question:** Is this strategy ready for live capital, and have we done everything to prevent it from causing harm?

The key difference from Gstack's `/ship`: shipping bad software causes a bug report. Deploying a bad strategy causes financial loss. The checklist is correspondingly more conservative.

**What this skill does:**

1. **Pre-deployment checklist** (hard stops — any failure blocks deployment):
   - `/strategy-review` has been run and all FATAL and HIGH findings are resolved
   - `/backtest-qa` health score is ≥ 80
   - `/risk-audit` has been run and all risk limits are within stated tolerance
   - Paper trading period of at least [user-specified minimum] is complete
   - Paper trading Sharpe is within 2 standard deviations of backtest Sharpe
   - Data feed for live trading is confirmed active and validated against historical data

2. **Position sizing confirmation** — given current portfolio, calculates:
   - Proposed position sizes for initial deployment
   - Resulting portfolio gross and net exposure
   - Resulting portfolio drawdown estimate at proposed sizing
   - Requires explicit user confirmation before proceeding

3. **Monitoring setup** — creates or updates:
   - Daily P&L tracking with alert thresholds
   - Signal staleness checks (alert if signal has not updated in expected window)
   - Data quality monitors (price feed gaps, missing tickers)
   - Drawdown circuit breaker: auto-suspend if drawdown exceeds [threshold]
   - Tracking error alert: flag if live returns deviate from expected by more than [threshold] over [window]

4. **Deployment record** — writes to `strategies/[name]/deployment-log.md`:
   - Deployment date and version
   - Backtest performance summary
   - Paper trading summary
   - Initial position sizing
   - Risk limits in effect
   - Who authorized the deployment

5. **Git hygiene** (same as Gstack `/ship`):
   - Confirms branch is clean and up to date
   - Runs test suite
   - Creates or updates PR with deployment checklist in body
   - Tags the deployment commit

**Rollback protocol** — `/deploy --rollback` documents the rollback, suspends the strategy, and creates a post-mortem template.

---

### `/performance-retro`

**Replaces:** `/retro`
**Cognitive mode:** Risk/performance analyst — rigorous, numbers-first, no narrative without evidence

**Core question:** What actually happened, why, and what do we change?

**What this skill does:**

1. **Live performance summary** for the period (default: last week, configurable):
   - Gross and net P&L
   - Return vs. expected return (from backtest calibration)
   - Sharpe realized vs. backtest Sharpe
   - Drawdown: current, max since live, vs. backtest max

2. **Attribution analysis**:
   - Which positions drove P&L? (Winners and losers, ranked)
   - Which signal components contributed?
   - Was the period consistent with what the backtest predicted for this regime?

3. **Execution quality review**:
   - Average slippage vs. assumed slippage
   - Fill rate on limit orders (if used)
   - Times of day / market conditions where execution degraded
   - Identify any fills that look anomalous

4. **Signal health check**:
   - Is the signal still generating the expected distribution of values?
   - Has signal autocorrelation changed (sign of decay)?
   - Are any data feeds showing quality degradation?

5. **Tracking error diagnosis** — if live performance deviates from backtest expectation, identify the cause:
   - Regime mismatch (backtest period favored different conditions)
   - Cost overrun (slippage higher than modeled)
   - Signal decay (edge has eroded)
   - Implementation bug (rare but possible)
   - Capacity issue (strategy is moving its own prices)

6. **Recommendation** — one of:
   - **CONTINUE:** Performance within expectations, no action needed
   - **REDUCE:** Performance weak, reduce sizing to [X]% while investigating
   - **SUSPEND:** Performance critically below expectation, suspend and diagnose
   - **RETIRE:** Edge has permanently decayed, retire the strategy

7. **JSON snapshot** saved to `.context/retros/[strategy-name]/[date].json` for trend analysis. Running `/performance-retro compare` shows the last N periods side by side.

---

### `/strategy-doc`

**Replaces:** `/document-release`
**Cognitive mode:** Quant technical writer who knows that undocumented strategies get misused

**Core question:** Does the documentation accurately reflect what this strategy is, how it works, and what its limits are?

A strategy that cannot be documented cannot be safely delegated. The documentation is also the primary artifact for compliance, risk review, and succession planning.

**What this skill does:**

Reads all strategy documentation files and cross-references against the actual implementation. Updates anything that has drifted.

**Documentation set per strategy:**

- `strategies/[name]/README.md` — what this strategy is, who it is for, what it trades
- `strategies/[name]/THESIS.md` — the investment thesis, the alpha source, why it works
- `strategies/[name]/IMPLEMENTATION.md` — technical implementation: signal, universe, portfolio construction, execution
- `strategies/[name]/RISK.md` — risk profile, limits, circuit breakers, known failure modes
- `strategies/[name]/DEPLOYMENT.md` — deployment history, current status, paper trading results
- `strategies/[name]/CHANGELOG.md` — changes to the strategy over time (written for the future PM who inherits this)

For each file, the skill:
- Checks that the documented behavior matches the code
- Updates quantitative claims (Sharpe, drawdown, capacity) if the backtest has been re-run
- Flags discrepancies as questions rather than auto-fixing subjective strategy descriptions

---

### `/data-connect`

**Replaces:** `/setup-browser-cookies` (different problem, same pattern)
**Cognitive mode:** Data infrastructure engineer

**Core question:** Are our data connections live, valid, and consistent?

**What this skill does:**

1. **Data source audit** — reads the strategy's data requirements from `IMPLEMENTATION.md` and checks that each required data source is configured:
   - API credentials present (checks for environment variables, not values)
   - Connection test (fetch one row of data and validate schema)
   - Latency measurement (how long does a full data pull take?)

2. **Data quality validation** — for each connected source:
   - Compare recent live data against known-good historical benchmarks
   - Flag any tickers where live data diverges from expected (price level, volume scale)
   - Check for missing tickers in the live universe vs. expected universe

3. **Data lineage documentation** — updates `strategies/[name]/DATA.md` with:
   - Each data source, its provider, and the exact fields used
   - Data availability start date
   - Known data quality issues
   - Refresh frequency and expected latency

4. **Backup source configuration** — for critical data feeds, prompts user to configure a fallback source and documents the failover procedure.

---

## Project Structure After Transformation

```
nwkstack/
├── strategies/              # Per-strategy documentation and configs
│   └── [strategy-name]/
│       ├── README.md
│       ├── THESIS.md
│       ├── IMPLEMENTATION.md
│       ├── RISK.md
│       ├── DEPLOYMENT.md
│       ├── DATA.md
│       └── CHANGELOG.md
├── alpha-thesis/            # /alpha-thesis skill
├── system-design/           # /system-design skill
├── strategy-review/         # /strategy-review skill
├── backtest-qa/             # /backtest-qa skill
├── risk-audit/              # /risk-audit skill
├── paper-to-poc/            # /paper-to-poc skill
├── regime-analysis/         # /regime-analysis skill
├── deploy/                  # /deploy skill
├── performance-retro/       # /performance-retro skill
├── strategy-doc/            # /strategy-doc skill
├── data-connect/            # /data-connect skill
├── scripts/                 # Build + DX tooling (carry over from Gstack)
│   ├── gen-skill-docs.ts
│   ├── skill-check.ts
│   └── dev-skill.ts
├── test/                    # Skill validation (carry over from Gstack)
│   ├── helpers/
│   ├── fixtures/
│   └── skill-validation.test.ts
├── .context/
│   └── retros/              # Performance retro JSON snapshots
├── bin/                     # CLI utilities
├── setup                    # One-time setup: symlink skills
├── SKILL.md                 # Generated
├── SKILL.md.tmpl            # Edit this, run gen:skill-docs
├── NWKSTACK.md              # This document
├── README.md                # Updated for NWKStack
├── CLAUDE.md                # Updated for NWKStack
└── package.json
```

**Remove:** `browse/`, `qa/`, `qa-only/`, `qa-design-review/`, `plan-design-review/`, `design-consultation/`, `setup-browser-cookies/`, `BROWSER.md`

---

## Testing Strategy

Carry over Gstack's three-tier test structure, adapted for trading context:

**Tier 1 — Static validation (free, < 5s)**
- Skill YAML frontmatter is valid
- Required checklist items are present in each skill (e.g., `/strategy-review` must reference look-ahead bias, survivorship bias, overfitting)
- No skill references removed components (browse, design, etc.)

**Tier 2 — E2E via `claude -p` (paid)**
- `/alpha-thesis` correctly identifies a weak thesis as KILL and a strong one as PURSUE
- `/strategy-review` catches a planted look-ahead bias bug
- `/backtest-qa` detects a survivorship bias issue in a fixture backtest
- `/paper-to-poc` extracts the correct signal formula from a fixture paper abstract
- `/deploy` blocks on a missing pre-deployment checklist item

**Tier 3 — LLM-as-judge**
- Quality of `/alpha-thesis` reasoning (is the factor decomposition sound?)
- Quality of `/strategy-review` findings (does it catch subtle look-ahead bias?)
- Accuracy of `/risk-audit` calculations against known ground truth

**Fixtures to build:**
- `test/fixtures/papers/` — 3-5 real paper abstracts with known replications
- `test/fixtures/backtests/` — backtest code with planted bugs (look-ahead, survivorship)
- `test/fixtures/strategies/` — strategy descriptions ranging from clearly bad to credibly good

---

## CLAUDE.md Updates

The CLAUDE.md for this project must be updated to reflect:

1. **Available skills** — full list of NWKStack skills
2. **No browser tools** — explicitly: "Never use `mcp__claude-in-chrome__*` tools. NWKStack has no browser component."
3. **Strategy documentation standard** — when working on any strategy, always check for a `strategies/[name]/` directory and keep it current
4. **Quant-specific coding conventions**:
   - Always use expanding-window statistics in signal code, never full-sample
   - Always sort by date ascending before any rolling computation
   - Always validate that backtest universe is point-in-time before running
   - Never use `.ffill()` across earnings dates without explicit justification
5. **Test command updates** — updated to match new test structure

---

## README.md Replacement

The new README should follow the same structure as Gstack's but adapted:

- Lead with the core problem (general assistant produces strategies that look good on paper and die in live trading)
- The skill table (all 11 NWKStack skills)
- The end-to-end demo (same pattern as Gstack's demo, but showing the full trading workflow above)
- Who this is for (anyone using Claude Code to research, build, and run trading systems)
- Install instructions (same pattern as Gstack)

---

## Implementation Order for the Executing Team

Work in this sequence to minimize risk and allow incremental testing:

1. **Cleanup** — remove deleted components, update `setup`, `CLAUDE.md`, `README.md`. Run `bun test` to confirm static validation still passes on the scaffold.

2. **Core review skills first** (`/strategy-review`, `/alpha-thesis`) — these are pure prompts with no external dependencies. Easiest to implement and test. Start here to validate the prompt quality standard.

3. **Analysis skills** (`/backtest-qa`, `/risk-audit`) — these involve reading code and data. Requires building good fixture test cases.

4. **Research skills** (`/paper-to-poc`, `/regime-analysis`) — more complex reasoning. Need fixture papers to test against.

5. **Operational skills** (`/deploy`, `/performance-retro`, `/data-connect`, `/strategy-doc`) — these interact with external state. Implement last when the prompt quality standard is established.

6. **System design** (`/system-design`) — this is pure text output but high complexity. Implement after the quality bar is established from the other skills.

7. **Test suite** — build Tier 1 static tests continuously. Build E2E fixtures for the top 5 skills before considering the project shippable.

---

## What Success Looks Like

A researcher with a paper in hand runs:

```
/paper-to-poc [paper]
/alpha-thesis
/system-design
[implements the backtest]
/strategy-review
/backtest-qa
/risk-audit
/deploy
```

And at the end, they have either:
- A deployed paper trading strategy with documented risk limits and monitoring, or
- A clear, evidence-based reason why the strategy was killed before wasting live capital

That outcome — confident deployment or evidence-based rejection — is the product.

---

*Document version: 1.0 | Date: 2026-03-17 | Author: Claude (Sonnet 4.6)*
