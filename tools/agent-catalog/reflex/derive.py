"""Derive `reflex-catalog.json` (Data Model §2.30) from a checkout of reflex-silverpoint-react.

Interim for T-231, until `scripts/export_catalog.py` lands there (T-230): the source is read with
`ast`, never imported, so neither Reflex nor the package needs to be installed.

    python3 -I tools/agent-catalog/reflex/derive.py <reflex-silverpoint-react checkout> \
        > tools/agent-catalog/reflex/reflex-catalog.json
"""

import ast
import json
import re
import subprocess
import sys
from pathlib import Path

MODULES = ("ui", "surfaces", "composed", "overlays", "timeline", "dashboard")


def camel(name: str) -> str:
    head, *rest = name.split("_")
    return head + "".join(part.title() for part in rest)


def literal(node: ast.AST) -> object:
    return ast.literal_eval(node)


def kwargs(call: ast.Call) -> dict[str, ast.AST]:
    return {k.arg: k.value for k in call.keywords if k.arg}


def prop_docs(node: ast.AST) -> list[dict[str, str]]:
    """`(PropDoc("x_key", "xKey", "Accessor<…>", "…"), …)` as name, js and type."""
    out = []
    for call in node.elts if isinstance(node, ast.Tuple) else []:
        name, js, kind = (literal(arg) for arg in call.args[:3])
        out.append({"name": name, "js": js, "type": kind})
    return out


def var_type(annotation: ast.AST, source: str) -> str | None:
    """`rx.Var[int]` → `int`; `rx.EventHandler[spec]` → `event`; anything else is not a prop."""
    if isinstance(annotation, ast.Subscript):
        head = ast.get_source_segment(source, annotation.value) or ""
        if head in ("rx.Var", "Var"):
            return ast.get_source_segment(source, annotation.slice) or ""
        if head in ("rx.EventHandler", "EventHandler"):
            return "event"
    return None


def class_props(cls: ast.ClassDef, source: str) -> list[dict[str, str]]:
    out = []
    for stmt in cls.body:
        if isinstance(stmt, ast.AnnAssign) and isinstance(stmt.target, ast.Name):
            kind = var_type(stmt.annotation, source)
            if kind is not None and not stmt.target.id.startswith("_"):
                out.append({"name": stmt.target.id, "js": camel(stmt.target.id), "type": kind})
    return out


def def_props(fn: ast.FunctionDef, source: str) -> tuple[list[dict[str, str]], list[str]]:
    def kind(arg: ast.arg) -> str:
        return ast.get_source_segment(source, arg.annotation) if arg.annotation else "Any"

    positional = [a.arg for a in fn.args.posonlyargs + fn.args.args]
    params = [a for a in fn.args.posonlyargs + fn.args.args + fn.args.kwonlyargs]
    props = [{"name": a.arg, "js": camel(a.arg), "type": kind(a)} for a in params]
    return props, positional


def main(root: Path) -> dict:
    pkg = root / "custom_components" / "reflex_silverpoint_react"
    pyproject = (root / "pyproject.toml").read_text()
    version = re.search(r'^version\s*=\s*"([^"]+)"', pyproject, re.M).group(1)
    wraps = re.search(r'SILVERPOINT_VERSION\s*=\s*"([^"]+)"', (pkg / "base.py").read_text()).group(1)

    catalog_src = (pkg / "catalog.py").read_text()
    catalog = ast.parse(catalog_src)
    common_chart: list[dict[str, str]] = []
    charts = []
    for node in ast.walk(catalog):
        if isinstance(node, ast.AnnAssign) and getattr(node.target, "id", "") == "COMMON_PROPS":
            common_chart = prop_docs(node.value)
        if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "ChartInfo":
            k = kwargs(node)
            charts.append(
                {
                    "slug": literal(k["slug"]),
                    "builder": literal(k["factory_name"]),
                    "cls": literal(k["chart"]),
                    "family": literal(k["family"]),
                    "summary": literal(k["summary"]),
                    "props": prop_docs(k["props"]) if "props" in k else [],
                }
            )

    classes: dict[str, tuple[ast.ClassDef, str]] = {}
    builders: dict[str, tuple[str, ast.AST, str]] = {}
    for module in MODULES:
        source = (pkg / f"{module}.py").read_text()
        tree = ast.parse(source)
        for stmt in tree.body:
            if isinstance(stmt, ast.ClassDef):
                classes[stmt.name] = (stmt, source)
            elif isinstance(stmt, ast.Assign) and isinstance(stmt.value, ast.Attribute) and stmt.value.attr == "create":
                for target in stmt.targets:
                    builders[target.id] = ("class", stmt.value.value, source)
            elif isinstance(stmt, ast.FunctionDef) and not stmt.name.startswith("_"):
                builders[stmt.name] = ("def", stmt, source)

    components = []
    for builder, (kind, node, source) in sorted(builders.items()):
        if not (builder.startswith("sp_") or builder == "dashboard") or builder == "sp_trigger":
            continue
        if kind == "class":
            cls = node.id
            props = class_props(classes[cls][0], classes[cls][1]) if cls in classes else []
            positional: list[str] = []
        else:
            props, positional = def_props(node, source)
            # A builder function over a component class of the same name takes the class's props too.
            cls = "Sp" + "".join(part.title() for part in builder.removeprefix("sp_").split("_"))
            if cls in classes:
                given = {p["name"] for p in props}
                props += [p for p in class_props(*classes[cls]) if p["name"] not in given]
            else:
                cls = ""
        props = [p for p in props if p["name"] not in ("children", "props")]
        slug = builder.removeprefix("sp_").replace("_", "-")
        components.append({"slug": slug, "builder": builder, "cls": cls, "props": props, "positional": positional, "deprecated": {}})

    common_ui = class_props(*classes["SilverpointUi"]) if "SilverpointUi" in classes else []
    # `COMMON_PROPS` documents the shared chart props; the chart base class holds them all
    # (`palette` among them), so its props complete the list.
    base_src = (pkg / "base.py").read_text()
    base = next((n for n in ast.parse(base_src).body if isinstance(n, ast.ClassDef) and n.name == "SilverpointChart"), None)
    if base is not None:
        documented = {p["name"] for p in common_chart}
        common_chart += [p for p in class_props(base, base_src) if p["name"] not in documented]
    init = ast.parse((pkg / "__init__.py").read_text())
    exported: list[str] = []
    for node in ast.walk(init):
        if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "__all__" for t in node.targets):
            exported = literal(node.value)
    chart_builders = {c["builder"] for c in charts}
    named = chart_builders | {c["builder"] for c in components} | {"sp_trigger"}
    helpers = sorted(n for n in exported if n[0].islower() and n not in named and not n.startswith("sp_"))

    commit = subprocess.run(["git", "-C", str(root), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    return {
        "schema": 1,
        "package": "reflex-silverpoint-react",
        "version": version,
        "wraps": wraps,
        "derived": f"tools/agent-catalog/reflex/derive.py from reflex-silverpoint-react {commit}",
        "common": {"chart": common_chart, "ui": common_ui},
        "charts": charts,
        "components": components,
        "helpers": helpers,
    }


if __name__ == "__main__":
    json.dump(main(Path(sys.argv[1])), sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
