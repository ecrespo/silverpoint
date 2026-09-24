# Delta 001 — TypeScript 6 for the Angular 22 build

| Field | Value |
|---|---|
| **Status** | `PROPOSED` |
| **Affects** | Constitution stack table (TypeScript 5.x); Technical Design §10 (Angular 21 and 22) |
| **Raised by** | T-001, 2026-09-24 |

## Finding

The Constitution pins **TypeScript 5.x**. The Technical Design supports **Angular 21 and 22**.
Angular 22's compiler (`@angular/compiler-cli` 22.x) requires **TypeScript ≥ 6.0 < 6.1**, so
the two constraints cannot both hold for a build with Angular 22.

## What Phase 0 does meanwhile

`@silverpoint/angular` is compiled with Angular 21.2 and TypeScript 5.9 in partial
compilation mode. Partial declarations are linked by newer Angular versions, so the published
package keeps its `>=21 <23` peer range.

## Proposal

Amend the stack table to "TypeScript 5.9+ (6.x where a supported framework requires it)",
and add an Angular 22 consumer job to CI once the amendment is approved.

## Constitution check

- **Art. 8** — peers unchanged. **Art. 9** — this delta is how the deviation enters.
- **Exception requested:** none yet; the amendment is the request.
