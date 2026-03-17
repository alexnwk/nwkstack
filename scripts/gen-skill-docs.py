#!/usr/bin/env python3
"""Generate SKILL.md files from .tmpl templates (Python port of gen-skill-docs.ts)"""

import os
import re

ROOT = "/workspaces/nwkstack"

PREAMBLE = """## Preamble (run first)

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

Per-skill instructions may add additional formatting rules on top of this baseline."""

BASE_BRANCH_DETECT = """## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   `gh pr view --json baseRefName -q .baseRefName`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

3. If both commands fail, fall back to `main`.

Print the detected base branch name. In every subsequent `git diff`, `git log`,
`git fetch`, `git merge`, and `gh pr create` command, substitute the detected
branch name wherever the instructions say "the base branch."

---"""

RESOLVERS = {
    'PREAMBLE': PREAMBLE,
    'BASE_BRANCH_DETECT': BASE_BRANCH_DETECT,
}

def process_template(tmpl_path):
    with open(tmpl_path, 'r') as f:
        content = f.read()
    
    rel_tmpl_path = os.path.relpath(tmpl_path, ROOT)
    output_path = tmpl_path[:-5]  # remove .tmpl
    
    def replace_placeholder(match):
        name = match.group(1)
        if name not in RESOLVERS:
            raise ValueError(f"Unknown placeholder {{{{{name}}}}} in {rel_tmpl_path}")
        return RESOLVERS[name]
    
    content = re.sub(r'\{\{(\w+)\}\}', replace_placeholder, content)
    
    # Check for remaining placeholders
    remaining = re.findall(r'\{\{\w+\}\}', content)
    if remaining:
        raise ValueError(f"Unresolved placeholders in {rel_tmpl_path}: {remaining}")
    
    # Add generated header after frontmatter
    source_name = os.path.basename(tmpl_path)
    header = f"<!-- AUTO-GENERATED from {source_name} — do not edit directly -->\n<!-- Regenerate: bun run gen:skill-docs -->\n"
    
    fm_start = content.find('---')
    fm_end = content.find('---', fm_start + 3)
    if fm_end != -1:
        insert_at = content.find('\n', fm_end) + 1
        content = content[:insert_at] + header + content[insert_at:]
    else:
        content = header + content
    
    return output_path, content

# Find all templates
templates = []
candidates = [
    os.path.join(ROOT, 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'alpha-thesis', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'system-design', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'strategy-review', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'backtest-qa', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'risk-audit', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'paper-to-poc', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'regime-analysis', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'deploy', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'performance-retro', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'strategy-doc', 'SKILL.md.tmpl'),
    os.path.join(ROOT, 'data-connect', 'SKILL.md.tmpl'),
]

for p in candidates:
    if os.path.exists(p):
        templates.append(p)

for tmpl_path in templates:
    output_path, content = process_template(tmpl_path)
    with open(output_path, 'w') as f:
        f.write(content)
    rel_output = os.path.relpath(output_path, ROOT)
    print(f"GENERATED: {rel_output}")

print(f"\nTotal: {len(templates)} files generated")
