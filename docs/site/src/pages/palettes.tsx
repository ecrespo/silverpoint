import { PALETTE_NAMES, PALETTES } from '@silverpoint/core/palettes';
import { UI_DEMOS } from '@silverpoint/core/ui-demos';
import { SilverpointProvider } from '@silverpoint/react';
import { LineChart } from '@silverpoint/react/line-chart';
import { SpCard, SpProgress, SpTable, type SpProgressProps, type SpTableProps } from '@silverpoint/react/ui';
import reference from '../../generated/props.json';
import { PropsTable } from './ui';

const TITLES: Readonly<Record<string, string>> = { silverpoint: 'Silverpoint', sanguine: 'Sanguine', sepia: 'Sepia', ironGall: 'Iron gall', verdigris: 'Verdigris', indigo: 'Indigo' };

/** A demo's props without its id: each preset draws its own copy. */
const demo = <T,>(slug: string, state: string) => {
  const { id: _id, ...props } = (UI_DEMOS[slug]?.[state] ?? {}) as Record<string, unknown>;
  return props as T;
};
const table = demo<Omit<SpTableProps, 'id'>>('table', 'plain');
const progress = demo<Omit<SpProgressProps, 'id'>>('progress', 'line');

const USAGE = `import { sanguine } from '@silverpoint/core/palettes';
import { SilverpointProvider } from '@silverpoint/react';

<SilverpointProvider palette={sanguine}>
  {/* every chart and component below draws in sanguine */}
</SilverpointProvider>

// One component, or one field of a preset:
<LineChart palette={{ ...sanguine, ink: '#5A1F14' }} />`;

/** The six presets, each over a chart, a Card holding a Progress and a Table, and the Palette reference (REQ-521). */
export function PalettesPage() {
  return (
    <>
      <h2>Palettes</h2>
      <p>
        A palette recolours the ground: the substrate, the inks, the rules, the text and the focus ring. The six presets are
        computed, not chosen by eye: every text and UI pair holds its WCAG contrast on its own substrate, and{' '}
        <code>checkPalette</code> checks a palette of yours the same way. A provider sets one for everything below it; a nested
        provider or a <code>palette</code> prop overrides it field by field.
      </p>
      <pre>
        <code>{USAGE}</code>
      </pre>
      <ul className="gallery gallery-wide">
        {PALETTE_NAMES.map((key) => (
          <li key={key} className="card" data-preset={key} aria-labelledby={`preset-${key}`}>
            <h3 id={`preset-${key}`}>{TITLES[key] ?? key}</h3>
            <SilverpointProvider palette={PALETTES[key]}>
              <LineChart id={`palette-${key}-chart`} title="Throughput per hour" footerRight="silverpoint" />
              <SpCard id={`palette-${key}-card`} title="Delivered this week" headingLevel={4}>
                <SpProgress {...progress} id={`palette-${key}-progress`} />
              </SpCard>
              <SpTable {...table} id={`palette-${key}-table`} />
            </SilverpointProvider>
            <pre>
              <code>{`<SilverpointProvider palette={${key}}>`}</code>
            </pre>
          </li>
        ))}
      </ul>
      <h3 id="palette-fields">The Palette fields</h3>
      <PropsTable className="props" labelledBy="palette-fields" props={reference.palette} />
      <p>
        Every field is optional: the ground's own value fills what a palette leaves out. Vue takes the same object on its{' '}
        <code>SilverpointProvider</code>; Angular on <code>provideSilverpoint({'{'} palette {'}'})</code>.
      </p>
    </>
  );
}
