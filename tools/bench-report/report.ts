/** Prints the nightly benchmark report: `tsx tools/bench-report/report.ts <vitest-bench.json>`. */
import { readFileSync } from 'node:fs';
import { benchReport } from './bench-report';

const file = process.argv[2];
if (!file) throw new Error('usage: report.ts <vitest bench JSON>');
process.stdout.write(benchReport(JSON.parse(readFileSync(file, 'utf8'))).markdown);
