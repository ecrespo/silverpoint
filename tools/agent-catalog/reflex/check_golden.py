"""REQ-557 · the Reflex goldens of `generate_code` name only what reflex-silverpoint-react holds.

Usage: python3 -I check_golden.py <golden/reflex> <reflex-catalog.json>

Each file must parse; every name imported from ``reflex_silverpoint_react`` must be a builder or a
helper of the pinned catalog; and every keyword of a builder call must be one of that builder's
props or a prop every chart or component shares. Importing and rendering the components is the
sibling repository's own check (T-247).
"""

import ast
import json
import sys
from pathlib import Path


def main(golden: Path, catalog_path: Path) -> list[str]:
    catalog = json.loads(catalog_path.read_text())
    common = catalog.get("common", {})
    shared_chart = {p["name"] for p in common.get("chart", [])}
    shared_ui = {p["name"] for p in common.get("ui", [])}
    builders: dict[str, set[str]] = {}
    for chart in catalog["charts"]:
        builders[chart["builder"]] = {p["name"] for p in chart["props"]} | shared_chart
    for component in catalog["components"]:
        builders[component["builder"]] = {p["name"] for p in component["props"]} | shared_ui
    known = set(builders) | set(catalog["helpers"])

    problems = []
    for path in sorted(golden.glob("*.py")):
        tree = ast.parse(path.read_text(), filename=str(path))
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module == "reflex_silverpoint_react":
                for alias in node.names:
                    if alias.name not in known:
                        problems.append(f"{path.name}: reflex_silverpoint_react has no {alias.name}")
                    imported.add(alias.asname or alias.name)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in imported:
                allowed = builders.get(node.func.id, set())
                for keyword in node.keywords:
                    if keyword.arg is not None and keyword.arg not in allowed:
                        problems.append(f"{path.name}: {node.func.id} takes no {keyword.arg}")
    return problems


if __name__ == "__main__":
    found = main(Path(sys.argv[1]), Path(sys.argv[2]))
    for problem in found:
        print(problem)
    sys.exit(1 if found else 0)
