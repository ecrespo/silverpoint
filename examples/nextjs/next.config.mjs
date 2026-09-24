import { fileURLToPath } from 'node:url';

/** Plain configuration: the packages are consumed as published (REQ-103). */
export default {
  // The workspace packages are symlinked from the monorepo root.
  turbopack: { root: fileURLToPath(new URL('../..', import.meta.url)) },
};
