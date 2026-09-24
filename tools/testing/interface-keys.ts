import ts from 'typescript';

/** Property names of an exported interface, inherited ones included, read with the TypeScript compiler. */
export function interfaceKeys(file: string, name: string): string[] {
  const program = ts.createProgram([file], { strict: true, noEmit: true, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  if (!source) throw new Error(`Cannot read ${file}`);
  const symbol = checker.getExportsOfModule(checker.getSymbolAtLocation(source) as ts.Symbol).find((s) => s.name === name);
  if (!symbol) throw new Error(`${name} not exported from ${file}`);
  return checker.getDeclaredTypeOfSymbol(symbol).getProperties().map((p) => p.name).sort();
}
