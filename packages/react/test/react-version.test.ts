import { version } from 'react';
import { version as domVersion } from 'react-dom';
import { expect, test } from 'vitest';

/**
 * PRD §6 supports React 18.2+ and 19; the whole suite runs twice, once per major (T-090). This
 * guards that the second run is on React 18 in fact, react-dom included, not on an alias that
 * silently resolved the workspace's React 19.
 */
test('PRD §6 · the suite runs on the React major its project names', ({ task }) => {
  const major = task.file.projectName === 'react-18' ? '18' : '19';
  expect(version.split('.')[0]).toBe(major);
  expect(domVersion.split('.')[0]).toBe(major);
});
