import { CHARTS } from '../charts';

/** Every chart of the catalog with its demo data (REQ-093), each linking to its own page. */
export function Gallery() {
  return (
    <>
      <h2>Gallery</h2>
      <p>The {CHARTS.length} charts, each drawn with its demo dataset: what a chart shows before it is given data.</p>
      <ul className="gallery">
        {CHARTS.map(({ chart, slug, Component }) => (
          <li key={chart} className="card">
            <Component title={chart} footerRight="silverpoint" />
            <a href={`#/chart/${slug}`}>
              {chart} <span className="visually-hidden">— props and usage</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
