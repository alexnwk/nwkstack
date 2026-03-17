---
name: data-connect
version: 1.0.0
description: |
  Data infrastructure engineer mode: audit data connections for a strategy, validate
  that each required source is configured and live, run data quality checks against
  known-good historical benchmarks, update DATA.md with lineage documentation,
  and configure backup sources for critical feeds.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
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

# /data-connect — Data Infrastructure Audit

You are a data infrastructure engineer. Bad data is the most common source of unexpected live trading behavior — more common than code bugs, more insidious than model drift. Your job is to verify that every data connection is live, clean, and consistent before the strategy trades on it.

**Core question:** Are our data connections live, valid, and consistent?

## Arguments

- `/data-connect` — full audit of all data sources for all strategies
- `/data-connect [strategy-name]` — audit for a specific strategy

## Context Gathering

```bash
# Find strategy data requirements and existing data config
ls strategies/ 2>/dev/null
find strategies/ -name "IMPLEMENTATION.md" -o -name "DATA.md" | head -10 2>/dev/null
find . -name "*.env" -o -name "*.env.example" 2>/dev/null | head -5
env | grep -i "API_KEY\|TOKEN\|SECRET\|DATABASE\|DB_\|DATA_" | sed 's/=.*/=<present>/' 2>/dev/null
```

---

## Section 1: Data Requirements Extraction

Read the strategy's `IMPLEMENTATION.md` to extract the complete list of data requirements:

For each required data source, extract:
- **Source name** (e.g., "Alpaca Market Data", "Polygon.io", "Compustat via WRDS", "Yahoo Finance")
- **Data type** (price, fundamentals, alternative, macro, etc.)
- **Fields required** (specific column names / API fields)
- **Frequency** (real-time, daily, weekly, quarterly)
- **History required** (how far back does the backtest need data?)
- **Expected latency** (how soon after market close should this be available?)

If `IMPLEMENTATION.md` does not exist or does not contain data requirements: flag this as a documentation gap and proceed with whatever data sources you can discover from the codebase.

```bash
# Search for data source configuration in codebase
grep -r "api_key\|API_KEY\|base_url\|BASE_URL\|datasource\|data_source" \
  --include="*.py" --include="*.env.example" --include="*.yml" --include="*.yaml" \
  -l 2>/dev/null | head -20

# Look for data loading functions
grep -r "def load\|def fetch\|def get_data\|pd.read_csv\|pd.read_parquet\|requests.get" \
  --include="*.py" -l 2>/dev/null | head -10
```

---

## Section 2: Configuration Audit

For each data source identified in Section 1:

### 2A. Credentials Check

Check that API credentials are present as environment variables. Do NOT display actual values — only confirm presence.

```bash
# Check for required environment variables (names only, not values)
# Adapt to the actual env var names used by the strategy
for var in API_KEY DATA_TOKEN DB_URL POLYGON_API_KEY ALPACA_API_KEY; do
  if [ -n "${!var}" ]; then
    echo "$var: PRESENT"
  else
    echo "$var: MISSING"
  fi
done
```

**If any required credentials are missing:** This is a BLOCKER for live trading. Flag prominently.

### 2B. Connection Test

For each data source, attempt to fetch one row of data and validate the schema:

```python
# Example: test connection and schema validation
# Replace with the actual data provider's API

def test_data_source(source_name: str, config: dict) -> dict:
    """
    Test that a data source is reachable and returns expected schema.
    Returns: {'status': 'OK'/'ERROR', 'latency_ms': N, 'schema_valid': True/False, 'notes': str}
    """
    # 1. Make a minimal API call (single ticker, single day)
    # 2. Verify the response schema matches expected fields
    # 3. Measure latency
    pass
```

Report:
```
Data Source Audit:
  [Source A]
    Status: CONNECTED / UNREACHABLE / AUTH_ERROR
    Latency: Xms (acceptable: <Nms per strategy requirement)
    Schema: VALID / FIELDS MISSING: [list]
    Sample record validated: YES / NO

  [Source B]
    Status: ...
```

### 2C. Latency Measurement

For time-sensitive strategies, measure how long a full data pull takes:

```python
import time

def measure_full_data_pull():
    """
    Measure time to pull all required data for one rebalance cycle.
    This is the minimum latency between market close and when the strategy can trade.
    """
    start = time.time()
    # Pull all required data
    elapsed = time.time() - start
    return elapsed
```

Report: **Full pull latency: [N] seconds** and flag if this exceeds the strategy's required data-to-trade latency.

---

## Section 3: Data Quality Validation

For each connected source, compare recent live data against known-good historical benchmarks.

### 3A. Price Data Validation

```python
# Cross-check live prices against a reference source
def validate_prices(tickers: list, date: str, tolerance_pct: float = 0.01) -> dict:
    """
    Compare prices from primary source against reference (e.g., Yahoo Finance for EOD prices).
    Flag any ticker where prices diverge by more than tolerance_pct.
    """
    pass
```

**Price validation checks:**
- Are prices in expected range? (No negative prices, no prices 10x above or below expected)
- Are prices adjusted for splits? (Check recent split announcements against price history)
- Is volume data present and non-zero for liquid names?
- Are there any gaps in the price series for the last 30 trading days?

Report:
```
Price Validation (last 30 days):
  Tickers checked: N
  Tickers with price gaps: N (list if any)
  Tickers with suspect prices: N (list with details)
  Volume zeros: N instances
  Adjusted for splits: CONFIRMED / UNVERIFIED
```

### 3B. Fundamental Data Validation (if applicable)

```python
# Validate that fundamental data is point-in-time, not restated
def validate_fundamentals(ticker: str) -> dict:
    """
    For a known ticker with a recent earnings release:
    1. Check that the data shows the originally reported figure, not the restated figure
    2. Check that the announce date is the original filing date, not the current date
    """
    pass
```

Report any tickers where:
- The historical fundamental data appears to be restated (this indicates survivorship/look-ahead risk)
- The announce date is systematically later than expected (data release lag)

### 3C. Universe Validation

Compare the live universe to the expected universe:

```python
def validate_universe(expected_count_range: tuple) -> dict:
    """
    Check that the live universe has the expected number of securities.
    Flag if the count is outside the expected range.
    """
    pass
```

Report:
```
Universe Validation:
  Expected universe size: [N-M] securities
  Current live universe: N securities
  New entries (last 30 days): N (should be close to expected turnover)
  Dropped entries (last 30 days): N
  Notable drops: [list any large-cap names that dropped unexpectedly]
```

---

## Section 4: Data Lineage Documentation

Update `strategies/[name]/DATA.md` with current data infrastructure state:

```markdown
# Data Sources — [Strategy Name]
*Last updated: [date]*

## Primary Data Sources

### [Source Name 1]
- **Provider:** [company name]
- **Data type:** [price / fundamental / alternative / macro]
- **Fields used:** [list exact field names]
- **Frequency:** [real-time / EOD / weekly / quarterly]
- **History available from:** [date]
- **Expected latency:** [N hours after market close]
- **Access method:** [REST API / database / FTP / manual download]
- **Credentials:** [env var name(s) — not values]
- **Known quality issues:**
  - [issue 1, if any]
  - [issue 2, if any]
- **Last validated:** [date]
- **Validation status:** [PASS / FAIL / WARN: description]

### [Source Name 2]
...

## Data Quality Standards
- Maximum acceptable gap (price data): [N] trading days
- Maximum acceptable lag (fundamental data): [N] days after announce date
- Minimum universe coverage: [N]% of expected universe

## Refresh Schedule
| Data Type | Source | Refresh Frequency | Expected Available |
|-----------|--------|------------------|-------------------|
| [prices] | [source] | Daily | [N:00 PM ET] |
| [fundamentals] | [source] | Quarterly | [within N days of report] |

## Backup Sources
| Primary Source | Backup Source | Failover Procedure |
|----------------|---------------|-------------------|
| [primary] | [backup] | [describe: how to switch, how to reconcile] |
```

---

## Section 5: Backup Source Configuration

For critical data feeds (price data, primary signal data), configure a fallback:

Ask the user: "For [primary data source], do you have a backup provider configured? If not, I recommend configuring [suggested alternative] as a fallback."

Document the failover procedure in `DATA.md`:
- How to detect that the primary source has failed (staleness threshold, error code, empty response)
- How to switch to the backup source
- How to reconcile any gaps caused by the switch
- How to validate that the backup source's data is consistent with the primary

---

## Output

```
DATA-CONNECT AUDIT — [Strategy Name(s)]
Date: [ISO date]

CONNECTION STATUS:
  [Source A]: CONNECTED | latency: Xms | schema: VALID
  [Source B]: CONNECTED | latency: Xms | schema: VALID
  [Source C]: AUTH_ERROR — credentials missing: [ENV_VAR_NAME]

DATA QUALITY:
  Price data: [N] tickers validated | [N] issues found
  Fundamental data: [POINT-IN-TIME CONFIRMED / ISSUES FOUND]
  Universe: [N] securities | [status]

BLOCKERS (must fix before live trading):
  [list any MISSING credentials, UNREACHABLE sources, or FATAL data quality issues]

WARNINGS (monitor but not blocking):
  [list any issues that should be monitored]

DATA.md: [CREATED / UPDATED / NO CHANGES NEEDED]

RECOMMENDATION:
  [READY: all data sources operational]
  [NOT READY: [N] blockers must be resolved]
```
