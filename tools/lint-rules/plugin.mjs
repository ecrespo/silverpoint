/**
 * In-house ESLint rules that turn Constitution Art. 2 and Art. 4 into CI gates.
 *
 * - `no-nondeterminism` — REQ-004: no Math.random, Date.now, performance.now or
 *   argument-less `new Date()` on the render path.
 * - `adapter-boundary`  — REQ-027, REQ-102, REQ-106: adapters import neither `d3-*` nor the
 *   inking engine, and declare no maths of their own.
 * - `core-allowlist`    — REQ-162: the core imports only relative modules and the runtime
 *   allowlist of Technical Design §5.3.
 * - `dashboard-no-layout-maths` — REQ-201, Art. 2: an adapter's dashboard writes the numbers of
 *   the core's model and computes none: no arithmetic, no numeric literal outside a type.
 */

/** Runtime allowlist of `@silverpoint/core` (TD §5.3). */
export const CORE_ALLOWLIST = Object.freeze(['d3-scale', 'd3-shape', 'd3-chord']);

const INKING_ENGINE = /^roughjs(\/|$)/;
const D3 = /^d3-/;

/** Global objects whose listed members are sources of non-determinism (Art. 4). */
const NONDETERMINISTIC = {
  Math: ['random'],
  Date: ['now'],
  performance: ['now'],
  crypto: ['getRandomValues', 'randomUUID'],
};
/** Names through which a script reaches the global object. */
const GLOBAL_OBJECTS = ['globalThis', 'window', 'self', 'global'];

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
    // TypeScript's `import x = require('m')` and the type query `import('m').T`.
    TSImportEqualsDeclaration(node) {
      if (node.moduleReference.type === 'TSExternalModuleReference') check(node, node.moduleReference.expression);
    },
    TSImportType: (node) => check(node, node.argument?.literal ?? node.argument),
  };
}

/** Static name of a member access: `a.b` and `a['b']` both give `b`. */
function propertyName(node) {
  if (!node.computed && node.property.type === 'Identifier') return node.property.name;
  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string') {
    return node.property.value;
  }
  return undefined;
}

/**
 * Builds a resolver telling whether an Identifier refers to the global binding of that name.
 * Template expressions of a Vue SFC live outside the scope manager; there every free name is
 * a global the template compiler whitelists, so they count as global.
 */
function globalResolver(context, inTemplate) {
  return (identifier) => {
    if (inTemplate) return true;
    let scope = context.sourceCode.getScope(identifier);
    while (scope) {
      const variable = scope.set.get(identifier.name);
      if (variable) return variable.defs.length === 0;
      scope = scope.upper;
    }
    return true;
  };
}

/**
 * Name of the global object an expression denotes — `Math`, `globalThis.Math`,
 * `window['Date']` — or undefined.
 */
function globalObject(node, isGlobal, names) {
  if (node.type === 'Identifier') return names.includes(node.name) && isGlobal(node) ? node.name : undefined;
  if (node.type === 'MemberExpression') {
    const name = propertyName(node);
    const through = node.object.type === 'Identifier' && GLOBAL_OBJECTS.includes(node.object.name) && isGlobal(node.object);
    if (through && name && names.includes(name)) return name;
  }
  return undefined;
}

/** True when `node` is only the object of a member access, the one legitimate use. */
function isMemberObject(node) {
  return node.parent?.type === 'MemberExpression' && node.parent.object === node;
}

function nondeterminismVisitor(context, inTemplate) {
  const isGlobal = globalResolver(context, inTemplate);
  const names = Object.keys(NONDETERMINISTIC);
  const report = (node, what) => context.report({ node, messageId: 'forbidden', data: { what } });
  const check = (node) => {
    const object = globalObject(node, isGlobal, names);
    if (!object) return;
    const parent = node.parent;
    if (isMemberObject(node)) {
      const member = propertyName(parent);
      if (member && NONDETERMINISTIC[object].includes(member)) report(parent, `${object}.${member}`);
      return;
    }
    if (object === 'Date' && parent?.type === 'NewExpression' && parent.callee === node) {
      const [first] = parent.arguments;
      const empty = parent.arguments.length === 0 || (first?.type === 'Identifier' && first.name === 'undefined');
      if (empty) report(parent, 'new Date() without a date');
      return;
    }
    if (object === 'Date' && parent?.type === 'CallExpression' && parent.callee === node) {
      report(parent, 'Date()');
      return;
    }
    if (object === 'Date' && parent?.type === 'BinaryExpression' && parent.operator === 'instanceof') return;
    // Destructuring or aliasing the object would hide every later call from this rule.
    report(node, `aliasing ${object}`);
  };
  return {
    Identifier(node) {
      if (node.parent?.type === 'MemberExpression' && node.parent.property === node && !node.parent.computed) return;
      if (node.parent?.type === 'Property' && node.parent.key === node && node.parent.parent?.type !== 'ObjectPattern') return;
      if (node.parent?.type === 'MemberExpression' && GLOBAL_OBJECTS.includes(node.name)) return;
      check(node);
    },
    MemberExpression(node) {
      if (globalObject(node, isGlobal, names)) check(node);
    },
  };
}

/** Applies `build(inTemplate)` to the script and, in a Vue SFC, to the template as well. */
function withTemplate(context, build) {
  const script = build(false);
  const services = context.sourceCode.parserServices;
  if (typeof services?.defineTemplateBodyVisitor === 'function') {
    return services.defineTemplateBodyVisitor(build(true), script);
  }
  return script;
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
    return withTemplate(context, (inTemplate) => nondeterminismVisitor(context, inTemplate));
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
    const maths = (inTemplate) => {
      const isGlobal = globalResolver(context, inTemplate);
      return {
        Identifier(node) {
          if (node.parent?.type === 'MemberExpression' && node.parent.property === node && !node.parent.computed) return;
          if (node.name !== 'Math' || !isGlobal(node)) return;
          const name = isMemberObject(node) ? (propertyName(node.parent) ?? '[computed]') : '(alias)';
          context.report({ node: node.parent ?? node, messageId: 'maths', data: { name } });
        },
      };
    };
    const imports = onImport((node, source) => {
      if (D3.test(source)) context.report({ node, messageId: 'd3', data: { source } });
      if (INKING_ENGINE.test(source)) context.report({ node, messageId: 'ink', data: { source } });
    });
    return withTemplate(context, (inTemplate) => (inTemplate ? maths(true) : { ...imports, ...maths(false) }));
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

const ARITHMETIC = new Set(['+', '-', '*', '/', '%', '**']);

const dashboardNoLayoutMaths = {
  meta: {
    type: 'problem',
    docs: { description: 'A dashboard adapter writes the numbers of the resolved model and computes none (REQ-201, Art. 2).' },
    messages: {
      arithmetic: 'Dashboard adapters compute no sizes (REQ-201, Art. 2): `{{operator}}` belongs in @silverpoint/core (resolveDashboard, cellChartBox).',
      literal: 'Dashboard adapters write no numbers of their own (REQ-201, Art. 2): {{value}} must come from the resolved model.',
    },
    schema: [],
  },
  create(context) {
    const arithmetic = (node, operator) => context.report({ node, messageId: 'arithmetic', data: { operator } });
    return {
      BinaryExpression(node) {
        if (ARITHMETIC.has(node.operator)) arithmetic(node, node.operator);
      },
      AssignmentExpression(node) {
        if (node.operator !== '=' && ARITHMETIC.has(node.operator.slice(0, -1))) arithmetic(node, node.operator);
      },
      UpdateExpression: (node) => arithmetic(node, node.operator),
      UnaryExpression(node) {
        if (node.operator === '-' || node.operator === '+') arithmetic(node, `unary ${node.operator}`);
      },
      Literal(node) {
        // A number in a type (`2 | 3 | 4`) describes a value; it writes none.
        if (typeof node.value === 'number' && node.parent?.type !== 'TSLiteralType') {
          context.report({ node, messageId: 'literal', data: { value: String(node.value) } });
        }
      },
    };
  },
};

export default {
  meta: { name: '@silverpoint/lint-rules' },
  rules: {
    'no-nondeterminism': noNondeterminism,
    'adapter-boundary': adapterBoundary,
    'core-allowlist': coreAllowlist,
    'dashboard-no-layout-maths': dashboardNoLayoutMaths,
  },
};
