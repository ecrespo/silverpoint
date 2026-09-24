#!/usr/bin/env node
/**
 * spec-check — structural validation of the Spec-Driven Design corpus under specs/.
 *
 * The artifacts are a graph held together by identifiers (REQ-NNN, T-NNN, DD-NNN,
 * SPNNN) and by version numbers that documents cite about each other. Nothing in
 * Markdown enforces that graph, so it degrades silently: a task is renumbered and a
 * disposition row still names the old number, a framework is added and a dependency
 * list still names two adapters, a document is amended and its siblings still cite the
 * previous version. Every one of those has happened. This script is the gate that
 * catches them.
 *
 * Zero dependencies, plain Node ESM, same shape as tools/lint-rules/check-deps.mjs.
 * Exits 1 on any finding so it can run in `pnpm lint` and in CI (T-002).
 *
 * Usage:  node tools/spec-check/spec-check.mjs [--json]
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPECS = join(ROOT, 'specs');

/** Documents that carry a version header and may be cited by their siblings. */
const VERSIONED = [
  'constitution',
  'prd',
  'api-spec',
  'technical-design',
  'data-model',
  'implementation-plan',
];
/** Documents read for identifier references but not themselves versioned. */
const UNVERSIONED = ['tasks', 'analyze'];

const findings = [];
const report = (severity, check, message, where) =>
  findings.push({ severity, check, message, where });

const read = (name) => {
  const path = join(SPECS, `${name}.md`);
  if (!existsSync(path)) {
    report('error', 'corpus', `specs/${name}.md is missing`, `specs/${name}.md`);
    return null;
  }
  return readFileSync(path, 'utf8');
};

const docs = {};
for (const name of [...VERSIONED, ...UNVERSIONED]) {
  const text = read(name);
  if (text !== null) docs[name] = text;
}

/** Line number (1-based) of the first occurrence of `needle` in `text`. */
const lineOf = (text, needle) => {
  const index = text.indexOf(needle);
  if (index < 0) return 0;
  return text.slice(0, index).split('\n').length;
};

// ---------------------------------------------------------------------------
// 1. Requirements: declared exactly once, in the PRD's requirement tables.
// ---------------------------------------------------------------------------

/** A declaration is a table row whose first cell is the identifier alone. */
const declaredRequirements = new Map(); // REQ-NNN -> count
for (const match of (docs.prd ?? '').matchAll(/^\|\s*\*{0,2}(REQ-\d{3})\*{0,2}\s*\|/gm)) {
  const id = match[1];
  declaredRequirements.set(id, (declaredRequirements.get(id) ?? 0) + 1);
}
for (const [id, count] of declaredRequirements) {
  if (count > 1) {
    report('error', 'req-unique', `${id} is declared ${count} times in the PRD`, 'specs/prd.md');
  }
}
const requirements = new Set(declaredRequirements.keys());
if (requirements.size === 0) {
  report('error', 'req-unique', 'no requirements found in the PRD', 'specs/prd.md');
}

// ---------------------------------------------------------------------------
// 2. Tasks: contiguous numbering from T-001, each defined once.
// ---------------------------------------------------------------------------

const taskOrder = [];
for (const match of (docs.tasks ?? '').matchAll(/^\*\*\[[ x]\]\s*(T-\d{3})\s*·\s*(.+?)\*\*/gm)) {
  taskOrder.push({ id: match[1], title: match[2] });
}
const tasks = new Map(taskOrder.map((t) => [t.id, t.title]));
if (taskOrder.length !== tasks.size) {
  report('error', 'task-unique', 'a task identifier is defined more than once', 'specs/tasks.md');
}
taskOrder.forEach((task, index) => {
  const expected = `T-${String(index + 1).padStart(3, '0')}`;
  if (task.id !== expected) {
    report(
      'error',
      'task-contiguous',
      `expected ${expected} in document order, found ${task.id} — renumbering left a gap or a duplicate`,
      `specs/tasks.md:${lineOf(docs.tasks, task.id)}`,
    );
  }
});

// ---------------------------------------------------------------------------
// 3. Task dependencies resolve, and no task depends on itself or on a later task.
// ---------------------------------------------------------------------------

const position = new Map(taskOrder.map((t, i) => [t.id, i]));
{
  const text = docs.tasks ?? '';
  const lines = text.split('\n');
  let current = null;
  lines.forEach((line, index) => {
    const header = line.match(/^\*\*\[[ x]\]\s*(T-\d{3})/);
    if (header) current = header[1];
    const deps = line.match(/^-\s*\*\*Depends on\*\*:\s*(.+)$/);
    if (!deps || current === null) return;
    for (const id of deps[1].match(/T-\d{3}/g) ?? []) {
      const where = `specs/tasks.md:${index + 1}`;
      if (!tasks.has(id)) {
        report('error', 'task-deps', `${current} depends on ${id}, which does not exist`, where);
      } else if (id === current) {
        report('error', 'task-deps', `${current} depends on itself`, where);
      } else if (position.get(id) > position.get(current)) {
        report('warn', 'task-deps', `${current} depends on ${id}, which is defined later`, where);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 4. Every identifier referenced anywhere resolves to a definition.
// ---------------------------------------------------------------------------

const designDecisions = new Set(
  [...(docs['technical-design'] ?? '').matchAll(/^#{2,4}\s*(DD-\d{3})\b/gm)].map((m) => m[1]),
);
const diagnostics = new Set(
  [...(docs['api-spec'] ?? '').matchAll(/^\|\s*`?(SP\d{3})`?\s*\|/gm)].map((m) => m[1]),
);

const universes = [
  { pattern: /REQ-\d{3}/g, known: requirements, label: 'requirement', home: 'specs/prd.md' },
  { pattern: /T-\d{3}/g, known: new Set(tasks.keys()), label: 'task', home: 'specs/tasks.md' },
  { pattern: /DD-\d{3}/g, known: designDecisions, label: 'design decision', home: 'specs/technical-design.md' },
  { pattern: /SP\d{3}/g, known: diagnostics, label: 'diagnostic', home: 'specs/api-spec.md' },
];

for (const [name, text] of Object.entries(docs)) {
  text.split('\n').forEach((line, index) => {
    for (const { pattern, known, label, home } of universes) {
      if (known.size === 0) continue; // the home document is missing; already reported
      for (const id of new Set(line.match(pattern) ?? [])) {
        if (known.has(id)) continue;
        report(
          'error',
          'dangling-ref',
          `${id} is referenced but no such ${label} is defined in ${home}`,
          `specs/${name}.md:${index + 1}`,
        );
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 5. Versions: each document declares one, and siblings cite the declared value.
// ---------------------------------------------------------------------------

const versions = new Map();
for (const name of VERSIONED) {
  const text = docs[name];
  if (!text) continue;
  // Three spellings in use: a metadata row `| **Version** | 1.3 |`, the API Spec's
  // `| **API version** | v1.5 |` (Analyze finding B-01), and the Constitution's
  // blockquote `> Version 1.4 · Ratified: …`.
  const match =
    text.match(/^\|\s*\*{0,2}(?:API version|Version)\*{0,2}\s*\|\s*v?([0-9]+\.[0-9]+)\s*\|/im) ??
    text.match(/^>\s*Version\s+v?([0-9]+\.[0-9]+)/im);
  if (!match) {
    report('error', 'version-declared', `${name}.md declares no version`, `specs/${name}.md`);
    continue;
  }
  versions.set(name, match[1]);
}

const citation = new RegExp(
  `\\[?\`?(${VERSIONED.join('|')})\\.md\`?\\]?(?:\\([^)]*\\))?\\s*v([0-9]+\\.[0-9]+)`,
  'g',
);
for (const [name, text] of Object.entries(docs)) {
  text.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(citation)) {
      const [, cited, claimed] = match;
      const actual = versions.get(cited);
      if (actual === undefined || actual === claimed) continue;
      report(
        'error',
        'version-drift',
        `cites ${cited}.md v${claimed}, but that document declares v${actual}`,
        `specs/${name}.md:${index + 1}`,
      );
    }
  });
}

// ---------------------------------------------------------------------------
// 6. Traceability: every task names at least one requirement, and the
//    traceability table agrees with the per-task REQ lines.
// ---------------------------------------------------------------------------

{
  const text = docs.tasks ?? '';
  const blocks = text.split(/^(?=\*\*\[[ x]\]\s*T-\d{3})/m);
  const fromBlocks = new Map();
  for (const block of blocks) {
    const id = block.match(/^\*\*\[[ x]\]\s*(T-\d{3})/)?.[1];
    if (!id) continue;
    const line = block.match(/^-\s*\*\*REQ\*\*:\s*(.+)$/m);
    const ids = new Set(line ? line[1].match(/REQ-\d{3}/g) ?? [] : []);
    fromBlocks.set(id, ids);
    if (ids.size === 0) {
      report('warn', 'traceability', `${id} names no requirement`, `specs/tasks.md:${lineOf(text, id)}`);
    }
  }

  // A matrix row maps one requirement list to one OR MORE tasks.
  const fromTable = new Map();
  for (const match of text.matchAll(/^\|\s*((?:REQ-\d{3}[,\s]*)+)\|\s*((?:T-\d{3}[,\s]*)+)\|/gm)) {
    const ids = match[1].match(/REQ-\d{3}/g) ?? [];
    for (const task of match[2].match(/T-\d{3}/g) ?? []) {
      fromTable.set(task, new Set([...(fromTable.get(task) ?? []), ...ids]));
    }
  }
  for (const [task, tableIds] of fromTable) {
    const blockIds = fromBlocks.get(task);
    if (!blockIds) continue;
    for (const id of tableIds) {
      if (!blockIds.has(id)) {
        report(
          'error',
          'traceability',
          `the traceability table maps ${id} to ${task}, but ${task}'s own REQ line does not name it`,
          'specs/tasks.md',
        );
      }
    }
    for (const id of blockIds) {
      if (!tableIds.has(id)) {
        report(
          'warn',
          'traceability',
          `${task} names ${id} but the traceability table does not map it there`,
          'specs/tasks.md',
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warn');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ findings, errors: errors.length, warnings: warnings.length }, null, 2));
} else {
  const counts = {
    requirements: requirements.size,
    tasks: tasks.size,
    decisions: designDecisions.size,
    diagnostics: diagnostics.size,
  };
  console.log(
    `spec-check · ${counts.requirements} requirements · ${counts.tasks} tasks · ` +
      `${counts.decisions} design decisions · ${counts.diagnostics} diagnostics`,
  );
  console.log(
    `versions · ${[...versions].map(([n, v]) => `${n} v${v}`).join(' · ') || 'none declared'}`,
  );
  console.log('');
  if (findings.length === 0) {
    console.log('No findings. The corpus is internally consistent.');
  } else {
    for (const f of findings) {
      const tag = f.severity === 'error' ? 'ERROR' : 'warn ';
      console.log(`${tag} [${f.check}] ${f.where}\n      ${f.message}`);
    }
    console.log('');
    console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  }
}

process.exit(errors.length > 0 ? 1 : 0);
