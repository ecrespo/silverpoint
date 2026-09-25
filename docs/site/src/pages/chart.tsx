import reference from '../../generated/props.json';
import { chartBySlug } from '../charts';

interface PropDoc {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
  readonly doc: string;
}

/** One chart: drawn large, its own props read from the types, and the props every chart takes. */
export function ChartPage({ slug }: { slug: string }) {
  const entry = chartBySlug(slug);
  if (!entry) {
    return (
      <>
        <h2>No such chart</h2>
        <p>
          <a href="#/gallery">Back to the gallery</a>
        </p>
      </>
    );
  }
  const { chart, Component } = entry;
  const own = (reference.charts.find((c) => c.chart === chart)?.own ?? []) as readonly PropDoc[];
  return (
    <>
      <h2>{chart}</h2>
      <div className="card card-lg">
        <Component title={chart} footerRight="silverpoint" width={640} height={300} />
      </div>
      <h3 id="own-props">Its own props</h3>
      <PropsTable className="props" labelledBy="own-props" props={own} />
      <h3 id="common-props">Props every chart takes</h3>
      <PropsTable className="props-common" labelledBy="common-props" props={reference.common as readonly PropDoc[]} />
      <p>
        <a href="#/gallery">Back to the gallery</a>
      </p>
    </>
  );
}

function PropsTable({ className, labelledBy, props }: { className: string; labelledBy: string; props: readonly PropDoc[] }) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-labelledby={labelledBy}>
      <table className={className}>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <th scope="row">
                <code>
                  {p.name}
                  {p.optional ? '?' : ''}
                </code>
              </th>
              <td>
                <code>{p.type}</code>
              </td>
              <td>{p.doc || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
