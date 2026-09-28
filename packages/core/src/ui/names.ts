import { diagnose } from '../diagnostics/diagnose';

/**
 * A Button or Badge needs an accessible name: its text content or a `label`. Without either it
 * still renders, and warns `SP018` in development (REQ-319).
 */
export function uiRequireName(component: string, text: string | undefined, label: string | undefined): void {
  if (process.env.NODE_ENV === 'production') return;
  if (text?.trim() || label?.trim()) return;
  diagnose('SP018', component, { property: 'label' });
}
