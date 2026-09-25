/**
 * The 10-minute quickstart (PRD §4.2), one per framework. The site prints these, and the
 * quickstart test (T-098) follows them literally in a fresh app, so what a reader copies is what
 * CI proved works.
 */
export interface Quickstart {
  readonly framework: 'React' | 'Vue' | 'Angular';
  /** The command that creates a fresh app. */
  readonly create: string;
  /** The command that installs silverpoint into it. */
  readonly install: string;
  /** The files to replace in the fresh app, and what to put in each. */
  readonly files: readonly { readonly path: string; readonly code: string }[];
}

const DATA = `[
  { hour: '00', hits: 18 },
  { hour: '04', hits: 11 },
  { hour: '08', hits: 42 },
  { hour: '12', hits: 64 },
  { hour: '16', hits: 57 },
  { hour: '20', hits: 30 },
]`;

export const QUICKSTARTS: readonly Quickstart[] = [
  {
    framework: 'React',
    create: 'npm create vite@latest my-charts -- --template react-ts',
    install: 'npm install @silverpoint/react @silverpoint/grounds @silverpoint/fonts',
    files: [
      {
        path: 'src/App.tsx',
        code: `import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { LineChart } from '@silverpoint/react/line-chart';

const data = ${DATA};

export default function App() {
  return (
    <div style={{ width: 480 }}>
      <LineChart data={data} xKey="hour" valueKey="hits" title="Hits per hour" />
    </div>
  );
}
`,
      },
    ],
  },
  {
    framework: 'Vue',
    create: 'npm create vite@latest my-charts -- --template vue-ts',
    install: 'npm install @silverpoint/vue @silverpoint/grounds @silverpoint/fonts',
    files: [
      {
        path: 'src/App.vue',
        code: `<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { SpLineChart } from '@silverpoint/vue/line-chart';

const data = ${DATA};
</script>

<template>
  <div style="width: 480px">
    <SpLineChart :data="data" x-key="hour" value-key="hits" title="Hits per hour" />
  </div>
</template>
`,
      },
    ],
  },
  {
    framework: 'Angular',
    create: 'npx @angular/cli@22 new my-charts --defaults --skip-git',
    install: 'npm install @silverpoint/angular @silverpoint/grounds @silverpoint/fonts',
    files: [
      {
        // The Angular CLI loads global styles from this file (angular.json "styles").
        path: 'src/styles.css',
        code: `@import '@silverpoint/fonts/fonts.css';
@import '@silverpoint/grounds/styles.css';
`,
      },
      {
        path: 'src/app/app.ts',
        code: `import { Component } from '@angular/core';
import { SpLineChart } from '@silverpoint/angular/line-chart';

@Component({
  selector: 'app-root',
  imports: [SpLineChart],
  template: \`
    <div style="width: 480px">
      <sp-line-chart [data]="data" xKey="hour" valueKey="hits" title="Hits per hour" />
    </div>
  \`,
})
export class App {
  protected readonly data = ${DATA};
}
`,
      },
    ],
  },
];
