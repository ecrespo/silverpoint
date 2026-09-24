/**
 * In-house ESLint rules that turn Constitution Art. 2 and Art. 4 into CI gates.
 *
 * - `no-nondeterminism` — REQ-004: no Math.random, Date.now, performance.now or
 *   argument-less `new Date()` on the render path.
 * - `adapter-boundary`  — REQ-027, REQ-102, REQ-106: adapters import neither `d3-*` nor the
 *   inking engine, and declare no maths of their own.
 * - `core-allowlist`    — REQ-162: the core imports only relative modules and the runtime
 *   allowlist of Technical Design §5.3.
 */

/** Runtime allowlist of `@silverpoint/core` (TD §5.3). */
export const CORE_ALLOWLIST = Object.freeze(['d3-scale', 'd3-shape', 'd3-chord']);

const INKING_ENGINE = /^roughjs(\/|$)/;
const D3 = /^d3-/;
const NONDETERMINISTIC = [
  ['Math', 'random'],
  ['Date', 'now'],
  ['performance', 'now'],
];

/** Calls `report(node, source)` for every static, dynamic or `require` import. */
function onImport(report) {
  const check = (node, source) => {
    if (source?.type === 'Literal' && typeof source.value === 'string') report(node, source.value);
  };
  return {
    ImportDeclaration: (node) => check(node, node.source),
    ExportNamedDeclaration: (node) => check(node, node.source),
    ExportAllDeclaration: (node) => check(node, node.source),
    ImportExpression: (node) => check(node, node.source),
    CallExpression(node) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'require') check(node, node.arguments[0]);
    },
  };
}

function memberOf(node, object) {
  return node.object.type === 'Identifier' && node.object.name === object;
}

function propertyName(node) {
  return !node.computed && node.property.type === 'Identifier' ? node.property.name : undefined;
}

const noNondeterminism = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbids sources of non-determinism on the render path (REQ-004, Art. 4).' },
    messages: {
      forbidden:
        '{{what}} is a source of non-determinism and is forbidden on the render path (REQ-004, Constitution Art. 4). Derive it from the seed.',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        for (const [object, property] of NONDETERMINISTIC) {
          if (memberOf(node, object) && propertyName(node) === property) {
            context.report({ node, messageId: 'forbidden', data: { what: `${object}.${property}` } });
          }
        }
      },
      NewExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'Date' && node.arguments.length === 0) {
          context.report({ node, messageId: 'forbidden', data: { what: 'new Date()' } });
        }
      },
    };
  },
};

const adapterBoundary = {
  meta: {
    type: 'problem',
    docs: { description: 'Adapters translate geometry into nodes and compute nothing (Art. 2).' },
    messages: {
      d3: 'Adapters may not import "{{source}}": scales, arcs and paths are computed in @silverpoint/core (REQ-106, Art. 2).',
      ink: 'Adapters may not import the inking engine "{{source}}"; only the core resolves it (REQ-027, REQ-106).',
      maths: 'Adapters declare no maths of their own (REQ-102, Art. 2): move `Math.{{name}}` into @silverpoint/core.',
    },
    schema: [],
  },
  create(context) {
    return {
      ...onImport((node, source) => {
        if (D3.test(source)) context.report({ node, messageId: 'd3', data: { source } });
        if (INKING_ENGINE.test(source)) context.report({ node, messageId: 'ink', data: { source } });
      }),
      MemberExpression(node) {
        if (memberOf(node, 'Math')) {
          context.report({ node, messageId: 'maths', data: { name: propertyName(node) ?? '[computed]' } });
        }
      },
    };
  },
};

const coreAllowlist = {
  meta: {
    type: 'problem',
    docs: { description: 'The core imports only its runtime allowlist (REQ-162, TD §5.3).' },
    messages: {
      outside:
        '"{{source}}" is outside the runtime allowlist of @silverpoint/core ({{allowed}}). Adding one requires amending the Technical Design (REQ-162).',
    },
    schema: [],
  },
  create(context) {
    return onImport((node, source) => {
      if (source.startsWith('.') || CORE_ALLOWLIST.includes(source)) return;
      context.report({ node, messageId: 'outside', data: { source, allowed: CORE_ALLOWLIST.join(', ') } });
    });
  },
};

export default {
  meta: { name: '@silverpoint/lint-rules' },
  rules: {
    'no-nondeterminism': noNondeterminism,
    'adapter-boundary': adapterBoundary,
    'core-allowlist': coreAllowlist,
  },
};
