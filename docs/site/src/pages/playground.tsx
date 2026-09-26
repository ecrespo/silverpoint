import { useId, useState } from 'react';
import { CHARTS } from '../charts';

/** The built-in grounds and their substrates (API Spec §6); the first substrate is the one shown. */
const GROUNDS = { silverpoint: ['cream', 'green', 'blue', 'ochre'], cyanotype: ['prussian'] } as const;
type GroundName = keyof typeof GROUNDS;

/** The fixture sizes of Data Model §5. */
const SIZES = { sm: [240, 120], md: [320, 150], lg: [640, 300] } as const;
type Size = keyof typeof SIZES;

/** The ground playground (PRD §5.1): every rendering choice a consumer makes, one control each. */
export function Playground() {
  const [chart, setChart] = useState('LineChart');
  const [ground, setGround] = useState<GroundName>('silverpoint');
  const [substrate, setSubstrate] = useState<string>('cream');
  const [mode, setMode] = useState('ink');
  const [hatchFill, setHatchFill] = useState('tile');
  const [size, setSize] = useState<Size>('md');
  const [seed, setSeed] = useState(1592);
  const { Component } = CHARTS.find((c) => c.chart === chart) ?? CHARTS[0]!;
  const [width, height] = SIZES[size];
  // Under `weight` (cyanotype) nothing is hatched, so the hatch fill is not a choice (REQ-028).
  const hatches = ground === 'silverpoint';
  const settings = { ground, substrate, mode, ...(hatches ? { hatchFill } : {}), seed, width, height };
  const code = `<${chart} ground="${ground}" substrate="${substrate}" mode="${mode}"${hatches ? ` hatchFill="${hatchFill}"` : ''} seed={${seed}} width={${width}} height={${height}} />`;
  const chooseGround = (next: string) => {
    setGround(next as GroundName);
    setSubstrate(GROUNDS[next as GroundName][0]);
  };

  return (
    <>
      <h2>Ground playground</h2>
      <p>
        One chart, every rendering choice. The data never changes: only the ground, the substrate, the inking, the way tone
        is hatched, the size and the seed of the hand. <code>silverpoint</code> builds tone by hatching;{' '}
        <code>cyanotype</code>, a white line on Prussian blue, builds it by the weight of the line.
      </p>
      <form className="controls" onSubmit={(e) => e.preventDefault()}>
        <Choice label="Chart" value={chart} options={CHARTS.map((c) => c.chart)} onChange={setChart} />
        <Choice label="Ground" value={ground} options={Object.keys(GROUNDS)} onChange={chooseGround} />
        <Choice label="Substrate" value={substrate} options={GROUNDS[ground]} onChange={setSubstrate} />
        <Choice label="Mode" value={mode} options={['ink', 'precision']} onChange={setMode} />
        <Choice label="Hatch fill" value={hatchFill} options={['tile', 'per-shape']} onChange={setHatchFill} disabled={!hatches} />
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

function Choice({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <p>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
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
