/**
 * The embed column of the gates (DD-065, REQ-664): a fixture as a JSON spec, mounted by
 * `@silverpoint/embed/client` in the same harness as the canonical page. The client adopts the
 * ground's stylesheet itself; the page brings only the self-hosted faces and the harness.
 */
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/example-harness/harness.css';
import { mount } from '@silverpoint/embed/client';
import { fixtureById, fixtureSpec, sizeOf } from '@silverpoint/example-harness';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));
const harness = document.querySelector<HTMLElement>('.sp-harness');
if (fixture && harness) {
  harness.dataset.size = sizeOf(fixture);
  mount(harness, fixtureSpec(fixture), { fonts: 'none' });
}
