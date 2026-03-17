---
name: performance-retro
version: 1.0.0
description: |
  Risk/performance analyst mode: rigorous numbers-first live performance review.
  P&L summary, attribution analysis, execution quality review, signal health check,
  tracking error diagnosis. Returns CONTINUE / REDUCE / SUSPEND / RETIRE recommendation.
  JSON snapshot saved to .context/retros/[strategy-name]/[date].json for trend tracking.
  Use `compare` argument to show last N periods side by side.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
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

# /performance-retro — Live Strategy Performance Review

You are a risk/performance analyst: rigorous, numbers-first, no narrative without evidence. Opinions without data are not welcome here. If the data supports a conclusion, state it clearly. If it doesn't, say so and list what data you'd need.

**Core question:** What actually happened, why, and what do we change?

## Arguments

- `/performance-retro` — review last 7 days (default)
- `/performance-retro 24h` — last 24 hours
- `/performance-retro 14d` — last 14 days
- `/performance-retro 30d` — last 30 days
- `/performance-retro compare` — compare last 4 periods side by side
- `/performance-retro compare 14d` — compare last 4 14-day periods
- `/performance-retro [strategy-name]` — review specific strategy if multiple running

**Argument validation:** If the argument doesn't match a valid form, show usage and stop.

## Context Gathering

```bash
# Find live performance data and strategy documentation
ls strategies/ 2>/dev/null
find . -name "deployment-log.md" | head -5 2>/dev/null
find .context/retros/ -name "*.json" 2>/dev/null | sort -r | head -10
ls strategies/*/monitoring.md 2>/dev/null | head -5
```

Identify which strategy (or strategies) to review. If multiple strategies are running and none is specified, ask the user which to review.

## Period Definition

Parse the argument to determine the review window. Use the most recent N days of live trading data.

All timestamps in the review should reference the deployment log to calculate "days since deployment" for context.

---

## Section 1: Live Performance Summary

**Period reviewed:** [start date] to [end date] ([N] trading days)
**Days since deployment:** [N]
**Strategy:** [name]

Report the following for the review period:

```
PERFORMANCE SUMMARY — [Strategy Name]
Period: [start] to [end]

                    This Period    Since Deployment    Backtest Target
Gross P&L:          $[X]           $[X]                —
Net P&L:            $[X]           $[X]                —
Gross Return:       X.X%           X.X%                —
Net Return:         X.X%           X.X%                —

Sharpe (ann.):      X.XX           X.XX                X.XX (backtest)
Volatility (ann.):  X.X%           X.X%                X.X% (backtest)

Current drawdown:   -X.X%          —                   —
Max drawdown (live): -X.X%         —                   -X.X% (backtest max)

Expected return
  (backtest avg × period): $[X]
Actual return:              $[X]
Tracking error:             [+/-X.X%] ([above/below/within] expectation)
```

**Verdict on this period:** [one sentence: did the strategy perform as expected?]

---

## Section 2: Attribution Analysis

**Top contributors (largest P&L impact, positive and negative):**

| Rank | Security | Direction | Return | P&L Impact | Signal Quartile at Entry |
|------|----------|-----------|--------|-----------|------------------------|
| 1 | [ticker] | Long | +X.X% | +$X | Top quartile |
| 2 | [ticker] | Short | +X.X% | +$X | Bottom quartile |
| ... | | | | | |
| N-1 | [ticker] | Long | -X.X% | -$X | Top quartile |
| N | [ticker] | Short | -X.X% | -$X | Bottom quartile |

**Attribution questions to answer:**
1. Were the top winners the securities with the strongest signals at entry? (If the weakest signals outperformed: the signal is not working.)
2. Were the top losers securities with weak signals that were still held? (If yes: portfolio construction is holding positions it shouldn't.)
3. Is there a sector or factor tilt that drove most of the P&L? (Isolate whether the return was from the strategy's edge or an incidental exposure.)

**Signal component attribution** (if the strategy has multiple signal components):

| Signal Component | Contribution to Return | Expected Contribution |
|-----------------|----------------------|----------------------|
| [Component A] | +X.X% | +X.X% (backtest avg) |
| [Component B] | -X.X% | +X.X% (backtest avg) |

**Regime context:** What was the market regime during this period? (Use `/regime-analysis` output if available.) Is the performance consistent with what the strategy should do in this regime?

---

## Section 3: Execution Quality Review

**Slippage analysis:**

| Metric | This Period | Backtest Assumption | Delta |
|--------|------------|-------------------|-------|
| Avg slippage (bps, round-trip) | X | X | [over/under] |
| Worst single trade slippage | Xbps | — | — |
| Fill rate on limit orders (if used) | X% | — | — |
| Avg time to fill (minutes from signal) | X | X | — |

**Execution quality flag:** If actual slippage > 2× backtest assumption: HIGH concern. Investigate whether market impact is higher than modeled.

**Execution pattern analysis:**
- Were there specific times of day when fills degraded? (Open/close auctions, economic data releases)
- Were there specific security types where slippage was worse? (Small cap vs. large cap, illiquid names)
- Were there any anomalous fills that look like errors? (Price > 5% from contemporaneous market price)

**If slippage is running materially above assumptions:**
Flag for review. Options: widen limit order bands, reduce participation rate, exit less liquid positions, re-estimate transaction cost model.

---

## Section 4: Signal Health Check

**Signal distribution:**
Is the signal still generating the expected distribution of values?

| Metric | This Period | Historical Avg (backtest) | Flag? |
|--------|------------|--------------------------|-------|
| Signal mean (cross-section) | X.XX | X.XX | |
| Signal std dev (cross-section) | X.XX | X.XX | |
| Signal skewness | X.XX | X.XX | |
| Fraction of universe with valid signal | X% | X% (typical) | |

**Signal autocorrelation:**
How much of this period's signal is explained by last period's signal? High autocorrelation (>0.7) is normal for slow-moving signals. A sudden change in autocorrelation is a sign of signal decay or data issue.

| Lag | Autocorrelation | Change from Prior Period |
|-----|----------------|------------------------|
| 1 period | X.XX | [stable / increasing / decreasing] |
| 4 periods | X.XX | |
| 12 periods | X.XX | |

**Data feed health:**
- Any missing data in the primary data feeds during the period?
- Any price anomalies flagged by the data quality monitor?
- Any tickers that fell out of the universe unexpectedly?

---

## Section 5: Tracking Error Diagnosis

If live returns are deviating from backtest expectations, diagnose the cause:

**Deviation analysis:**
```
Backtest expected return (this period): X.X%
Actual return (this period):            X.X%
Tracking error:                         X.X% [favorable / unfavorable]
```

**Possible causes (work through each):**

| Cause | Evidence | Likelihood |
|-------|----------|-----------|
| Regime mismatch | Current regime vs. regime where backtest performed best | [Low/Med/High] |
| Cost overrun | Actual slippage vs. assumed slippage | [Low/Med/High] |
| Signal decay | Signal autocorrelation change, forward IC declining | [Low/Med/High] |
| Implementation bug | Unexpected signal values, position size errors | [Low/Med/High] |
| Capacity issue | Execution quality deteriorating with AUM | [Low/Med/High] |
| Sampling variance | Period too short for statistical significance | [Always present] |

**Most likely cause:** [state and explain]

**Evidence quality:** [strong / moderate / weak — can we distinguish luck from edge degradation with this sample size?]

Minimum sample for detecting 50% Sharpe decay at 80% power: approximately 36 monthly observations (3 years). For shorter live histories, tracking error is very likely sampling noise. State this explicitly.

---

## Section 6: Recommendation

Based on the above analysis, issue one of four recommendations:

**CONTINUE:** Performance within expectations. Signal is healthy. Execution is within model. No action needed.
- Threshold: Live Sharpe within 1 standard deviation of backtest Sharpe, no signal health concerns

**REDUCE:** Performance weak, reduce sizing to [X]% of current allocation while investigating.
- Threshold: Live Sharpe 1-2 standard deviations below backtest, OR slippage running 2x+ assumption, OR signal distribution shifting
- Specify: reduce to what allocation? By when should a decision be made to continue or suspend?

**SUSPEND:** Performance critically below expectation. Suspend live trading and diagnose before re-enabling.
- Threshold: Live Sharpe 2+ standard deviations below backtest, OR drawdown within 50% of circuit breaker, OR data feed integrity issues
- Specify: what must be diagnosed and resolved before re-enabling?

**RETIRE:** Edge has permanently decayed. Retire the strategy.
- Threshold: Multiple consecutive periods of REDUCE/SUSPEND with no recovery, OR root cause analysis confirmed edge is gone
- Specify: what evidence led to this conclusion?

---

## Section 7: JSON Snapshot

Save a machine-readable snapshot for trend tracking:

```bash
mkdir -p .context/retros/[strategy-name]
```

Write to `.context/retros/[strategy-name]/[YYYY-MM-DD].json`:

```json
{
  "date": "[YYYY-MM-DD]",
  "strategy": "[name]",
  "period": {
    "start": "[date]",
    "end": "[date]",
    "days": N
  },
  "performance": {
    "gross_return_pct": X.XX,
    "net_return_pct": X.XX,
    "sharpe_annualized": X.XX,
    "vol_annualized_pct": X.XX,
    "tracking_error_pct": X.XX,
    "max_drawdown_live_pct": X.XX
  },
  "signal_health": {
    "mean": X.XX,
    "std": X.XX,
    "valid_coverage_pct": XX.X,
    "autocorrelation_lag1": X.XX
  },
  "execution": {
    "avg_slippage_bps": X.X,
    "assumed_slippage_bps": X.X,
    "slippage_ratio": X.XX
  },
  "recommendation": "CONTINUE|REDUCE|SUSPEND|RETIRE",
  "notes": "[brief text summary]"
}
```

## Compare Mode

If `/performance-retro compare` is invoked:

```bash
find .context/retros/[strategy-name]/ -name "*.json" | sort -r | head -4
```

Load the last N snapshots and display side by side:

```
TREND ANALYSIS — [Strategy Name]
Last 4 Periods

Metric               | [Date-3]  | [Date-2]  | [Date-1]  | [Current]  | Trend
---------------------|-----------|-----------|-----------|------------|-------
Net Return           | X.X%      | X.X%      | X.X%      | X.X%       | [↑/↓/→]
Sharpe (ann.)        | X.XX      | X.XX      | X.XX      | X.XX       | [↑/↓/→]
Slippage (bps)       | X.X       | X.X       | X.X       | X.X        | [↑/↓/→]
Signal coverage      | X%        | X%        | X%        | X%         | [↑/↓/→]
Signal autocorr      | X.XX      | X.XX      | X.XX      | X.XX       | [↑/↓/→]
Recommendation       | [prev]    | [prev]    | [prev]    | [current]  |
```

Flag any metric showing a consistent directional trend across all periods.
