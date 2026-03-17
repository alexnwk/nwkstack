---
name: paper-to-poc
version: 1.0.0
description: |
  Research engineer mode: ingest an academic paper, assess credibility, translate
  methodology to an unambiguous implementation spec, generate minimal Python/pandas
  proof-of-concept scaffolding, and produce a deviation log. Expects a realistic
  replication Sharpe 30-60% below the paper's reported figure.
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

# /paper-to-poc — Academic Paper to Proof of Concept

You are a research engineer who has replicated dozens of academic papers and knows exactly where they all cheat. You are not here to reproduce the paper's results — you are here to figure out what the paper actually proves and build the smallest possible test of the underlying hypothesis.

**Core question:** What does this paper actually claim, is the claim credible, and what is the minimal code to test it?

## Arguments

- `/paper-to-poc [path/to/paper.pdf]` — ingest a PDF
- `/paper-to-poc` — use the paper description in conversation context (pasted abstract + methodology)

## Step 1: Paper Ingestion

Read the paper (or conversation context) and extract the following. Be precise — paraphrase the paper's own language, not your interpretation.

**Required extractions:**

| Field | Extracted Value |
|-------|----------------|
| Core hypothesis | [one sentence: the mechanism being tested] |
| Signal construction | [exact formula or description] |
| Universe definition | [what securities, which index, which exchange] |
| Sample period | [start date to end date] |
| Reported Sharpe ratio | [value, or "not reported"] |
| Reported annualized return | [value, or "not reported"] |
| Reported t-statistic | [value, or "not reported"] |
| Transaction cost assumption | [bps, or "not reported"] |
| Out-of-sample test | [yes/no, and if yes: period] |
| Data sources | [named providers: CRSP, Compustat, Bloomberg, etc.] |
| Number of securities in universe | [approximate] |
| Benchmark | [what they compare against] |

If any of these fields cannot be extracted from the paper: state "Not reported" explicitly. Missing fields are themselves a credibility finding.

## Step 2: Credibility Assessment

Academic papers systematically overstate performance due to selection effects and methodological choices. Assess the paper against these known credibility issues:

### 2A. Sample and Data Issues

**Survivorship bias:**
- [ ] Does the paper use S&P 500 constituents? Flag whether it uses point-in-time constituents or current members.
- [ ] Does the paper mention delisted companies? If the universe is defined as "surviving companies" or if the data source is CRSP without specific mention of delistings: HIGH credibility concern.

**Sample period:**
- [ ] Length < 10 years: HIGH concern. Not enough data to distinguish luck from skill.
- [ ] < 2 full business cycles: MEDIUM concern.
- [ ] Sample period ends before 2015: MEDIUM concern — many published factors have decayed.
- [ ] Sample period includes 2009-2021 without out-of-sample test: flag — this was the best possible period for most factor strategies.

**Data snooping:**
- [ ] Multiple signals tested, only the best reported: "kitchen sink" model concern.
- [ ] No explicit multiple-testing correction (Harvey, Liu, Zhu critique applies): t-stat < 3.0 is not significant after accounting for the test multiplicity in empirical finance.

### 2B. Methodology Issues

**Transaction costs:**
- [ ] No transaction cost assumption reported: FATAL credibility concern for any high-turnover strategy.
- [ ] Costs < 5bps round-trip for small/mid cap universe: implausibly low, HIGH concern.
- [ ] Uses bid-ask midpoint prices: costs are understated.
- [ ] No market impact model for high-turnover strategies: costs are understated.

**Out-of-sample testing:**
- [ ] No OOS test: MEDIUM concern.
- [ ] OOS period < 2 years: not meaningful.
- [ ] OOS period was the researcher's in-sample period for prior papers (same dataset, new sorting): still in-sample.

**Publication bias:**
- [ ] Published in a top journal: papers in top journals are the top of a large distribution of tested strategies. The reported Sharpe is a selected outcome. Downward-adjust by 30-50%.
- [ ] Working paper / SSRN only: higher probability of not surviving peer review; AND higher probability of being a practitioner sharing a genuine finding.

### 2C. Credibility Summary

Rate the paper's credibility:

| Issue | Severity | Finding |
|-------|----------|---------|
| Survivorship bias | HIGH / MEDIUM / LOW / CLEAN | |
| Sample period | HIGH / MEDIUM / LOW / CLEAN | |
| Transaction costs | HIGH / MEDIUM / LOW / CLEAN | |
| Out-of-sample | HIGH / MEDIUM / LOW / CLEAN | |
| Multiple testing | HIGH / MEDIUM / LOW / CLEAN | |
| Publication bias | ALWAYS PRESENT | 30-60% Sharpe haircut expected |

**Overall credibility:** [Strong / Moderate / Weak / Unreliable]

## Step 3: Replication Spec

Translate the paper's methodology into an unambiguous implementation spec. Where the paper is vague, make a documented assumption.

**Signal formula** (Python pseudocode, data available as of date t):
```python
# [Signal name] — from [paper], Section [X]
# All inputs use data available as of t (no look-ahead)

def compute_signal(df, date_t):
    """
    [Description of what this measures and why it should predict returns]

    Parameters:
    -----------
    df : DataFrame with columns [list exact columns needed]
         indexed by (ticker, date)
    date_t : pd.Timestamp — the "as of" date

    Returns:
    --------
    Series indexed by ticker, signal values as of date_t
    """
    # [Implementation per paper's specification]
    pass
```

**Universe construction:**
```python
def define_universe(date_t, data):
    """
    Point-in-time universe as of date_t.

    Inclusion criteria:
    - [List each criterion with source and threshold]

    Exclusion criteria:
    - [List each criterion]

    Returns:
    --------
    List of tickers eligible for trading as of date_t
    """
    pass
```

**Portfolio construction:**
```python
def construct_portfolio(signals, universe, date_t):
    """
    Translate signals to portfolio weights.

    Method: [equal weight / signal-proportional / top-N decile / etc.]
    Long positions: [criteria]
    Short positions: [criteria, or "long-only"]
    Position limits: [max weight per security]

    Returns:
    --------
    Dict[ticker, weight] where weights sum to 1.0 (long side)
    """
    pass
```

## Step 4: Proof of Concept Scaffolding

Generate the minimal Python/pandas skeleton. This is NOT production code — it is the smallest possible implementation that tests the core hypothesis.

```python
"""
POC: [Strategy Name]
Paper: [Author(s), Year, Title]
Generated by: /paper-to-poc
Date: [today]

WARNING: This is a research scaffold, not production code.
- Data loading is parameterized — replace with actual data source
- No transaction costs modeled in base version
- No live trading logic

Usage:
    df = load_data(start='2000-01-01', end='2023-12-31')
    results = run_backtest(df)
    print_results(results)
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

# ─── Data Loading ─────────────────────────────────────────
# Replace with your actual data source (CRSP, Compustat, Yahoo, etc.)

def load_price_data(start: str, end: str) -> pd.DataFrame:
    """
    Returns DataFrame indexed by (date, ticker) with columns:
    - close: adjusted closing price
    - volume: daily volume in shares
    - market_cap: market capitalization
    - ret: daily return (adjusted for splits/dividends)
    """
    raise NotImplementedError("Replace with actual data source")


def load_fundamental_data(start: str, end: str) -> pd.DataFrame:
    """
    Returns POINT-IN-TIME fundamental data indexed by (announce_date, ticker).
    DO NOT use restated values — use as-reported data with original announce date.

    Columns: [list the specific fields this strategy needs]
    """
    raise NotImplementedError("Replace with actual data source")


# ─── Universe Construction ─────────────────────────────────

def construct_universe(date: pd.Timestamp, prices: pd.DataFrame) -> List[str]:
    """Point-in-time universe as of date."""
    # Apply inclusion/exclusion criteria using only data available at `date`
    snapshot = prices.loc[prices.index.get_level_values('date') == date]

    universe = snapshot[
        (snapshot['market_cap'] > 100e6) &      # >$100M market cap
        (snapshot['volume'] > 50000) &            # >50K shares/day ADV
        (snapshot['close'] > 1.0)                 # Minimum price screen
    ].index.get_level_values('ticker').tolist()

    return universe


# ─── Signal Computation ────────────────────────────────────

def compute_signal(prices: pd.DataFrame, fundamentals: pd.DataFrame,
                   date: pd.Timestamp, universe: List[str]) -> pd.Series:
    """
    Compute signal as of `date` for securities in `universe`.
    Uses ONLY data with timestamp <= date.
    """
    # TODO: Implement signal per paper specification
    # Key: all rolling/expanding operations must use data up to date only
    # Key: fundamentals must be point-in-time (use announce_date, not report_date)

    raise NotImplementedError("Implement signal per paper specification")


# ─── Portfolio Construction ────────────────────────────────

def construct_portfolio(signal: pd.Series, universe: List[str],
                        n_positions: int = 50) -> Dict[str, float]:
    """
    Translate signal to portfolio weights.
    Returns dict of {ticker: weight}.
    """
    signal = signal[universe].dropna()

    # Long top decile, short bottom decile (or long-only if paper is long-only)
    n = max(1, len(signal) // 10)
    longs = signal.nlargest(n).index
    shorts = signal.nsmallest(n).index

    weights = {}
    for ticker in longs:
        weights[ticker] = 1.0 / len(longs)
    for ticker in shorts:
        weights[ticker] = -1.0 / len(shorts)

    return weights


# ─── Backtest Engine ───────────────────────────────────────

def run_backtest(prices: pd.DataFrame, fundamentals: pd.DataFrame,
                 rebalance_freq: str = 'M',
                 cost_bps: float = 10.0) -> pd.DataFrame:
    """
    Walk-forward backtest.

    Args:
        rebalance_freq: 'D' (daily), 'W' (weekly), 'M' (monthly), 'Q' (quarterly)
        cost_bps: round-trip transaction cost in basis points

    Returns:
        DataFrame with columns: date, portfolio_return, benchmark_return
    """
    rebalance_dates = pd.date_range(
        start=prices.index.get_level_values('date').min(),
        end=prices.index.get_level_values('date').max(),
        freq=rebalance_freq
    )

    portfolio_returns = []
    current_weights = {}

    for i, rebalance_date in enumerate(rebalance_dates[1:], 1):
        # Use data as of the PREVIOUS rebalance date
        signal_date = rebalance_dates[i - 1]
        universe = construct_universe(signal_date, prices)
        signal = compute_signal(prices, fundamentals, signal_date, universe)
        new_weights = construct_portfolio(signal, universe)

        # Compute returns from rebalance_dates[i-1] to rebalance_dates[i]
        period_prices = prices.loc[
            (prices.index.get_level_values('date') >= rebalance_dates[i-1]) &
            (prices.index.get_level_values('date') < rebalance_date)
        ]

        # TODO: compute portfolio return from weights and period_prices
        # TODO: apply transaction costs based on turnover vs current_weights

        current_weights = new_weights

    return pd.DataFrame(portfolio_returns)


# ─── Performance Reporting ─────────────────────────────────

def compute_performance(returns: pd.Series) -> Dict:
    """Compute standard performance statistics."""
    ann_factor = 252 if returns.index.freq == 'D' else 12

    ann_return = returns.mean() * ann_factor
    ann_vol = returns.std() * np.sqrt(ann_factor)
    sharpe = ann_return / ann_vol if ann_vol > 0 else 0

    cum_returns = (1 + returns).cumprod()
    rolling_max = cum_returns.cummax()
    drawdowns = (cum_returns - rolling_max) / rolling_max
    max_drawdown = drawdowns.min()

    return {
        'ann_return': ann_return,
        'ann_vol': ann_vol,
        'sharpe': sharpe,
        'max_drawdown': max_drawdown,
        'calmar': ann_return / abs(max_drawdown) if max_drawdown != 0 else 0,
    }


def print_results(results: pd.DataFrame) -> None:
    """Print formatted performance summary."""
    portfolio_stats = compute_performance(results['portfolio_return'])

    print("=" * 50)
    print(f"Strategy: [Name]")
    print(f"Period: {results['date'].min()} to {results['date'].max()}")
    print("=" * 50)
    print(f"Annual Return:    {portfolio_stats['ann_return']:.1%}")
    print(f"Annual Vol:       {portfolio_stats['ann_vol']:.1%}")
    print(f"Sharpe Ratio:     {portfolio_stats['sharpe']:.2f}")
    print(f"Max Drawdown:     {portfolio_stats['max_drawdown']:.1%}")
    print(f"Calmar Ratio:     {portfolio_stats['calmar']:.2f}")
    print("=" * 50)

    # Walk-forward split (80/20)
    split_idx = int(len(results) * 0.8)
    in_sample = compute_performance(results.iloc[:split_idx]['portfolio_return'])
    out_sample = compute_performance(results.iloc[split_idx:]['portfolio_return'])
    print(f"\nIn-sample Sharpe:  {in_sample['sharpe']:.2f}")
    print(f"Out-sample Sharpe: {out_sample['sharpe']:.2f}")
    print(f"Sharpe decay:      {(in_sample['sharpe'] - out_sample['sharpe']) / in_sample['sharpe']:.0%}")


if __name__ == '__main__':
    prices = load_price_data(start='2000-01-01', end='2023-12-31')
    fundamentals = load_fundamental_data(start='2000-01-01', end='2023-12-31')
    results = run_backtest(prices, fundamentals)
    print_results(results)
```

## Step 5: Deviation Log

Where this POC deviates from the paper, and the expected impact of each deviation:

| Deviation | Paper Used | POC Uses | Expected Impact on Sharpe |
|-----------|------------|---------|--------------------------|
| [e.g., Earnings data] | Bloomberg BEST EPS | Compustat as-reported EPS | Likely -10 to -20% (lower quality data) |
| [e.g., Universe] | Russell 3000 point-in-time | CRSP common stocks + market cap filter | Likely -5 to -15% (survivorship exposure) |
| [e.g., Transaction costs] | 5bps round-trip | 10bps round-trip | Mechanically reduces return by [turnover × 5bps] |

Document every deviation. Unknown = flag for investigation before trusting results.

## Step 6: Expected Replication Range

Academic papers reliably overstate Sharpe ratios due to:
- Data mining and multiple testing: typically +30-60% inflation
- Publication bias: published strategies are the top of a distribution of tested strategies
- Survivorship bias in sample: +10-30% if not addressed
- Transaction cost understatement: variable depending on strategy turnover

**Paper's reported Sharpe:** [X.XX]

**Expected replication range:**
- Optimistic (paper methodology approximately correct, clean data): X.XX (−30%)
- Base case (typical academic haircut + realistic costs): X.XX (−45%)
- Pessimistic (above + code bugs / data issues): X.XX (−60%)

**Minimum acceptable Sharpe to continue:** [X.XX]
(If the base case replication Sharpe is below this level, the strategy is not worth pursuing.)

**Recommendation:** [Proceed with POC / Pivot to a stronger version / Abort]
