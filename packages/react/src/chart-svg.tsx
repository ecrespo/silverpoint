import type { PathView, SvgView } from '@silverpoint/core';

function Path({ path }: { readonly path: PathView }) {
  return (
    <path
      d={path.d}
      part={path.part}
      data-role={path.role}
      data-paint={path.paint}
      data-dash={path.dash ?? undefined}
      fill={path.fill ?? undefined}
    />
  );
}

/** Writes the core's SVG view one field to one attribute; computes nothing (Art. 2). */
export function ChartSvg({ view }: { readonly view: SvgView }) {
  const { svg } = view;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={svg.viewBox}
      width={svg.width}
      height={svg.height}
      className={svg.class}
      data-substrate={svg.substrate}
      data-mode={svg.mode}
      role={svg.role}
      aria-labelledby={svg.labelledby}
    >
      <title id={view.title.id}>{view.title.text}</title>
      <desc id={view.desc.id}>{view.desc.text}</desc>
      {view.patterns.length > 0 && (
        <defs>
          {view.patterns.map((pattern) => (
            <pattern
              key={pattern.id}
              id={pattern.id}
              width={pattern.width}
              height={pattern.height}
              patternUnits="userSpaceOnUse"
              patternTransform={pattern.transform}
            >
              {pattern.paths.map((path, index) => (
                <Path key={index} path={path} />
              ))}
            </pattern>
          ))}
        </defs>
      )}
      {view.paths.map((path, index) => (
        <Path key={index} path={path} />
      ))}
      {view.texts.map((text, index) => (
        <text key={index} x={text.x} y={text.y} part={text.part} data-kind={text.kind} textAnchor={text.anchor}>
          {text.text}
        </text>
      ))}
    </svg>
  );
}
