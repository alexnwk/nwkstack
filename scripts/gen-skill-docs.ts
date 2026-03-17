#!/usr/bin/env bun
/**
 * Generate SKILL.md files from .tmpl templates.
 *
 * Pipeline:
 *   read .tmpl → find {{PLACEHOLDERS}} → resolve from source → format → write .md
 *
 * Supports --dry-run: generate to memory, exit 1 if different from committed file.
 * Used by skill:check and CI freshness checks.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Placeholder Resolvers ──────────────────────────────────

function generatePreamble(): string {
  return `## Preamble (run first)

\`\`\`bash
mkdir -p ~/.nwkstack/sessions
touch ~/.nwkstack/sessions/"$PPID"
_SESSIONS=$(find ~/.nwkstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.nwkstack/sessions -mmin +120 -type f -delete 2>/dev/null || true
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH | SESSIONS: $_SESSIONS"
\`\`\`

## AskUserQuestion Format

**ALWAYS follow this structure for every AskUserQuestion call:**
1. **Re-ground:** State the strategy/project, the current branch (use the \`_BRANCH\` value printed by the preamble), and the current task. (1-2 sentences)
2. **Simplify:** Explain the problem in plain English. No raw variable names or internal jargon. Use concrete examples. Say what it DOES, not what it's called.
3. **Recommend:** \`RECOMMENDATION: Choose [X] because [one-line reason]\`
4. **Options:** Lettered options: \`A) ... B) ... C) ...\`

Assume the user hasn't looked at this window in 20 minutes. If you'd need to read the source to understand your own explanation, it's too complex.

Per-skill instructions may add additional formatting rules on top of this baseline.`;
}

function generateBaseBranchDetect(): string {
  return `## Step 0: Detect base branch

Determine which branch this PR targets. Use the result as "the base branch" in all subsequent steps.

1. Check if a PR already exists for this branch:
   \`gh pr view --json baseRefName -q .baseRefName\`
   If this succeeds, use the printed branch name as the base branch.

2. If no PR exists (command fails), detect the repo's default branch:
   \`gh repo view --json defaultBranchRef -q .defaultBranchRef.name\`

3. If both commands fail, fall back to \`main\`.

Print the detected base branch name. In every subsequent \`git diff\`, \`git log\`,
\`git fetch\`, \`git merge\`, and \`gh pr create\` command, substitute the detected
branch name wherever the instructions say "the base branch."

---`;
}

const RESOLVERS: Record<string, () => string> = {
  PREAMBLE: generatePreamble,
  BASE_BRANCH_DETECT: generateBaseBranchDetect,
};

// ─── Template Processing ────────────────────────────────────

const GENERATED_HEADER = `<!-- AUTO-GENERATED from {{SOURCE}} — do not edit directly -->\n<!-- Regenerate: bun run gen:skill-docs -->\n`;

function processTemplate(tmplPath: string): { outputPath: string; content: string } {
  const tmplContent = fs.readFileSync(tmplPath, 'utf-8');
  const relTmplPath = path.relative(ROOT, tmplPath);
  const outputPath = tmplPath.replace(/\.tmpl$/, '');

  // Replace placeholders
  let content = tmplContent.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const resolver = RESOLVERS[name];
    if (!resolver) throw new Error(`Unknown placeholder {{${name}}} in ${relTmplPath}`);
    return resolver();
  });

  // Check for any remaining unresolved placeholders
  const remaining = content.match(/\{\{(\w+)\}\}/g);
  if (remaining) {
    throw new Error(`Unresolved placeholders in ${relTmplPath}: ${remaining.join(', ')}`);
  }

  // Prepend generated header (after frontmatter)
  const header = GENERATED_HEADER.replace('{{SOURCE}}', path.basename(tmplPath));
  const fmEnd = content.indexOf('---', content.indexOf('---') + 3);
  if (fmEnd !== -1) {
    const insertAt = content.indexOf('\n', fmEnd) + 1;
    content = content.slice(0, insertAt) + header + content.slice(insertAt);
  } else {
    content = header + content;
  }

  return { outputPath, content };
}

// ─── Main ───────────────────────────────────────────────────

function findTemplates(): string[] {
  const templates: string[] = [];
  const candidates = [
    path.join(ROOT, 'SKILL.md.tmpl'),
    path.join(ROOT, 'alpha-thesis', 'SKILL.md.tmpl'),
    path.join(ROOT, 'system-design', 'SKILL.md.tmpl'),
    path.join(ROOT, 'strategy-review', 'SKILL.md.tmpl'),
    path.join(ROOT, 'backtest-qa', 'SKILL.md.tmpl'),
    path.join(ROOT, 'risk-audit', 'SKILL.md.tmpl'),
    path.join(ROOT, 'paper-to-poc', 'SKILL.md.tmpl'),
    path.join(ROOT, 'regime-analysis', 'SKILL.md.tmpl'),
    path.join(ROOT, 'deploy', 'SKILL.md.tmpl'),
    path.join(ROOT, 'performance-retro', 'SKILL.md.tmpl'),
    path.join(ROOT, 'strategy-doc', 'SKILL.md.tmpl'),
    path.join(ROOT, 'data-connect', 'SKILL.md.tmpl'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) templates.push(p);
  }
  return templates;
}

let hasChanges = false;

for (const tmplPath of findTemplates()) {
  const { outputPath, content } = processTemplate(tmplPath);
  const relOutput = path.relative(ROOT, outputPath);

  if (DRY_RUN) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
    if (existing !== content) {
      console.log(`STALE: ${relOutput}`);
      hasChanges = true;
    } else {
      console.log(`FRESH: ${relOutput}`);
    }
  } else {
    fs.writeFileSync(outputPath, content);
    console.log(`GENERATED: ${relOutput}`);
  }
}

if (DRY_RUN && hasChanges) {
  process.exit(1);
}
