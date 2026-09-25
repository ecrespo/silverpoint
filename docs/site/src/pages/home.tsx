import { LineChart } from '@silverpoint/react/line-chart';
import { QUICKSTARTS } from '../quickstart';

/** The front page: what silverpoint is, and the quickstart for each framework (PRD §4.2). */
export function Home() {
  return (
    <>
      <h1>silverpoint</h1>
      <p className="lede">
        Charts for React, Vue and Angular drawn in the manner of Renaissance silverpoint: a toned ground, a fine line, tone
        built from hatching, and white heightening for the live value. The irregularity lives in the ornament only: the
        geometry of the data is exact, and every chart has a <code>precision</code> mode with inking switched off.
      </p>
      <div className="card">
        <LineChart title="Throughput per hour" badge="Live" footerLeft="00–22 h" footerRight="silverpoint" />
      </div>

      <h2>Quickstart</h2>
      <p>
        Ten minutes from an empty folder to a chart. Every step below is run as written in CI. A bundler is required
        (Vite, Next.js or the Angular CLI): it removes the development warnings from production builds.
      </p>
      {QUICKSTARTS.map((q) => (
        <section key={q.framework} data-framework={q.framework} aria-labelledby={`qs-${q.framework}`}>
          <h3 id={`qs-${q.framework}`}>{q.framework}</h3>
          <ol>
            <li>
              Create an app: <Code>{q.create}</Code>
            </li>
            <li>
              Install silverpoint: <Code>{q.install}</Code>
            </li>
            {q.files.map((file) => (
              <li key={file.path}>
                Replace <code>{file.path}</code> with:
                <Code>{file.code}</Code>
              </li>
            ))}
            <li>
              Start it: <Code>{q.framework === 'Angular' ? 'npx ng serve' : 'npm run dev'}</Code>
            </li>
          </ol>
        </section>
      ))}
    </>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre tabIndex={0}>
      <code>{children}</code>
    </pre>
  );
}
