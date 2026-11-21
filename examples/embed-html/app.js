// The page's own script (an external file, so the strict-CSP page can run it too).
(function () {
  var target = document.getElementById('api');
  var log = document.getElementById('log');
  var write = function (line) { log.textContent = (line + '\n' + log.textContent).slice(0, 2000); };
  if (!target || !window.Silverpoint) return;
  var handle = window.Silverpoint.mount(target, { chart: 'line-chart', id: 'hits', props: { title: 'Hits per hour' } }, {
    onActiveChange: function (item) { write('active ' + (item ? item.seriesKey + ' #' + item.index : 'none')); },
    onSelect: function (item) { write('select ' + item.seriesKey + ' #' + item.index); },
  });
  document.addEventListener('sp-select', function (e) { write('event sp-select ' + e.detail.index); });
  document.getElementById('update').addEventListener('click', function () {
    handle.update({ chart: 'line-chart', id: 'hits', mode: 'precision', props: { title: 'Hits per hour (precision)' } });
    write('updated');
  });
  document.getElementById('destroy').addEventListener('click', function () {
    handle.destroy();
    write('destroyed');
  });
  window.__handle = handle;
})();
