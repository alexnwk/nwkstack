/**
 * Tier 1 Static Validation — NWKStack Skills
 *
 * Free, fast (<5s). Validates skill templates and generated SKILL.md files.
 * Does not call any LLM or external service.
 *
 * Run: bun test test/skill-validation.test.ts
 */

import { describe, test, expect } from 'bun:test';
import {
  validateSkillMd,
  parseFrontmatter,
  findSkillTemplates,
  findGeneratedSkills,
  checkHardcodedBranches,
} from './helpers/skill-parser';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

// ─── Skill directories ──────────────────────────────────────

const SKILL_DIRS = [
  'alpha-thesis',
  'system-design',
  'strategy-review',
  'backtest-qa',
  'risk-audit',
  'paper-to-poc',
  'regime-analysis',
  'deploy',
  'performance-retro',
  'strategy-doc',
  'data-connect',
];

// ─── Template existence ──────────────────────────────────────

describe('All 11 skill directories exist with SKILL.md.tmpl', () => {
  for (const dir of SKILL_DIRS) {
    test(`${dir}/SKILL.md.tmpl exists`, () => {
      const tmplPath = path.join(ROOT, dir, 'SKILL.md.tmpl');
      expect(fs.existsSync(tmplPath)).toBe(true);
    });
  }
});

// ─── Template frontmatter validation ─────────────────────────

describe('SKILL.md.tmpl frontmatter is valid', () => {
  for (const dir of SKILL_DIRS) {
    test(`${dir}/SKILL.md.tmpl has valid frontmatter`, () => {
      const tmplPath = path.join(ROOT, dir, 'SKILL.md.tmpl');
      if (!fs.existsSync(tmplPath)) return;

      const content = fs.readFileSync(tmplPath, 'utf-8');
      const fm = parseFrontmatter(content);

      expect(fm).not.toBeNull();
      expect(fm!.name).toBeTruthy();
      expect(fm!.version).toBeTruthy();
      expect(fm!.description).toBeTruthy();
      expect(fm!['allowed-tools']).toBeTruthy();
      expect(fm!['allowed-tools'].length).toBeGreaterThan(0);
    });

    test(`${dir}/SKILL.md.tmpl name matches directory`, () => {
      const tmplPath = path.join(ROOT, dir, 'SKILL.md.tmpl');
      if (!fs.existsSync(tmplPath)) return;

      const content = fs.readFileSync(tmplPath, 'utf-8');
      const fm = parseFrontmatter(content);

      expect(fm).not.toBeNull();
      expect(fm!.name).toBe(dir);
    });
  }
});

// ─── Generated SKILL.md existence ───────────────────────────

describe('Generated SKILL.md files exist', () => {
  for (const dir of SKILL_DIRS) {
    test(`${dir}/SKILL.md exists (run bun run gen:skill-docs if missing)`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);
    });
  }
});

// ─── Generated SKILL.md content validation ──────────────────

describe('Generated SKILL.md files are valid', () => {
  for (const dir of SKILL_DIRS) {
    test(`${dir}/SKILL.md has AUTO-GENERATED header`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return;

      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content).toContain('AUTO-GENERATED');
    });

    test(`${dir}/SKILL.md has no unresolved {{placeholders}}`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return;

      const content = fs.readFileSync(skillPath, 'utf-8');
      const unresolved = content.match(/\{\{(\w+)\}\}/g);
      expect(unresolved).toBeNull();
    });

    test(`${dir}/SKILL.md has no references to deleted components`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return;

      const result = validateSkillMd(skillPath);
      const errors = result.errors.filter(e => e.includes('References deleted component'));
      expect(errors).toHaveLength(0);
    });
  }
});

// ─── Required checklist items per skill ─────────────────────

describe('/strategy-review required checklist items', () => {
  const skillPath = path.join(ROOT, 'strategy-review', 'SKILL.md');

  test('references look-ahead bias', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('look-ahead');
  });

  test('references survivorship bias', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('survivorship');
  });

  test('references overfitting', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('overfitting');
  });

  test('references transaction cost', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('transaction cost');
  });

  test('references regime', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('regime');
  });

  test('references severity ratings FATAL, HIGH, MEDIUM, LOW', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('FATAL');
    expect(content).toContain('HIGH');
    expect(content).toContain('MEDIUM');
    expect(content).toContain('LOW');
  });
});

describe('/alpha-thesis required elements', () => {
  const skillPath = path.join(ROOT, 'alpha-thesis', 'SKILL.md');

  test('has three mode definitions', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('STRESS TEST');
    expect(content).toContain('BUILD BEST CASE');
    expect(content).toContain('FEASIBILITY FOCUS');
  });

  test('has three verdict options', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('PURSUE');
    expect(content).toContain('PIVOT');
    expect(content).toContain('KILL');
  });

  test('references alpha source analysis', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('alpha source');
  });

  test('references capacity', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('capacity');
  });
});

describe('/backtest-qa required elements', () => {
  const skillPath = path.join(ROOT, 'backtest-qa', 'SKILL.md');

  test('has health score 0-100', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('0-100');
  });

  test('references walk-forward validation', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('walk-forward');
  });

  test('references transaction cost sensitivity', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('transaction cost');
  });

  test('health score thresholds: 60 and 80', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('60');
    expect(content).toContain('80');
  });

  test('has --report mode', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('--report');
  });
});

describe('/deploy pre-deployment checklist', () => {
  const skillPath = path.join(ROOT, 'deploy', 'SKILL.md');

  test('references strategy-review', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('strategy-review');
  });

  test('references backtest-qa health score ≥ 80', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('backtest-qa');
    expect(content).toContain('80');
  });

  test('references risk-audit', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('risk-audit');
  });

  test('has --rollback mode', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('--rollback');
  });

  test('writes to deployment-log.md', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('deployment-log.md');
  });
});

describe('/performance-retro required elements', () => {
  const skillPath = path.join(ROOT, 'performance-retro', 'SKILL.md');

  test('has four recommendation states', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('CONTINUE');
    expect(content).toContain('REDUCE');
    expect(content).toContain('SUSPEND');
    expect(content).toContain('RETIRE');
  });

  test('saves JSON snapshot to .context/retros/', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('.context/retros/');
  });

  test('has compare mode', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('compare');
  });
});

describe('/risk-audit required elements', () => {
  const skillPath = path.join(ROOT, 'risk-audit', 'SKILL.md');

  test('references VaR/CVaR tail risk', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('var');
    expect(content.toLowerCase()).toContain('cvar');
  });

  test('references GFC crisis period (2008)', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('2008');
  });

  test('references factor exposure / Fama-French', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('factor');
  });

  test('references Kelly criterion', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content.toLowerCase()).toContain('kelly');
  });

  test('has risk scorecard with GREEN/YELLOW/RED', () => {
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('GREEN');
    expect(content).toContain('YELLOW');
    expect(content).toContain('RED');
  });
});

// ─── Preamble format validation ──────────────────────────────

describe('All skills have valid PREAMBLE', () => {
  for (const dir of SKILL_DIRS) {
    test(`${dir}/SKILL.md contains RECOMMENDATION format`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return;

      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content).toContain('RECOMMENDATION:');
      expect(content).toContain('AskUserQuestion');
    });

    test(`${dir}/SKILL.md contains nwkstack session setup`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return;

      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content).toContain('.nwkstack/sessions');
    });
  }
});

// ─── No deleted component references ────────────────────────

describe('No skills reference deleted gstack components', () => {
  const deletedRefs = [
    'mcp__claude-in-chrome',
    'gstack-update-check',
    '.gstack/',
    'plan-ceo-review',
    'plan-eng-review',
    '/browse',
    '\\$B ',
  ];

  for (const dir of SKILL_DIRS) {
    test(`${dir}/SKILL.md has no deleted component references`, () => {
      const skillPath = path.join(ROOT, dir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return;

      const content = fs.readFileSync(skillPath, 'utf-8');
      for (const ref of deletedRefs) {
        expect(content).not.toContain(ref);
      }
    });
  }
});

// ─── Strategy doc structure ──────────────────────────────────

describe('/strategy-doc documents all required files', () => {
  const skillPath = path.join(ROOT, 'strategy-doc', 'SKILL.md');

  const requiredFiles = ['README.md', 'THESIS.md', 'IMPLEMENTATION.md', 'RISK.md', 'DEPLOYMENT.md', 'CHANGELOG.md'];

  for (const file of requiredFiles) {
    test(`references ${file}`, () => {
      if (!fs.existsSync(skillPath)) return;
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content).toContain(file);
    });
  }
});

// ─── Hardcoded branch names ──────────────────────────────────

describe('No hardcoded branch names in deploy/SKILL.md.tmpl', () => {
  test('deploy/SKILL.md.tmpl uses BASE_BRANCH_DETECT, not hardcoded "main"', () => {
    const tmplPath = path.join(ROOT, 'deploy', 'SKILL.md.tmpl');
    if (!fs.existsSync(tmplPath)) return;

    const content = fs.readFileSync(tmplPath, 'utf-8');
    const violations = checkHardcodedBranches(content);
    expect(violations).toHaveLength(0);
  });
});

// ─── strategies/ directory ───────────────────────────────────

describe('Project structure', () => {
  test('strategies/ directory exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'strategies'))).toBe(true);
  });

  test('.context/retros/ directory exists', () => {
    expect(fs.existsSync(path.join(ROOT, '.context', 'retros'))).toBe(true);
  });

  test('setup script is executable', () => {
    const setupPath = path.join(ROOT, 'setup');
    const stat = fs.statSync(setupPath);
    // Check owner execute bit
    expect(stat.mode & 0o100).toBeGreaterThan(0);
  });
});

// ─── gen-skill-docs freshness ────────────────────────────────

describe('Generated SKILL.md freshness check', () => {
  test('root SKILL.md has no unresolved placeholders', () => {
    const skillPath = path.join(ROOT, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    const unresolved = content.match(/\{\{(\w+)\}\}/g);
    expect(unresolved).toBeNull();
  });

  test('root SKILL.md has AUTO-GENERATED header', () => {
    const skillPath = path.join(ROOT, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return;
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('AUTO-GENERATED');
  });
});

// ─── Package.json consistency ────────────────────────────────

describe('package.json is NWKStack-configured', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

  test('package name is nwkstack', () => {
    expect(pkg.name).toBe('nwkstack');
  });

  test('has gen:skill-docs script', () => {
    expect(pkg.scripts['gen:skill-docs']).toBeTruthy();
  });

  test('has test script', () => {
    expect(pkg.scripts['test']).toBeTruthy();
  });

  test('has no browse binary', () => {
    expect(pkg.bin).toBeFalsy();
  });

  test('has no playwright dependency', () => {
    expect(pkg.dependencies?.playwright).toBeFalsy();
  });
});
