"""T-290: a Jupyter cell whose output is PY-DD-04's shape -- the interactive document, script
inlined, inside a sandboxed srcdoc iframe -- executed and exported to HTML with nbconvert.

Usage: python notebook.py  (writes results/notebook.ipynb and results/notebook.html)
"""
import pathlib
import subprocess
import sys

import nbformat

HERE = pathlib.Path(__file__).parent
CELL = r'''
import html, json, pathlib
from IPython.display import HTML

class Chart:
    """The shape PY-REQ-007 specifies, written by hand for the PoC."""
    def __init__(self, spec):
        self.spec = spec
    def _repr_mimebundle_(self, include=None, exclude=None):
        script = pathlib.Path(SCRIPT).read_text().replace("</script", "<\\/script")
        data = json.dumps(self.spec).replace("<", "\\u003c")
        doc = (f'<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,">'
               f'<script>{script}</script></head><body><silverpoint-chart>'
               f'<script type="application/json">{data}</script></silverpoint-chart>'
               f'<script>window.__drawnAt=performance.now()</script></body></html>')
        frame = f'<iframe sandbox="allow-scripts" width="640" height="460" style="border:0" srcdoc="{html.escape(doc, quote=True)}"></iframe>'
        return {"text/html": frame}

Chart({"chart": "radar-chart", "width": 600})
'''
# The kernel runs in results/; the vendored file is passed by absolute path.
CELL = f'SCRIPT = {str(HERE / "dist" / "silverpoint-embed.full.js")!r}\n' + CELL

nb = nbformat.v4.new_notebook()
nb.cells = [nbformat.v4.new_code_cell(CELL)]
(HERE / "results").mkdir(exist_ok=True)
path = HERE / "results" / "notebook.ipynb"
nbformat.write(nb, path)
subprocess.run([sys.executable, "-m", "jupyter", "nbconvert", "--to", "html", "--execute", str(path)], check=True)
print(HERE / "results" / "notebook.html")
