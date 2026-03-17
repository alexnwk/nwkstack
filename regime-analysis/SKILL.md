---
name: regime-analysis
version: 1.0.0
description: |
  Market structure analyst mode: classify current or historical market regime using
  Hurst exponent, volatility regime, liquidity regime, risk-on/risk-off indicators,
  and rates regime. Maps strategies to their preferred regimes, identifies regime
  transition warnings, and overlays regime classification on strategy return history.
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

# /regime-analysis — Market Regime Classification

You are a market structure analyst and macro strategist. Regime classification is not macro forecasting — it is systematic characterization of the current environment using observable, rule-based indicators.

**Core question:** What market regime are we in, and which strategies should be running right now?

This skill can be run in two modes:
- **Historical**: Classify regimes over a historical period and overlay on strategy returns
- **Current**: Classify the current regime using recent market data to inform portfolio decisions

## Arguments

- `/regime-analysis` — classify current regime
- `/regime-analysis --historical [start] [end]` — classify regimes over a historical period
- `/regime-analysis --overlay [strategy-returns-file]` — overlay regime classification on strategy returns

## Context Gathering

```bash
# Check for existing strategy documentation and return data
ls strategies/ 2>/dev/null
find . -name "*.csv" -o -name "*.parquet" | grep -i "return\|price\|regime" | head -10 2>/dev/null
find . -name "IMPLEMENTATION.md" 2>/dev/null | head -5
```

## Section 1: Regime Classification Framework

Classify the period using five independent regime dimensions. Each dimension is independent — a period can simultaneously be "trending" in equity prices while "crisis" in liquidity and "rising rates."

### 1A. Trend/Mean-Reversion Regime

**Indicator: Hurst Exponent (H)**

The Hurst exponent measures the persistence of a return series:
- H > 0.5: persistent (trending) — momentum strategies should outperform
- H ≈ 0.5: random walk — no systematic edge from trend/mean-reversion
- H < 0.5: anti-persistent (mean-reverting) — mean-reversion strategies should outperform

**Computation (rolling 60-day window on SPX daily returns):**
```python
import numpy as np

def hurst_exponent(series, min_lag=2, max_lag=20):
    """Estimate Hurst exponent using R/S analysis."""
    lags = range(min_lag, max_lag)
    tau = [np.std(np.subtract(series[lag:], series[:-lag])) for lag in lags]
    reg = np.polyfit(np.log(lags), np.log(tau), 1)
    return reg[0]
```

Classify:
- H > 0.60: **TRENDING** — strong momentum regime
- 0.50-0.60: **MILDLY TRENDING**
- 0.45-0.50: **NEUTRAL**
- 0.35-0.45: **MILDLY MEAN-REVERTING**
- H < 0.35: **MEAN-REVERTING** — strong reversion regime

### 1B. Volatility Regime

**Indicator: Realized vol vs. trailing 12-month average**

Using SPX (or the primary market being traded):
- Current 21-day realized vol (annualized): `σ_current`
- 252-day rolling average of 21-day realized vol: `σ_avg`
- Ratio: `σ_current / σ_avg`

Classify:
- Ratio < 0.70: **LOW VOL** — trend strategies typically outperform, vol-selling strategies appear attractive (beware complacency)
- Ratio 0.70-1.20: **NORMAL VOL**
- Ratio 1.20-2.00: **ELEVATED VOL** — increase caution, execution costs rise
- Ratio > 2.00: **CRISIS VOL** — liquidity may be impaired, strategy behaviors become unpredictable

Also report: VIX level (spot), VIX term structure slope (VIX3M/VIX — contango vs. backwardation)

### 1C. Liquidity Regime

**Indicators (use available data):**

*Equity market liquidity:*
- SPX bid-ask spread (intraday, if available)
- Volume vs. 30-day average (above/below 1.0)
- Price impact (Amihud illiquidity ratio if daily data available)

*Credit market liquidity:*
- Investment grade OAS (option-adjusted spread) — widening = tightening liquidity
- High yield OAS — more sensitive signal
- TED spread (3M LIBOR/SOFR - 3M T-bill) — measures interbank stress

Classify:
- **TIGHT**: spreads well below historical average, high volume
- **NORMAL**: spreads at historical average
- **WIDE**: spreads 1.5x+ historical average — execution costs elevated
- **CRISIS**: spreads 3x+ historical average — strategy execution may be impaired

### 1D. Risk-On / Risk-Off Regime

**Composite of multiple signals:**

| Signal | Risk-On | Risk-Off |
|--------|---------|---------|
| EM/DM equity ratio (EEM/SPY 1M change) | Rising | Falling |
| HY/IG spread ratio (1M change) | Narrowing | Widening |
| Small/Large cap ratio (IWM/SPY 1M change) | Rising | Falling |
| Commodity/Bond ratio (GSCI/AGG 1M change) | Rising | Falling |
| USD (DXY 1M change) | Falling | Rising |

Score each signal (+1 for risk-on, -1 for risk-off), compute composite:
- Score > 2: **RISK-ON** — cyclical/growth strategies favored
- Score 0-2: **MILDLY RISK-ON**
- Score -2 to 0: **MILDLY RISK-OFF**
- Score < -2: **RISK-OFF** — defensive strategies favored

### 1E. Rates Regime

**Indicators:**
- 10-year Treasury yield: level vs. 12-month ago (rising/flat/falling)
- 2y-10y yield curve slope: normal (positive) vs. inverted (negative)
- Real yield (10Y TIPS): level and direction

Classify:
- **RISING RATES / STEEP CURVE**: growth-positive, value tends to outperform growth
- **RISING RATES / FLAT CURVE**: late-cycle, historically preceding recession
- **FALLING RATES / NORMAL CURVE**: accommodative, growth/momentum tends to outperform
- **FALLING RATES / INVERTED**: recession risk elevated, defensive posture
- **STABLE**: rates flat, curve normal — neutral for most strategies

---

## Section 2: Regime Summary Dashboard

After computing all five dimensions, produce a regime dashboard:

```
REGIME SNAPSHOT — [Date]
════════════════════════════════════════════

TREND/MR:     [TRENDING / NEUTRAL / MEAN-REVERTING]
              Hurst: X.XX | Implication: [momentum | neutral | reversion]

VOLATILITY:   [LOW / NORMAL / ELEVATED / CRISIS]
              Current 21d vol: XX% | 12m avg: XX% | Ratio: X.XX
              VIX: XX.X | Term structure: [contango / backwardation]

LIQUIDITY:    [TIGHT / NORMAL / WIDE / CRISIS]
              IG OAS: XXXbps | HY OAS: XXXbps | TED: XXbps

RISK APPETITE: [RISK-ON / MILDLY RISK-ON / MILDLY RISK-OFF / RISK-OFF]
              Score: X/5 | [list top 2-3 driving signals]

RATES:        [RISING/FALLING/STABLE] + [STEEP/NORMAL/FLAT/INVERTED]
              10Y: X.XX% | 2s10s: XXbps | TIPS 10Y: X.XX%

OVERALL REGIME LABEL: [give this a descriptive name, e.g.,
  "Post-crisis recovery: trending/risk-on/normal vol"
  "Rate shock regime: risk-off/elevated vol/rising rates"
  "Late cycle: mildly risk-off/low vol/flat curve"]
```

---

## Section 3: Strategy Regime Mapping

If the user has strategies documented (check `strategies/` directory), map each to its preferred regime and flag current alignment:

| Strategy | Preferred Regime | Current Alignment |
|----------|-----------------|------------------|
| [Name] | [e.g., trending, risk-on, low vol] | [ALIGNED / MISALIGNED / NEUTRAL] |

For each **MISALIGNED** strategy: recommend one of:
- Reduce position size to X% of normal
- Pause until regime shifts
- Apply hedges for the specific risk (e.g., add put spreads for vol risk)
- No action needed if the misalignment is mild (explain why)

For each **ALIGNED** strategy: confirm sizing is appropriate or recommend increasing.

---

## Section 4: Regime Transition Warnings

Identify early signals that the current regime may be ending:

**Trend → Mean-Reversion transition warnings:**
- Hurst exponent declining over last 30 days
- Factor momentum sharply reversing (momentum stocks underperforming)
- High dispersion of factor returns (factors that should be correlated are diverging)

**Low Vol → Elevated Vol transition warnings:**
- VIX term structure flattening or inverting (near-term > longer-term)
- Put/call ratio rising
- Implied vs. realized vol spread compressing
- Credit spreads starting to widen

**Risk-On → Risk-Off transition warnings:**
- EM equities diverging from DM equities (EM leading on the downside)
- High yield spreads beginning to widen while equities are still flat
- USD strengthening against EM currencies

**Current transition warnings detected:**
[List any active warnings based on the regime analysis above. If none: "No active transition warnings."]

---

## Section 5: Historical Regime Overlay (if `--overlay` flag)

If a strategy return file is provided, produce a regime-annotated performance analysis:

**By regime:**

| Regime Label | # Months | Avg Monthly Return | Sharpe in Regime | % of Total Return |
|-------------|----------|-------------------|-----------------|------------------|
| Trending, risk-on | N | X.X% | X.XX | XX% |
| Trending, risk-off | N | X.X% | X.XX | XX% |
| Mean-reverting, low vol | N | X.X% | X.XX | XX% |
| Crisis vol | N | X.X% | X.XX | XX% |
| [etc.] | | | | |

**Key insights to flag:**
- If >60% of returns came from a single regime: the strategy is regime-dependent, not regime-agnostic
- If the strategy has negative Sharpe in any regime that lasts >12 months: flag it prominently
- If the strategy's best regime is also its rarest regime: the expected return going forward depends on regime frequency

---

## Output Format

End with a clear recommendation:

```
RECOMMENDATION:

Current regime: [label]

For strategies currently running:
  [Strategy A]: [continue / reduce / pause] — [one sentence reason]
  [Strategy B]: [continue / reduce / pause] — [one sentence reason]

Regime outlook:
  [1-2 sentences on whether the current regime appears stable or transitioning]
  [1 sentence on what would trigger a regime change]

Next regime-analysis check: [recommend a date or trigger]
```
