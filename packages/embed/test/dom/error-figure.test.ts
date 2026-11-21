/** T-308 · an invalid spec in the client (REQ-668, SP031). */
import { describe, expect, test, vi } from 'vitest';
import { defineElement, ELEMENT_NAME, mount, mountAll } from '../../src/client/index';
import { host } from './helpers';

defineElement();

describe('error figure', () => {
  test('REQ-668 · mount draws figure.sp-embed-error[role=alert] naming the error and raises SP031', () => {
    const target = host();
    const onDiagnostic = vi.fn();
    const handle = mount(target, { chart: 'bar-chrt' }, { onDiagnostic });
    const figure = target.querySelector('figure.sp-embed-error');
    expect(figure?.getAttribute('role')).toBe('alert');
    expect(figure?.textContent).toContain('bar-chrt');
    expect(figure?.textContent).toContain('bar-chart');
    expect(target.getAttribute('data-sp-embed-state')).toBe('error');
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: 'SP031', severity: 'error' }));
    expect(handle.getGeometry()).toBeNull();
  });

  test('REQ-668 · in mountAll and in the element, the other charts on the page are unaffected', () => {
    const page = host();
    for (const spec of ['{"chart":"bar-chart"}', '{"chart":', '{"chart":"donut-chart","props":{"colour":1}}', '{"chart":"line-chart"}']) {
      const div = document.createElement('div');
      div.setAttribute('data-sp-embed', '');
      const script = document.createElement('script');
      script.type = 'application/json';
      script.textContent = spec;
      div.append(script);
      page.append(div);
    }
    const element = document.createElement(ELEMENT_NAME);
    const script = document.createElement('script');
    script.type = 'application/json';
    script.textContent = '{"chart":"nope"}';
    element.append(script);
    page.append(element);
    mountAll(page);
    expect(page.querySelectorAll('.sp-root')).toHaveLength(2);
    expect(page.querySelectorAll('figure.sp-embed-error')).toHaveLength(3);
  });

  test('REQ-668 · update with an invalid spec shows the figure; a valid one brings the chart back', () => {
    const target = host();
    const handle = mount(target, { chart: 'bar-chart' });
    handle.update({ chart: 'bar-chart', width: 5 });
    expect(target.querySelector('figure.sp-embed-error')?.textContent).toContain('width 5');
    handle.update({ chart: 'bar-chart' });
    expect(target.querySelector('figure.sp-embed-error')).toBeNull();
    expect(target.querySelector('.sp-root')).not.toBeNull();
  });
});
