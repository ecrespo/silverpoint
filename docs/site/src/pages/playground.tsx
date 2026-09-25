import { useId, useState } from 'react';
import { CHARTS } from '../charts';

/** The fixture sizes of Data Model §5. */
const SIZES = { sm: [240, 120], md: [320, 150], lg: [640, 300] } as const;
type Size = keyof typeof SIZES;

/** The ground playground (PRD §5.1): every rendering choice a consumer makes, one control each. */
export function Playground() {
  const [chart, setChart] = useState('LineChart');
  const [substrate, setSubstrate] = useState('cream');
  const [mode, setMode] = useState('ink');
  const [hatchFill, setHatchFill] = useState('tile');
  const [size, setSize] = useState<Size>('md');
  const [seed, setSeed] = useState(1592);
  const { Component } = CHARTS.find((c) => c.chart === chart) ?? CHARTS[0]!;
  const [width, height] = SIZES[size];
  const settings = { substrate, mode, hatchFill, seed, width, height };
  const code = `<${chart} substrate="${substrate}" mode="${mode}" hatchFill="${hatchFill}" seed={${seed}} width={${width}} height={${height}} />`;

  return (
    <>
      <h2>Ground playground</h2>
      <p>
        One chart, every rendering choice. The data never changes: only the substrate, the inking, the way tone is hatched,
        the size and the seed of the hand.
      </p>
      <form className="controls" onSubmit={(e) => e.preventDefault()}>
        <Choice label="Chart" value={chart} options={CHARTS.map((c) => c.chart)} onChange={setChart} />
        <Choice label="Substrate" value={substrate} options={['cream', 'green', 'blue', 'ochre']} onChange={setSubstrate} />
        <Choice label="Mode" value={mode} options={['ink', 'precision']} onChange={setMode} />
        <Choice label="Hatch fill" value={hatchFill} options={['tile', 'per-shape']} onChange={setHatchFill} />
        <Choice label="Size" value={size} options={Object.keys(SIZES)} onChange={(v) => setSize(v as Size)} />
        <Seed value={seed} onChange={setSeed} />
      </form>
      <div className="card" data-size={size}>
        <Component key={`${chart}-${size}`} title={chart} footerRight="silverpoint" {...settings} />
      </div>
      <h3>In your code</h3>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <p>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </p>
  );
}

function Seed({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const id = useId();
  return (
    <p>
      <label htmlFor={id}>Seed</label>
      <input id={id} type="number" inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </p>
  );
}
