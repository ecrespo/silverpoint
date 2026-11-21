// T-290 probe, an external file so the strict-CSP page runs it: mounts `[data-sp-embed]` hosts,
// then records when every chart on the page is drawn.
if (window.Silverpoint && document.querySelector('[data-sp-embed]')) window.Silverpoint.mountAll();
window.__drawnAt = performance.now();
