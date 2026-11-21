/**
 * The standalone files' SHA-384 digests (REQ-651), for code that writes a `<script integrity>` —
 * the MCP's `generate_code { framework: 'html' }` (REQ-662). The build writes the values into
 * `dist` after hashing the files (`scripts/after-build.mjs`); read from the sources, before a build,
 * the record holds only its marker and every lookup is `undefined`.
 */
export const STANDALONE_INTEGRITY: Readonly<Record<string, string>> = { __sp_integrity__: '' };
