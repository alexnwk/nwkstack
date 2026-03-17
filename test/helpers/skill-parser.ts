/**
 * SKILL.md parser and validator for NWKStack.
 *
 * Validates skill templates for:
 *   - Valid YAML frontmatter
 *   - Required sections present
 *   - No unresolved {{placeholders}} in generated files
 *   - No hardcoded branch names in git commands
 *
 * Used by:
 *   - test/skill-validation.test.ts (Tier 1 static tests)
 *   - scripts/skill-check.ts (health summary)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SkillFrontmatter {
  name: string;
  version: string;
  description: string;
  'allowed-tools': string[];
}

export interface SkillValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  frontmatter: SkillFrontmatter | null;
}

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * Returns null if no frontmatter is found.
 */
export function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: Partial<SkillFrontmatter> = {};

  // Parse name
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim();

  // Parse version
  const versionMatch = yaml.match(/^version:\s*(.+)$/m);
  if (versionMatch) result.version = versionMatch[1].trim();

  // Parse description (multiline)
  const descMatch = yaml.match(/^description:\s*\|\n((?:  .+\n)*)/m);
  if (descMatch) result.description = descMatch[1].replace(/^  /gm, '').trim();

  // Parse allowed-tools list
  const toolsSection = yaml.match(/^allowed-tools:\n((?:  - .+\n)*)/m);
  if (toolsSection) {
    result['allowed-tools'] = toolsSection[1]
      .split('\n')
      .filter(l => l.trim().startsWith('- '))
      .map(l => l.replace(/^\s*- /, '').trim());
  }

  if (!result.name || !result.version) return null;
  return result as SkillFrontmatter;
}

/**
 * Validate a SKILL.md file.
 */
export function validateSkillMd(skillPath: string): SkillValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(skillPath)) {
    return { valid: false, errors: [`File not found: ${skillPath}`], warnings: [], frontmatter: null };
  }

  const content = fs.readFileSync(skillPath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  // Frontmatter checks
  if (!frontmatter) {
    errors.push('Missing or invalid YAML frontmatter');
  } else {
    if (!frontmatter.name) errors.push('frontmatter: missing name');
    if (!frontmatter.version) errors.push('frontmatter: missing version');
    if (!frontmatter.description) errors.push('frontmatter: missing description');
    if (!frontmatter['allowed-tools'] || frontmatter['allowed-tools'].length === 0) {
      errors.push('frontmatter: missing allowed-tools');
    }
  }

  // Check for AUTO-GENERATED header (generated files only)
  if (!skillPath.endsWith('.tmpl')) {
    if (!content.includes('AUTO-GENERATED')) {
      errors.push('Generated SKILL.md missing AUTO-GENERATED header');
    }
  }

  // Check for unresolved placeholders in generated files
  if (!skillPath.endsWith('.tmpl')) {
    const unresolved = content.match(/\{\{(\w+)\}\}/g);
    if (unresolved) {
      errors.push(`Unresolved placeholders: ${unresolved.join(', ')}`);
    }
  }

  // Check for references to deleted components
  const deletedRefs = [
    'browse/', 'qa/', 'qa-only/', 'qa-design-review/', 'plan-design-review/',
    'design-consultation/', 'setup-browser-cookies/', 'BROWSER.md',
    'mcp__claude-in-chrome', '$B ', 'gstack-update-check',
  ];
  for (const ref of deletedRefs) {
    if (content.includes(ref)) {
      errors.push(`References deleted component: "${ref}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    frontmatter,
  };
}

/**
 * Find all SKILL.md.tmpl files in the project.
 */
export function findSkillTemplates(root: string): string[] {
  const skillDirs = [
    'alpha-thesis', 'system-design', 'strategy-review', 'backtest-qa',
    'risk-audit', 'paper-to-poc', 'regime-analysis', 'deploy',
    'performance-retro', 'strategy-doc', 'data-connect',
  ];

  return skillDirs
    .map(dir => path.join(root, dir, 'SKILL.md.tmpl'))
    .filter(p => fs.existsSync(p));
}

/**
 * Find all generated SKILL.md files in the project.
 */
export function findGeneratedSkills(root: string): string[] {
  const skillDirs = [
    'alpha-thesis', 'system-design', 'strategy-review', 'backtest-qa',
    'risk-audit', 'paper-to-poc', 'regime-analysis', 'deploy',
    'performance-retro', 'strategy-doc', 'data-connect',
  ];

  return skillDirs
    .map(dir => path.join(root, dir, 'SKILL.md'))
    .filter(p => fs.existsSync(p));
}

/**
 * Check for hardcoded branch names in git commands.
 * Returns list of violations.
 */
export function checkHardcodedBranches(content: string): string[] {
  const violations: string[] = [];
  const lines = content.split('\n');

  const gitMainPatterns = [
    /\bgit\s+diff\s+(?:origin\/)?main\b/,
    /\bgit\s+log\s+(?:origin\/)?main\b/,
    /\bgit\s+fetch\s+origin\s+main\b/,
    /\bgit\s+merge\s+origin\/main\b/,
    /\borigin\/main\b/,
  ];

  const allowlist = [
    /fall\s*back\s+to\s+`?main`?/i,
    /typically\s+`?main`?/i,
    /or\s+`main`/i,
    /`main`\./i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isAllowlisted = allowlist.some(p => p.test(line));
    if (isAllowlisted) continue;

    for (const pattern of gitMainPatterns) {
      if (pattern.test(line)) {
        violations.push(`Line ${i + 1}: ${line.trim()}`);
        break;
      }
    }
  }

  return violations;
}
